import { type jdCard } from "../types";
import { mockDataService } from "./mockDataService";

export const executionService = {
  async executeNode(node: any, writeEnabled: boolean): Promise<any> {
    const isMutation = !node.capability.isRead;
    
    if (isMutation && !writeEnabled) {
      throw new Error(`MUTATION_BLOCKED: Write mode disabled for ${node.id}`);
    }

    const { url, method, bodyParams } = this.resolveUrlAndMethod(node);
    
    try {
      // Use the backend proxy to avoid CORS issues
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          method,
          body: method !== 'GET' ? bodyParams : undefined
        })
      });

      const text = await response.text();
      const contentType = response.headers.get('content-type');
      let data: any;

      if (contentType?.includes('application/json')) {
        try {
          data = JSON.parse(text);
        } catch (e) {
          data = { message: text };
        }
      } else {
        data = { message: text };
      }

      if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP ${response.status} from ${url}`);
      }

      return data;
    } catch (err: any) {
      console.error("Execution Error:", err);
      throw err;
    }
  },

  resolveUrlAndMethod(node: any) {
    let url = node.capability.path;
    const method = node.capability.method;
    const allParams = { ...(node.input || {}), ...(node.bindings || {}) };
    const usedParams = new Set<string>();

    // Resolve path parameters: /user/{username} -> /user/ben
    if (url.includes('{')) {
      const pathParams = url.match(/\{([^}]+)\}/g);
      pathParams?.forEach(placeholder => {
        const key = placeholder.replace(/[{}]/g, '');
        usedParams.add(key);
        if (allParams[key] !== undefined) {
          url = url.replace(placeholder, encodeURIComponent(String(allParams[key])));
        } else {
          // Fallback to mock value if missing
          const paramSchema = node.capability.inputSchema?.properties?.[key] || { type: 'string' };
          const mockVal = mockDataService.generateObject(paramSchema);
          url = url.replace(placeholder, encodeURIComponent(String(mockVal)));
        }
      });
    }

    // Handle Query Parameters for GET requests
    if (method === 'GET') {
      const queryParams = new URLSearchParams();
      Object.entries(allParams).forEach(([key, value]) => {
        if (!usedParams.has(key) && value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach(v => queryParams.append(key, String(v)));
          } else {
            queryParams.append(key, String(value));
          }
        }
      });
      const queryString = queryParams.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }

    // Determine body parameters (anything not used in URL)
    let bodyParams: any = undefined;
    if (method !== 'GET' && method !== 'HEAD') {
      if (allParams['_body'] !== undefined) {
        bodyParams = allParams['_body'];
      } else {
        const filtered: Record<string, any> = {};
        let hasBody = false;
        Object.entries(allParams).forEach(([key, value]) => {
          if (!usedParams.has(key) && key !== '_body') {
            filtered[key] = value;
            hasBody = true;
          }
        });
        if (hasBody) bodyParams = filtered;
      }
    }
    
    return { url, method, bodyParams };
  }
};
