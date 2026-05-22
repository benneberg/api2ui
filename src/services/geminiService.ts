import { GoogleGenAI, Type } from "@google/genai";
import { type Capability, type Intent } from "../types";

export class GeminiService {
  private ai: GoogleGenAI | null = null;

  configure(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async extractIntent(description: string, capabilities: Capability[], modelName: string = "gemini-1.5-flash"): Promise<Intent> {
    if (!this.ai) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not configured. Please add it to Secrets or provided it in Settings.");
      }
      this.ai = new GoogleGenAI({ apiKey });
    }
    const capabilityContext = capabilities
      .filter(c => c.isRead) // Safety first
      .map(c => `- ${c.id}: ${c.summary}`)
      .slice(0, 100)
      .join("\n");

    const prompt = `You are a precise API Orchestration Planner.
Your goal is to map user intent to specific API capabilities.
USER INTENT: "${description}"

AVAILABLE CAPABILITIES:
${capabilityContext}

INSTRUCTIONS:
1. Identify the high-level goal.
2. Select EXACT capability IDs from the list above that are necessary to fulfill the intent.
3. Be deterministic. Do not invent capabilities.
4. If the intent cannot be fulfilled, return an empty array for selectedCapabilities.`;

    const response = await this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            goal: { type: Type.STRING },
            selectedCapabilities: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["goal", "selectedCapabilities"]
        }
      }
    });

    return JSON.parse(response.text) as Intent;
  }
}

export const geminiService = new GeminiService();
