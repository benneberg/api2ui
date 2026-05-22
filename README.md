# API2UI Studio v2.1

## 🎯 Vision
A **schema-constrained orchestration compiler** with UI projection. It ingests OpenAPI specifications, builds a capability graph, uses deterministic planning (with LLM assistance limited to intent mapping and ranking), generates structured execution graphs, and projects minimal, predictable UIs from output schemas and a fixed component registry.

## 🏗️ Architecture
The system is built on a layered architecture to ensure predictability and safety:

1.  **Ingestion & Normalization**: Normalizes messy OpenAPI specs into a clean **Capability Graph**.
2.  **Intent Layer (LLM-Assisted)**: Maps natural language to structured intent using Gemini 1.5 Flash. The LLM ranks capabilities but does not decide execution flow.
3.  **Deterministic Compiler**: Assembles the **Execution IR** from the intent and graph.
4.  **UI Projection**: Maps data shapes to a fixed registry of technical components (Tables, Metrics, etc.).
5.  **Runtime**: A schema-aware engine that handles execution and simulates data flows.

## 🛠️ Tech Stack
- **Frontend**: React 19 + Vite + Tailwind CSS 4
- **AI**: Google Gemini API (@google/genai)
- **Validation**: Ajv (JSON Schema validation)
- **Icons**: Lucide React
- **Animations**: Motion

## 🚀 Getting Started
1.  Add `GEMINI_API_KEY` to your Secrets / Environment Variables.
2.  Provide an OpenAPI JSON/YAML URL in the **Ingest** stage.
3.  Describe your intent (e.g., "Show me available pets").
4.  Review the compiled plan and execute in the **Lab**.
5.  View the final **UI Projection**.

## 🛡️ Safety
By default, the engine operates in **READ-ONLY MODE**. Mutation nodes (POST, PUT, DELETE) are explicitly blocked unless the security toggle is disengaged.
