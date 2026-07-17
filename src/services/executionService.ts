import { type JDCard, type ExecutionNode } from "../types";
import { mockDataService } from "./mockDataService";

export const executionService = {
  async runGraph(
    jdCard: JDCard, 
    writeEnabled: boolean, 
    onProgress?: (stepId: string, result: any) => void,
    onStart?: (stepId: string) => void,
    onFailure?: (stepId: string, error: any) => void
): Promise<Record<string, any>> {
    const results: Record<string, any> = {};
    const nodes = Object.values(jdCard.executionGraph.nodes);
    
    const completed = new Set<string>();
    const running = new Set<string>();
    
    const getDependencies = (node: ExecutionNode): string[] => {
      const deps: string[] = [];
      const checkValue = (val: any) => {
        if (typeof val === 'string') {
          const matches = val.match(/\{\{([^}]+)\}\}/g);
          if (matches) {
            matches.forEach(m => {
              const inner = m.slice(2, -2).trim();
              const parts = inner.split('.');
              if (parts[0] && parts[0] !== 'iterator') {
                deps.push(parts[0]);
              }
            });
          }
        } else if (typeof val === 'object' && val !== null) {
          Object.values(val).forEach(checkValue);
        }
      };
      
      checkValue(node.parameters);
      if (node.iterator) {
        checkValue(node.iterator);
      }
      return Array.from(new Set(deps)).filter(d => jdCard.executionGraph.nodes[d]);
    };

    while (completed.size < nodes.length) {
      const readyNodes = nodes.filter(node => 
        !completed.has(node.id) && 
        !running.has(node.id) &&
        getDependencies(node).every(depId => completed.has(depId))
      );

      if (readyNodes.length === 0) {
        if (completed.size < nodes.length) {
          console.warn("Circular dependency or unreachable nodes detected in execution graph.");
        }
        break;
      }

      await Promise.all(readyNodes.map(async (node) => {
        running.add(node.id);
        onStart?.(node.id);
        try {
          const resolvedParams = this.resolveBindings(node.parameters, results);
          
          let result: any;
          if (node.iterator) {
            const list = this.resolveValue(node.iterator, results) || [];
            result = await Promise.all(list.map(async (item: any) => {
              const iterParams = { ...resolvedParams, ...this.resolveBindings(node.parameters, { iterator: { item } }) };
              return this.executeRequest(node, iterParams, writeEnabled);
            }));
          } else {
            result = await this.executeRequest(node, resolvedParams, writeEnabled);
          }

          results[node.id] = { data: result, node };
          onProgress?.(node.id, result);
          completed.add(node.id);
        } catch (err: any) {
          console.error(`Node ${node.id} failed:`, err);
          onFailure?.(node.id, err);
          if (node.onFailure === 'TRIGGER_SAGA_ROLLBACK') {
            await this.rollback(jdCard, results, writeEnabled);
            throw new Error(`Execution halted. Saga rollback triggered: ${err.message}`);
          }
          completed.add(node.id);
        } finally {
          running.delete(node.id);
        }
      }));
    }

    return results;
  },

  async rollback(jdCard: JDCard, results: Record<string, any>, writeEnabled: boolean) {
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
          } as any, compParams, writeEnabled);
        } catch (e) {
          console.error(`Compensation failed for ${id}:`, e);
        }
      }
    }
  },

  async executeRequest(node: ExecutionNode, params: any, writeEnabled: boolean): Promise<any> {
    if (node.type === 'MUTATION' && !writeEnabled) {
      throw new Error("MUTATION_BLOCKED: Read-only mode.");
    }

    const satisfiedParams = this.satisfyParameters(node, params);
    const { url, method, body } = this.buildRequest(node, satisfiedParams);
    
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
