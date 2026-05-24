import Ajv from "ajv";
import addFormats from "ajv-formats";
import { type Capability } from "../types";

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
  async fetchAndNormalize(url: string): Promise<{ capabilities: Capability[], validationErrors?: string[] }> {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch spec");
    
    const spec = await response.json();
    
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
    const validationErrors = !valid ? validateSpec.errors?.map(e => `${e.instancePath} ${e.message}`) : undefined;

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
          summary = `${method.toUpperCase()} ${pathParts.join(' ')}`.trim() || `Execution at ${path}`;
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
          summary: this.toSentenceCase(summary),
          isRead,
          operationId: this.toCamelCase(operationId),
          inputSchema: this.normalizeSchema(typedDetails.parameters || typedDetails.requestBody, spec),
          outputSchema: this.normalizeSchema(typedDetails.responses?.['200']?.content?.['application/json']?.schema, spec),
          safetyClassification
        });
      }
    }

    return { capabilities, validationErrors };
  }

  private resolveRef(obj: any, root: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    if (obj.$ref && typeof obj.$ref === 'string') {
      const parts = obj.$ref.split('/');
      if (parts[0] === '#') {
        let current = root;
        for (let i = 1; i < parts.length; i++) {
          current = current ? current[parts[i]] : undefined;
        }
        return current || { type: 'string', description: 'Broken Reference' };
      }
    }
    return obj;
  }

  private normalizeSchema(schema: any, root: any, depth = 0): any {
    if (!schema || depth > 10) return schema;
    
    // Resolve references
    schema = this.resolveRef(schema, root);
    if (!schema || typeof schema !== 'object') return schema;

    // Handle allOf by merging (basic heuristic)
    if (schema.allOf && Array.isArray(schema.allOf)) {
      const merged = { ...schema };
      delete merged.allOf;
      for (const subSchema of schema.allOf) {
        const resolvedSub = this.normalizeSchema(subSchema, root, depth + 1);
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
      normalized.items = this.normalizeSchema(normalized.items, root, depth + 1);
    }

    // Property handling
    if (normalized.properties) {
      const newProps: Record<string, any> = {};
      for (const [name, prop] of Object.entries(normalized.properties as Record<string, any>)) {
        const normalizedProp = this.normalizeSchema(prop, root, depth + 1);
        
        // Repair: Missing description
        if (!normalizedProp.description) {
          normalizedProp.description = `Value for ${this.toSentenceCase(name)}`;
        }

        // Repair: Type inference
        if (!normalizedProp.type) {
          if (normalizedProp.enum) normalizedProp.type = 'string';
          else if (normalizedProp.default !== undefined) normalizedProp.type = typeof normalizedProp.default;
          else if (normalizedProp.example !== undefined) normalizedProp.type = typeof normalizedProp.example;
          else if (normalizedProp.properties) normalizedProp.type = 'object';
          else if (normalizedProp.items) normalizedProp.type = 'array';
          else normalizedProp.type = 'string'; // Final fallback
        }

        newProps[name] = normalizedProp;
      }
      normalized.properties = newProps;
    }

    // Direct type inference for the root of this schema slice
    if (!normalized.type && !normalized.properties && !normalized.items) {
      if (normalized.enum) normalized.type = 'string';
      else if (normalized.default !== undefined) normalized.type = typeof normalized.default;
      else if (normalized.example !== undefined) normalized.type = typeof normalized.example;
      else normalized.type = 'object'; // Assume object if it represents a body component
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
