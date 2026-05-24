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

  // Generic AI Proxy Endpoint
  app.post("/api/ai/extract", async (req, res) => {
    try {
      const { description, capabilities, modelName, customApiKey, provider } = req.body;
      let apiKey = customApiKey;
      let url = "";
      let payload: any = {};

      if (provider === "gemini") {
        apiKey = apiKey || process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(401).json({ error: "Missing Gemini API Key" });
        
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
        return res.json(JSON.parse(result.text || result.candidates?.[0]?.content?.parts?.[0]?.text || "{}"));
      } 
      
      const capabilityContext = (capabilities as any[])
        .map((c: any) => `- ${c.id}: ${c.summary}`)
        .join("\n");

      const prompt = `You are a precise API Orchestration Planner. Match the user intent to available API capabilities. Return ONLY a JSON object with "goal" (string) and "selectedCapabilities" (string array).

USER INTENT: "${description}"

AVAILABLE CAPABILITIES:
${capabilityContext}`;

      if (provider === "openrouter") {
        apiKey = apiKey || process.env.OPENROUTER_API_KEY;
        url = "https://openrouter.ai/api/v1/chat/completions";
        payload = {
          model: modelName || "meta-llama/llama-3.3-70b-instruct",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" }
        };
      } else if (provider === "groq") {
        apiKey = apiKey || process.env.GROQ_API_KEY;
        url = "https://api.groq.com/openai/v1/chat/completions";
        payload = {
          model: modelName || "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" }
        };
      }

      if (!apiKey) return res.status(401).json({ error: `Missing ${provider} API Key` });

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "AI Request Failed");
      
      const content = data.choices[0].message.content;
      res.json(JSON.parse(content));
    } catch (error: any) {
      console.error("AI Proxy Error:", error);
      res.status(500).json({ error: error.message || "Internal AI Error" });
    }
  });

  // Fetch Available Models
  app.get("/api/ai/models/:provider", async (req, res) => {
    try {
      const { provider } = req.params;
      if (provider === "openrouter") {
        const response = await fetch("https://openrouter.ai/api/v1/models");
        const data = await response.json();
        const models = data.data.map((m: any) => ({
          id: m.id,
          name: m.name,
          context: m.context_length
        })).slice(0, 50); // Limit to top 50
        return res.json(models);
      } else if (provider === "groq") {
        // Groq models are more static usually, but they have an endpoint
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) return res.json([{ id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B' }]);
        
        const response = await fetch("https://api.groq.com/openai/v1/models", {
          headers: { "Authorization": `Bearer ${apiKey}` }
        });
        const data = await response.json();
        const models = data.data.map((m: any) => ({
          id: m.id,
          name: m.id
        }));
        return res.json(models);
      } else if (provider === "gemini") {
        return res.json([
          { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
          { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
          { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' }
        ]);
      }
      res.json([]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Generic API Proxy for Real Execution (Optional but helpful for CORS)
  app.post("/api/proxy", async (req, res) => {
    try {
      const { url, method, headers, body } = req.body;
      const response = await fetch(url, {
        method,
        headers: {
          "Accept": "application/json, text/plain, */*",
          "Content-Type": "application/json",
          ...headers
        },
        body: method !== "GET" && method !== "HEAD" ? JSON.stringify(body) : undefined
      });

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        res.status(response.status).json(data);
      } else {
        const text = await response.text();
        res.status(response.status).send(text);
      }
    } catch (error: any) {
      console.error("Proxy Error:", error);
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
