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
        
        // Format capabilities with parameter context for the LLM
        const capabilityContext = (capabilities as any[])
          .slice(0, 100) // Increased threshold to see more of the API
          .map((c: any) => {
            const props = c.inputSchema?.properties || {};
            const paramInfo = Object.entries(props)
              .map(([name, schema]: [string, any]) => {
                const req = (c.inputSchema?.required || []).includes(name) ? '*' : '';
                return `${req}${name}(${schema.type || 'any'}${schema.enum ? ': ' + schema.enum.join('|') : ''})`;
              })
              .join(', ');
            
            return `- ${c.id}: ${c.summary}${paramInfo ? ' [Params: ' + paramInfo + ']' : ''}`;
          })
          .join("\n");

        const prompt = `Goal: Map natural language to a Planning IR sequence.
Intent: "${description}"

Available Capabilities (* = required):
${capabilityContext}

Instructions:
1. Extract the primary target entity and intent goal.
2. Outline a sequence of steps (READ, FILTER, MUTATE).
3. Populate inferredParams for each step.
4. Return strict JSON matching IntentMap schema.`;

        const ai = new GoogleGenAI({ 
          apiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });
        
        const modelId = (modelName === 'gemini-1.5-flash' || !modelName || modelName === 'gemini-3.5-flash') ? 'gemini-3.5-flash' : modelName;
        const response = await ai.models.generateContent({
          model: modelId,
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: {
            temperature: 0,
            systemInstruction: "You are the Linguistic Intent Extractor for API2UI Studio. Your ONLY job is to map natural language to a structured Planning IR. Do NOT perform layout or complex logic; just identify WHICH endpoints match the intent and WHAT parameters should be used. CRITICAL: You MUST satisfy ALL required parameters for the selected capabilities by inferring values from the intent or using reasonable defaults. For example, if 'status' is required but not mentioned, use 'available'. If 'tags' is required, provide an array. Always return strict JSON.",
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                goal: { type: Type.STRING },
                targetEntity: { type: Type.STRING },
                steps: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      capabilityId: { type: Type.STRING },
                      actionType: { type: Type.STRING, enum: ["READ", "FILTER", "TRANSFORM", "MUTATE"] },
                      inferredParams: { type: Type.OBJECT }
                    },
                    required: ["capabilityId", "actionType", "inferredParams"]
                  }
                }
              },
              required: ["goal", "steps"]
            }
          }
        });

        const responseText = response.text || "{}";
        return res.json(JSON.parse(responseText));
      } 
      
      const capabilityContext = (capabilities as any[])
        .map((c: any) => `- ${c.id}: ${c.summary}`)
        .join("\n");

      const prompt = `You are a precise API Orchestration Planner. Match the user intent to available API capabilities.
      
Return ONLY a valid JSON object with the following structure:
{
  "goal": "string describing the high level goal",
  "targetEntity": "the primary subject of the action",
  "steps": [
    { "capabilityId": "ID1", "actionType": "READ|FILTER|TRANSFORM|MUTATE", "inferredParams": {} },
    { "capabilityId": "ID2", "actionType": "READ|FILTER|TRANSFORM|MUTATE", "inferredParams": {} }
  ]
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
          { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite' }
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
      if (!url) return res.status(400).json({ error: "Missing Target URL" });

      const response = await fetch(url, {
        method,
        headers: {
          "Accept": "application/json, text/plain, */*",
          "Content-Type": "application/json",
          ...headers
        },
        body: method !== "GET" && method !== "HEAD" ? JSON.stringify(body) : undefined
      });

      const text = await response.text();
      const contentType = response.headers.get("content-type");

      if (!response.ok) {
        console.error(`Proxy Target Error [${response.status}]:`, text);
        return res.status(response.status).json({ 
          error: `External API Error [${response.status}]`, 
          details: text.substring(0, 500) 
        });
      }

      if (contentType && contentType.includes("application/json")) {
        try {
          const data = JSON.parse(text);
          res.status(response.status).json(data);
        } catch (e) {
          res.status(response.status).send(text);
        }
      } else {
        res.status(response.status).send(text);
      }
    } catch (error: any) {
      console.error("Proxy Network Error:", error);
      res.status(500).json({ error: "Proxy Network Error", message: error.message });
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
