# API2UI Studio

## Overview
API2UI Studio is a low-code environment for transforming API specs into functional dashboards using AI.

## Installation
1. `npm install`
2. Configure `.env` with `GEMINI_API_KEY`.

## Usage
- **DRAG & DROP**: Import an OpenAPI (JSON/YAML) file.
- **COMMAND**: Input a natural language intent (e.g., "List all users and show their last order").
- **STITCH**: Review the AI-generated execution plan.
- **RUN**: Execute in the Lab using mock or real data.

## Testing
- Run `npm run lint` for type checking.
- Use the **Lab** view within the app to verify graph logic against mock endpoints.

## Build/Deploy
- `npm run build`: Compiles the React frontend and bundles the Express server.
- `npm start`: Launches the production server in Cloud Run.
