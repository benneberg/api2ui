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
        
        // Repair: Synthesize summary if missing
        let summary = typedDetails.summary || typedDetails.description;
        if (!summary) {
          const pathParts = path.split('/').filter(p => p && !p.startsWith('{'));
          summary = `${method.toUpperCase()} ${pathParts.join(' ')}`.trim() || `Execution at ${path}`;
        }

        // Repair: Generate operationId if missing
        const operationId = typedDetails.operationId || `${method}_${path.replace(/[^a-zA-Z0-9]/g, '_')}`;
        
        capabilities.push({
          id: `${method.toUpperCase()} ${path}`,
          path,
          method: method.toUpperCase(),
          summary,
          isRead,
          operationId,
          inputSchema: this.normalizeSchema(typedDetails.parameters || typedDetails.requestBody),
          outputSchema: this.normalizeSchema(typedDetails.responses?.['200']?.content?.['application/json']?.schema)
        });
      }
    }

    return { capabilities, validationErrors };
  }

  private normalizeSchema(schema: any): any {
    if (!schema) return undefined;
    
    // Repair: Heuristic for missing types if default exists
    if (!schema.type && schema.default !== undefined) {
      schema.type = typeof schema.default;
    }
    
    // Repair: Missing descriptions in schema properties
    if (schema.type === 'object' && schema.properties) {
      for (const [propName, prop] of Object.entries(schema.properties as Record<string, any>)) {
        if (!prop.description) {
          prop.description = `The ${propName} property`;
        }
      }
    }

    return schema;
  }
}

export const openApiService = new OpenApiService();
