# Architecture

## Components
- **Client (React + Vite)**:
  - `App.tsx`: Central state orchestration.
  - `components/`: UI modules (Markdown, CodeEditor, History, GraphVisualizer).
  - `services/`: Domain logic (Compiler, Execution, Gemini AI, OpenAPI Mapping).
- **Server (Express + Gemini SDK)**:
  - `/api/inference`: Proxies requests to Gemini to keep keys secure.
  - `/api/proxy`: Bypasses CORS for external API execution.
  - `/api/models`: Service discovery for LLM versions.

## Data Flow
- **Source of Truth**: The `JDCard` (Artifact Record). It contains the metadata, contracts, and the executable graph.
- **Flow**: User Input -> `geminiService` (Inference) -> `compilerService` (Planning) -> `JDCard` (State) -> `executionService` (Runtime) -> UI Preview.

## Integrations
- **Google GenAI SDK**: Powers the "Brain" of the platform.
- **Faker.js**: Used for intelligent mock data generation.
- **Lucide React**: Visual iconography.

## Observability
- Execution logs in the "Lab" view.
- Local storage based "Run History" for auditing previous results.

## Risks
- **AI Hallucinations**: The planner might generate invalid API sequences if the prompt is ambiguous.
- **Security**: The proxy route could be abused if not restricted.

## Confidence
- **Component Layout**: 100%
- **Data Flow**: 95%
- **Scaling Limits**: 60% (Large specs need testing)
