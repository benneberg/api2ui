import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Gemini Proxy Endpoint
  app.post("/api/gemini/extract", async (req, res) => {
    try {
      const { description, capabilities, modelName, customApiKey } = req.body;
      const apiKey = customApiKey || process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(401).json({ error: "Missing Gemini API Key" });
      }

      const capabilityContext = (capabilities as any[])
        .map((c: any) => `- ${c.id}: ${c.summary}`)
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

      const genAI = new GoogleGenAI({ apiKey });
      const result = await genAI.models.generateContent({
        model: modelName || "gemini-1.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
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

      res.json(JSON.parse(result.text || result.candidates?.[0]?.content?.parts?.[0]?.text || "{}"));
    } catch (error: any) {
      console.error("Gemini Error:", error);
      res.status(500).json({ error: error.message || "Internal AI Error" });
    }
  });

  // Generic API Proxy for Real Execution (Optional but helpful for CORS)
  app.post("/api/proxy", async (req, res) => {
    try {
      const { url, method, headers, body } = req.body;
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...headers
        },
        body: method !== "GET" && method !== "HEAD" ? JSON.stringify(body) : undefined
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
