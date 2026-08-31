# API2UI Studio

> An AI-powered IDE for developers to instantly turn API specifications into interactive, functional dashboards. Zero-code dashboard generation driven by natural language intent.

[![CI](https://github.com/benneberg/api2ui/actions/workflows/ci.yml/badge.svg)](https://github.com/benneberg/api2ui/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF.svg)](https://vitejs.dev/)
[![Gemini AI](https://img.shields.io/badge/Gemini-AI-4285F4.svg)](https://ai.google.dev/)

---

## The Problem It Solves
Building internal tools or testing complex API workflows usually requires writing significant boilerplate frontend code. Developers often resort to Postman or Swagger UI, which lack the ability to stitch together multi-step business logic into a cohesive, visual user interface. **API2UI Studio** aims to bridge this gap by translating natural language intent into executable API graphs.

## Key Features
- **Spec to UI in Seconds:** Drag and drop an OpenAPI (JSON/YAML) specification to instantly generate a functional workspace.
- **Intelligent Planning:** Input a natural language intent (e.g., *"List all users and show their last order"*), and the Gemini-powered compiler translates it into an executable API execution plan.
- **Safe Sandbox Execution:** Built-in mock data generation (via Faker.js) allows QA Engineers and Backend Developers to test complex multi-endpoint scenarios without hitting live production endpoints.
- **The "JDCard" Artifact:** The entire workspace state—including metadata, contracts, and the executable graph—is encapsulated in a single, portable "JDCard" record.

## Architecture & Data Flow
The platform operates on a Bi-Modal architecture:
1. **Client (React + Vite):** Handles UI orchestration, state management (`JDCard`), and visual graph rendering.
2. **Server (Express + Gemini SDK):** Acts as a secure proxy for LLM inference (`/api/inference`) and bypasses CORS restrictions for external API execution (`/api/proxy`).

**The Pipeline:**
`User Intent` ➔ `Gemini Inference` ➔ `Compiler Service (Planning)` ➔ `JDCard State` ➔ `Execution Service (Runtime)` ➔ `Live UI Preview`

## Quick Start

### Prerequisites
- [Bun](https://bun.sh/) (Recommended) or Node.js 20+
- A Google Gemini API Key

### 1. Clone and Install
```bash
git clone https://github.com/benneberg/api2ui.git
cd api2ui
bun install  # or npm install
```
### 2. Configure EnvironmentCopy the example environment file and add your Gemini API key:
```
cp .env.example .env
# Add GEMINI_API_KEY=your_key_here to the .env file

```
### 3. Run Development Server

```
bun run dev  # Starts Vite (frontend) and Express (backend) concurrently
```
### 4. Build for Production
```
bun run build
bun run start
```
###  Testing   
The project uses Vitest for unit and integration testing of the compiler and execution services.
```
bun run test
```
### Tech Stack  
Frontend: React 19, TypeScript 5.8, Vite 6, Tailwind CSS v4   
Backend: Express, Node.js, esbuild.  
AI/Inference: Google Gemini SDK, Ajv (JSON Schema Validation)   
Data/Mocking: Faker.js, OpenAPI Specification.  
Visualization: Recharts, Lucide React

## License: MIT
