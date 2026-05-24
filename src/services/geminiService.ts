import { type Capability, type Intent, type AIProvider } from "../types";

export class InferenceService {
  async extractIntent(
    description: string, 
    capabilities: Capability[], 
    provider: AIProvider = 'gemini',
    modelName: string = "gemini-1.5-flash", 
    customApiKey?: string
  ): Promise<Intent> {
    const response = await fetch('/api/ai/extract', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description,
        capabilities,
        modelName,
        customApiKey,
        provider
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to extract intent");
    }

    return await response.json();
  }

  async fetchModels(provider: AIProvider): Promise<any[]> {
    const response = await fetch(`/api/ai/models/${provider}`);
    if (!response.ok) return [];
    return await response.json();
  }
}

export const inferenceService = new InferenceService();
