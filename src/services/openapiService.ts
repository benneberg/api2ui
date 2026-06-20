import Ajv from "ajv";
import addFormats from "ajv-formats";
import { type Capability, type RepairReport, type RepairIssue } from "../types";

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

// Simplified OpenAPI 3.0 schema for basic structure validation
const openApiSchema = {
  type: "object",
  properties: {
    openapi: { type: "string" },
    info: { type: "object", required: ["title", "version"] },
    paths: { type: "object" }
  },
  required: ["openapi", "info", "paths"]
};

const validateSpec = ajv.compile(openApiSchema);

export class OpenApiService {
  private currentIssues: RepairIssue[] = [];
  private fixedCount = 0;

  async fetchAndNormalize(url: string, autoFix = true): Promise<{ 
    capabilities: Capability[], 
    validationErrors?: string[],
    repairReport: RepairReport 
  }> {
    this.currentIssues = [];
    this.fixedCount = 0;

    let spec: any;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch spec");
      spec = await response.json();
    } catch (err) {
      this.addIssue({
        type: 'INVALID_JSON',
        severity: 'HIGH',
        location: url,
        message: 'The URL did not return a valid JSON OpenAPI specification.'
      });
      return { capabilities: [], repairReport: this.getReport() };
    }

    // Determine Base URL for Execution
    let baseUrl = '';
    if (spec.servers && spec.servers.length > 0) {
      baseUrl = spec.servers[0].url;
    }
    
    // If baseUrl is relative, or missing, fallback to calculating from spec URL
    if (!baseUrl || baseUrl.startsWith('/')) {
      const urlObj = new URL(url);
      const host = `${urlObj.protocol}//${urlObj.host}`;
      baseUrl = baseUrl ? host + baseUrl : host;
    }

    // 1. Validation Step
    const valid = validateSpec(spec);
    if (!valid) {
      validateSpec.errors?.forEach(e => {
        this.addIssue({
          type: 'MALFORMED_SPEC',
          severity: 'MEDIUM',
          location: e.instancePath || 'root',
          message: e.message || 'Validation error'
        });
      });
    }

    // 2. Normalization & Heuristics
    const capabilities: Capability[] = [];
    const paths = spec.paths || {};

    for (const [path, methods] of Object.entries(paths)) {
      if (typeof methods !== 'object' || methods === null) continue;
      
      for (const [method, details] of Object.entries(methods)) {
        if (typeof details !== 'object' || details === null) continue;
        
        const typedDetails = details as any;
        const isRead = ['get', 'head', 'options'].includes(method.toLowerCase());
        
        // Full Path for Execution
        const fullPath = path.startsWith('http') ? path : (baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl) + path;
        
        // Repair: Synthesize summary if missing
        let summary = typedDetails.summary || typedDetails.description;
        if (!summary) {
          const pathParts = path.split('/').filter(p => p && !p.startsWith('{'));
          const suggested = `${method.toUpperCase()} ${pathParts.join(' ')}`.trim() || `Execution at ${path}`;
          this.addIssue({
            type: 'MISSING_SUMMARY',
            severity: 'LOW',
            location: `${method.toUpperCase()} ${path}`,
            message: 'Endpoint is missing a summary or description.',
            heuristic: 'Path segments synthesis',
            suggestion: suggested
          });
          if (autoFix) {
            summary = suggested;
            this.fixedCount++;
          }
        }

        // Repair: Generate operationId if missing
        const operationId = typedDetails.operationId || `${method}_${path.replace(/[^a-zA-Z0-9]/g, '_')}`;
        
        // Safety Classification Logic
        const hasAuth = !!(typedDetails.security || spec.security);
        let safetyClassification: Capability['safetyClassification'] = isRead ? 'READ_ONLY' : 'MUTATES_DATA';
        if (hasAuth) safetyClassification = 'REQUIRES_AUTH';

        capabilities.push({
          id: `${method.toUpperCase()} ${path}`,
          path: fullPath,
          method: method.toUpperCase(),
          summary: this.toSentenceCase(summary || ''),
          isRead,
          operationId: this.toCamelCase(operationId),
          inputSchema: this.normalizeInput(typedDetails.parameters, typedDetails.requestBody, spec, `${method.toUpperCase()} ${path} (Input)`, autoFix),
          outputSchema: this.normalizeSchema(typedDetails.responses?.['200']?.content?.['application/json']?.schema, spec, `${method.toUpperCase()} ${path} (Output)`, autoFix),
          safetyClassification
        });
      }
    }

    return { 
      capabilities, 
      validationErrors: !valid ? validateSpec.errors?.map(e => `${e.instancePath} ${e.message}`) : undefined,
      repairReport: this.getReport()
    };
  }

  private addIssue(issue: RepairIssue) {
    this.currentIssues.push(issue);
  }

  private getReport(): RepairReport {
    return {
      timestamp: new Date().toISOString(),
      issues: [...this.currentIssues],
      fixedIssues: this.fixedCount
    };
  }

  private normalizeInput(parameters: any[] | undefined, requestBody: any | undefined, spec: any, location: string, autoFix: boolean): any {
    let combinedSchema: any = { type: 'object', properties: {} };

    if (parameters && Array.isArray(parameters)) {
      parameters.forEach((param, i) => {
        const resolvedParam = this.resolveRef(param, spec, `${location}.param[${i}]`, autoFix);
        if (resolvedParam && resolvedParam.name) {
          const paramSchema = resolvedParam.schema || { type: 'string' };
          const normalized = this.normalizeSchema(paramSchema, spec, `${location}.${resolvedParam.name}`, autoFix);
          // Preserve parameter location
          normalized._in = resolvedParam.in || 'query';
          combinedSchema.properties[resolvedParam.name] = normalized;
          if (resolvedParam.description) {
            combinedSchema.properties[resolvedParam.name].description = resolvedParam.description;
          }
        }
      });
    }

    if (requestBody) {
      const resolvedBody = this.resolveRef(requestBody, spec, `${location}.requestBody`, autoFix);
      const bodyContent = resolvedBody?.content?.['application/json']?.schema || resolvedBody?.schema;
      if (bodyContent) {
        const normalizedBody = this.normalizeSchema(bodyContent, spec, `${location}.body`, autoFix);
        if (normalizedBody.properties) {
          // Mark body properties
          Object.keys(normalizedBody.properties).forEach(k => {
            normalizedBody.properties[k]._in = 'body';
          });
          combinedSchema.properties = { ...combinedSchema.properties, ...normalizedBody.properties };
        } else {
          normalizedBody._in = 'body';
          combinedSchema.properties['_body'] = normalizedBody;
        }
      }
    }

    return combinedSchema;
  }

  private resolveRef(obj: any, root: any, location: string, autoFix: boolean): any {
    if (!obj || typeof obj !== 'object') return obj;
    if (obj.$ref && typeof obj.$ref === 'string') {
      const parts = obj.$ref.split('/');
      if (parts[0] === '#') {
        let current = root;
        for (let i = 1; i < parts.length; i++) {
          current = current ? current[parts[i]] : undefined;
        }
        if (!current) {
          this.addIssue({
            type: 'BROKEN_REF',
            severity: 'HIGH',
            location,
            message: `Reference ${obj.$ref} could not be resolved.`,
            heuristic: 'Fallback to string',
            suggestion: { type: 'string' }
          });
          if (autoFix) {
            this.fixedCount++;
            return { type: 'string', description: 'Repaired Reference' };
          }
        }
        return current;
      }
    }
    return obj;
  }

  private normalizeSchema(schema: any, root: any, location: string, autoFix: boolean, depth = 0): any {
    if (!schema || depth > 10) return schema;
    
    // Resolve references
    schema = this.resolveRef(schema, root, location, autoFix);
    if (!schema || typeof schema !== 'object') return schema;

    // Handle allOf by merging (basic heuristic)
    if (schema.allOf && Array.isArray(schema.allOf)) {
      const merged = { ...schema };
      delete merged.allOf;
      for (const subSchema of schema.allOf) {
        const resolvedSub = this.normalizeSchema(subSchema, root, location, autoFix, depth + 1);
        if (resolvedSub && typeof resolvedSub === 'object') {
          Object.assign(merged, resolvedSub);
          if (resolvedSub.properties) {
            merged.properties = { ...(merged.properties || {}), ...resolvedSub.properties };
          }
        }
      }
      schema = merged;
    }

    // Deep copy to avoid mutating original spec
    const normalized = Array.isArray(schema) ? [...schema] : { ...schema };

    // Array handling
    if (normalized.items) {
      normalized.items = this.normalizeSchema(normalized.items, root, location, autoFix, depth + 1);
    }

    // Property handling
    if (normalized.properties) {
      const newProps: Record<string, any> = {};
      for (const [name, prop] of Object.entries(normalized.properties as Record<string, any>)) {
        const normalizedProp = this.normalizeSchema(prop, root, `${location}.${name}`, autoFix, depth + 1);
        
        // Repair: Missing description
        if (!normalizedProp.description) {
          normalizedProp.description = `Value for ${this.toSentenceCase(name)}`;
        }

        // Repair: Type inference
        if (!normalizedProp.type) {
          let inferredType = 'string';
          if (normalizedProp.enum) inferredType = 'string';
          else if (normalizedProp.default !== undefined) inferredType = typeof normalizedProp.default;
          else if (normalizedProp.example !== undefined) inferredType = typeof normalizedProp.example;
          else if (normalizedProp.properties) inferredType = 'object';
          else if (normalizedProp.items) inferredType = 'array';

          this.addIssue({
            type: 'MISSING_TYPE',
            severity: 'MEDIUM',
            location: `${location}.${name}`,
            message: `Property '${name}' is missing a type definition.`,
            heuristic: 'Type inference from usage context',
            suggestion: inferredType
          });

          if (autoFix) {
            normalizedProp.type = inferredType;
            this.fixedCount++;
          }
        }

        newProps[name] = normalizedProp;
      }
      normalized.properties = newProps;
    }

    // Direct type inference for the root of this schema slice
    if (!normalized.type && !normalized.properties && !normalized.items) {
      let inferredType = 'object';
      if (normalized.enum) inferredType = 'string';
      else if (normalized.default !== undefined) inferredType = typeof normalized.default;
      else if (normalized.example !== undefined) inferredType = typeof normalized.example;

      this.addIssue({
        type: 'MISSING_TYPE',
        severity: 'MEDIUM',
        location,
        message: 'Schema fragment is missing a type definition.',
        heuristic: 'Inferred based on content',
        suggestion: inferredType
      });

      if (autoFix) {
        normalized.type = inferredType;
        this.fixedCount++;
      }
    }

    return normalized;
  }

  private toCamelCase(str: string): string {
    return str
      .replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase())
      .replace(/^[A-Z]/, c => c.toLowerCase());
  }

  private toSentenceCase(str: string): string {
    const result = str.replace(/([A-Z])/g, " $1");
    return result.charAt(0).toUpperCase() + result.slice(1).toLowerCase().trim();
  }
}

export const openApiService = new OpenApiService();
