
export interface TestValidationResult {
  condition: string;
  passed: boolean;
  error?: string;
}

export const testRunnerService = {
  runTests(tests: string[], results: Record<string, any>): TestValidationResult[] {
    if (!tests || tests.length === 0) return [];

    return tests.map(condition => {
      try {
        // Create a safe-ish context for evaluation
        // 'response' refers to the combined results or the last one?
        // Let's provide 'results' as the direct map and 'response' as a helper
        
        const nodeIds = Object.keys(results);
        const lastNodeId = nodeIds[nodeIds.length - 1];
        const lastResponse = lastNodeId ? results[lastNodeId].data : null;

        // Simple runner using new Function
        // We pass 'results' and 'response' (alias for last node's data)
        const runner = new Function('results', 'response', `
          try {
            return !!(${condition});
          } catch (e) {
            return e;
          }
        `);

        const result = runner(results, lastResponse);
        
        if (result instanceof Error) {
          return { condition, passed: false, error: result.message };
        }

        return { condition, passed: !!result };
      } catch (err: any) {
        return { condition, passed: false, error: err.message };
      }
    });
  }
};
