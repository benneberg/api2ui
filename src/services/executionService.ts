import { type jdCard } from "../types";
import { mockDataService } from "./mockDataService";

export const executionService = {
  async executeNode(node: any, writeEnabled: boolean): Promise<any> {
    const isMutation = !node.capability.isRead;
    
    if (isMutation && !writeEnabled) {
      throw new Error(`MUTATION_BLOCKED: Write mode disabled for ${node.id}`);
    }

    const { url, method } = this.resolveUrlAndMethod(node);
    
    try {
      // Use the backend proxy to avoid CORS issues
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          method,
          body: node.input || undefined
        })
      });

      const contentType = response.headers.get('content-type');
      if (!response.ok) {
        let errorData;
        if (contentType?.includes('application/json')) {
          errorData = await response.json();
        } else {
          errorData = { error: await response.text() };
        }
        throw new Error(errorData.error || `HTTP ${response.status} from ${url}`);
      }

      if (contentType?.includes('application/json')) {
        return await response.json();
      } else {
        const text = await response.text();
        // Try to see if it's text that looks like a message
        return { message: text };
      }
    } catch (err: any) {
      console.error("Execution Error:", err);
      throw err;
    }
  },

  resolveUrlAndMethod(node: any) {
    let url = node.capability.path;
    const method = node.capability.method;
    const params = { ...(node.input || {}), ...(node.bindings || {}) };

    // Resolve path parameters: /user/{username} -> /user/ben
    if (url.includes('{')) {
      const pathParams = url.match(/\{([^}]+)\}/g);
      pathParams?.forEach(placeholder => {
        const key = placeholder.replace(/[{}]/g, '');
        if (params[key]) {
          url = url.replace(placeholder, String(params[key]));
        } else {
          // Fallback to mock value if missing
          const paramSchema = node.capability.inputSchema?.properties?.[key] || { type: 'string' };
          const mockVal = mockDataService.generateObject(paramSchema);
          url = url.replace(placeholder, String(mockVal));
        }
      });
    }
    
    return { url, method };
  }
};
