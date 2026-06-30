import { type JDCard, type ExecutionNode } from "../types";
import { mockDataService } from "./mockDataService";

export const executionService = {
  async runGraph(jdCard: JDCard, writeEnabled: boolean, onProgress?: (stepId: string, result: any) => void, simulate = false): Promise<Record<string, any>> {
    const results: Record<string, any> = {};
    let currentNodeId: string | 'END' = jdCard.executionGraph.rootNode;

    while (currentNodeId !== 'END') {
      const node = jdCard.executionGraph.nodes[currentNodeId];
      if (!node) break;

      try {
        const resolvedParams = this.resolveBindings(node.parameters, results);
        
        let result: any;
        if (node.iterator) {
          const list = this.resolveValue(node.iterator, results) || [];
          result = await Promise.all(list.map(async (item: any) => {
            const iterParams = { ...resolvedParams, ...this.resolveBindings(node.parameters, { iterator: { item } }) };
            return this.executeRequest(node, iterParams, writeEnabled, simulate);
          }));
        } else {
          result = await this.executeRequest(node, resolvedParams, writeEnabled, simulate);
        }

        results[currentNodeId] = { data: result, node };
        onProgress?.(currentNodeId, result);

        currentNodeId = node.onSuccess as any;
      } catch (err: any) {
        console.error(`Node ${currentNodeId} failed:`, err);
        if (node.onFailure === 'TRIGGER_SAGA_ROLLBACK') {
          await this.rollback(jdCard, results, writeEnabled, simulate);
          throw new Error(`Execution halted. Saga rollback triggered: ${err.message}`);
        }
        currentNodeId = node.onFailure as any || 'END';
      }
    }

    return results;
  },

  async rollback(jdCard: JDCard, results: Record<string, any>, writeEnabled: boolean, simulate = false) {
    console.warn("SAGA_ROLLBACK_INITIATED");
    const nodeIds = Object.keys(results).reverse();
    for (const id of nodeIds) {
      const node = jdCard.executionGraph.nodes[id];
      if (node?.compensation) {
        console.log(`Executing compensation for ${id}`);
        try {
          const compParams = this.resolveBindings(node.compensation.parameters, results);
          await this.executeRequest({ 
            verb: node.compensation.verb, 
            path: node.compensation.path,
            capability: node.capability 
          } as any, compParams, writeEnabled, simulate);
        } catch (e) {
          console.error(`Compensation failed for ${id}:`, e);
        }
      }
    }
  },

  async executeRequest(node: ExecutionNode, params: any, writeEnabled: boolean, simulate = false): Promise<any> {
    if (!simulate && node.type === 'MUTATION' && !writeEnabled) {
      throw new Error("MUTATION_BLOCKED: Read-only mode.");
    }

    const satisfiedParams = this.satisfyParameters(node, params);
    const { url, method, body } = this.buildRequest(node, satisfiedParams);

    // Simulation mode: never touch the live host. Synthesize a realistic,
    // schema-aware response from the capability's declared output schema.
    if (simulate) {
      return mockDataService.generateFromSchema(node.capability?.outputSchema);
    }

    const response = await fetch('/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, method, body })
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = { error: text };
    }

    if (!response.ok) {
      throw new Error(data.error || data.message || `Execution failed: ${response.status}`);
    }
    return data;
  },

  satisfyParameters(node: ExecutionNode, params: any): any {
    const satisfied = { ...params };
    const schema = node.capability?.inputSchema;
    if (!schema) return satisfied;

    const required = schema.required || [];
    required.forEach((key: string) => {
      if (satisfied[key] === undefined || satisfied[key] === null || satisfied[key] === '') {
        const prop = schema.properties?.[key];
        
        // 1. Check for defaults
        if (prop?.default !== undefined) {
          satisfied[key] = prop.default;
        } 
        // 2. Check for enums
        else if (prop?.enum && prop.enum.length > 0) {
          satisfied[key] = prop.enum[0];
        }
        // 3. Hardcoded heuristics for common Petstore/API patterns
        else if (key === 'status') {
          satisfied[key] = 'available';
        }
        else if (key === 'tags') {
          satisfied[key] = ['tag1'];
        }
        // 4. Fallback to mock generation
        else if (prop) {
          satisfied[key] = mockDataService.generateField(key, prop);
        }
      }
    });

    return satisfied;
  },

  buildRequest(node: ExecutionNode, params: any) {
    let url = node.path || node.capability?.path || "";
    const method = node.verb || node.capability?.method || "GET";
    const used = new Set<string>();

    // Path params
    if (url.includes('{')) {
      url = url.replace(/\{([^}]+)\}/g, (match, key) => {
        used.add(key);
        return encodeURIComponent(String(params[key] || ""));
      });
    }

    // Query vs Body
    const query = new URLSearchParams();
    const body: any = {};
    let hasBody = false;

    Object.entries(params).forEach(([k, v]) => {
      if (used.has(k)) return;
      if (method === 'GET') {
        query.append(k, String(v));
      } else {
        body[k] = v;
        hasBody = true;
      }
    });

    const qs = query.toString();
    if (qs) url += (url.includes('?') ? '&' : '?') + qs;

    return { url, method, body: hasBody ? body : undefined };
  },

  resolveBindings(bindings: Record<string, any>, context: any): any {
    const resolved: any = {};
    for (const [key, val] of Object.entries(bindings)) {
      if (typeof val === 'string' && val.startsWith('{{') && val.endsWith('}}')) {
        resolved[key] = this.resolveValue(val.slice(2, -2), context);
      } else if (typeof val === 'object' && val !== null) {
        resolved[key] = this.resolveBindings(val, context);
      } else {
        resolved[key] = val;
      }
    }
    return resolved;
  },

  resolveValue(path: string, context: any): any {
    return path.split('.').reduce((obj, key) => obj?.[key], context);
  }
};
