# API2UI Studio - Architecture Document (Updated)

## 🌐 Revised Vision & Core Principles
We evolve from "LLM-powered API builder" to a **schema-constrained orchestration compiler with UI projection**.

**Key Architectural Shift**:
- LLM is demoted to assistant for **intent mapping, ranking, and composition only**.
- Deterministic engine (Planner + Compiler) owns orchestration, graph building, validation, and projection.
- Clear separation: Planning vs Execution.
- Introduce **Intermediate Representations (IRs)** so jdCard is a composed *artifact*, not a god object.
- Capability Graph derived from normalized OpenAPI becomes the source of truth for available operations.
- UI is a deterministic *projection* from schemas and contracts onto a fixed component registry.

## 📊 Layered Architecture

### 1. Ingestion & Normalization Layer
- **Input**: OpenAPI JSON/YAML (URL or file).
- **Processing**: Normalization (fix missing schemas, resolve refs, infer types, repair examples), heuristics for common issues.
- **Output**: Clean **Capability Graph** + indexed spec store.

### 2. Intent Layer (LLM-Assisted)
- **Input**: User natural language + acceptance criteria.
- **Processing**: LLM (temperature 0, strict schema) outputs **Structured Intent**.
- **Constraint**: LLM does **not** generate execution steps or bindings.

### 3. Planning & Compiler Layer (Deterministic Engine)
- **Planner**: Maps intent + capability graph → **Planning IR**.
- **Compiler**: Planning IR → **Execution IR** (Directed Graph with node bindings).
- **Enforcement**: Safety gates (read-only markers), topologically ordered execution.

### 4. jdCard Artifact
A portable, versioned JSON document that composes:
- **Intent**: Goal + suggested capabilities.
- **Execution**: Nodes, edges, and runtime validations.
- **UI IR**: Layout bindings to component registry.
- **Contracts**: Input/Output schemas.
- **Metadata**: Spec references, timestamps.

### 5. UI Projection / Renderer Layer
- **Input**: Execution IR output schemas + UI IR.
- **Logic**: Deterministic mapping (Data shape → Component type).
- **Registry**: Table, Form, Chart, Metric, Toggle, etc.

### 6. Runtime & Execution Layer
- **Mock Executor**: Schema-aware, using OpenAPI examples.
- **Real Executor**: Enforces safety gates, supports live calls.
- **Chain Runner**: Traverses the Execution IR graph.

### 7. Library & Composition Layer
- **Library**: IndexedDB store for jdCards.
- **Composition**: Support for nested jdCards and reusable subflows.

## 🔄 Data Flow
```
User NL Description
    ↓ (LLM Intent Mapping)
Structured Intent
    ↓ (Deterministic Planner)
Planning IR
    ↓ (Compiler)
Execution IR + jdCard
    ↓ (Renderer)
UI Projection (Deterministic)
    ↓ (Library/Runtime)
Executable Artifact (jdCard)
```
