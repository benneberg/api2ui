import { type jdCard } from "../types";

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

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status} from ${node.capability.path}`);
      }

      return await response.json();
    } catch (err: any) {
      console.error("Execution Error:", err);
      throw err;
    }
  },

  resolveUrlAndMethod(node: any) {
    let url = node.capability.path;
    const method = node.capability.method;

    // Relative URLs should be resolved against the spec URL if possible
    // For now, we'll assume the URL is absolute or the proxy handles it
    // Actually, common Specs use relative paths. 
    // We should probably check the base URL if available in metadata.
    
    return { url, method };
  }
};
