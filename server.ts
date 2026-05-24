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
4. If the intent cannot be fulfilled, return an empty array for selectedCapabilities.
5. Respond ONLY with a valid JSON object.`;

        const genAI = new GoogleGenAI({ 
          apiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });
        const result = await genAI.models.generateContent({
          model: modelName || "gemini-3.5-flash",
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
        
        const responseText = result.text || "";
        return res.json(JSON.parse(responseText || "{}"));
      } 
      
      const capabilityContext = (capabilities as any[])
        .map((c: any) => `- ${c.id}: ${c.summary}`)
        .join("\n");

      const prompt = `You are a precise API Orchestration Planner. Match the user intent to available API capabilities.
      
Return ONLY a valid JSON object with the following structure:
{
  "goal": "string describing the high level goal",
  "selectedCapabilities": ["ID1", "ID2", ...]
}

USER INTENT: "${description}"

AVAILABLE CAPABILITIES:
${capabilityContext}`;

      if (provider === "openrouter") {
        apiKey = apiKey || process.env.OPENROUTER_API_KEY;
        url = "https://openrouter.ai/api/v1/chat/completions";
        payload = {
          model: modelName || "meta-llama/llama-3.3-70b-instruct",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          max_tokens: 512
        };
      } else if (provider === "groq") {
        apiKey = apiKey || process.env.GROQ_API_KEY;
        url = "https://api.groq.com/openai/v1/chat/completions";
        payload = {
          model: modelName || "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          max_tokens: 512
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
      const cleanedContent = content.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
      res.json(JSON.parse(cleanedContent));
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
          { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash' },
          { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro' },
          { id: 'gemini-flash-latest', name: 'Gemini Flash Latest' }
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
      const text = await response.text();

      if (contentType && contentType.includes("application/json")) {
        try {
          const data = JSON.parse(text);
          res.status(response.status).json(data);
        } catch (e) {
          // If it fails to parse as JSON despite the header, send as text
          res.status(response.status).send(text);
        }
      } else {
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
