import { GoogleGenAI, Type } from "@google/genai";
import { type Capability, type Intent } from "../types";

export class GeminiService {
  async extractIntent(description: string, capabilities: Capability[], modelName: string = "gemini-1.5-flash", customApiKey?: string): Promise<Intent> {
    const response = await fetch('/api/gemini/extract', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description,
        capabilities,
        modelName,
        customApiKey
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to extract intent");
    }

    return await response.json();
  }
}

export const geminiService = new GeminiService();
