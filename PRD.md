# API2UI Studio - Product Requirements Document (Updated)

## 🎯 Vision
A **schema-constrained orchestration compiler** with UI projection. It ingests OpenAPI specifications, builds a capability graph, uses deterministic planning (with LLM assistance limited to intent mapping, ranking, and composition), generates structured execution graphs, and projects minimal, predictable UIs from output schemas and a fixed component registry.

**Positioning**: "Deterministic API orchestration from OpenAPI contracts." Not another "build apps with AI" tool.

This evolves the original "API 2to UI" concept into a reliable, layered system with clear separation between planning and execution. jdCard becomes a composed artifact containing Intent, Execution IR, UI IR, and Contracts rather than a monolithic object.

## 👤 User Persona
- API consumers, data engineers, internal tool builders, and platform teams who need fast, reliable, auditable API integrations and internal tools.
- Values predictability, schema fidelity, composability, safety, and mobile accessibility over flashy AI generation.

## 📐 Core Requirements

### Foundational Layers
1. **OpenAPI Ingestion & Normalization**: Accept JSON/YAML URLs or files. Perform normalization, repair heuristics, schema inference, and build a **Capability Graph** (endpoints as typed nodes with dependencies, input/output contracts).
2. **Intent Extraction (LLM-assisted)**: Convert natural language into structured intent. LLM is *strictly limited* to intent mapping, ranking available capabilities, and suggesting compositions. No direct orchestration.
3. **Deterministic Planner & Compiler**:
   - Maps intent to available capabilities.
   - Builds **Planning IR** → **Execution IR** (nodes/edges, dependency ordering, variable bindings, transforms, runtime validations).
   - Enforces safety (read-only by default).
4. **UI Projection (Renderer)**: Deterministic mapping from output schemas, data shapes, and interaction contracts to a fixed registry of components (table, form, chart, metric, toggle, etc.). No arbitrary layouts or AI-designed UIs. Supports "JSON Schema → UX Projection".
5. **jdCard Format**: Portable, versioned artifact containing:
   - Intent
   - Capabilities mode (READ_ONLY etc.)
   - Execution graph (nodes/edges)
   - UI IR (layout + bindings)
   - Contracts (input/output schemas, acceptance tests)
   - Metadata
6. **Runtime & Execution**:
   - Mock execution engine (realistic, schema-aware).
   - Safety gates everywhere.
   - Support for real execution (with explicit write session).
7. **Library & Composability**: Searchable, filterable library of jdCards. Support composition (nested cards, subflows, parameterized jobs). Future bidirectional sync (UI edits → update graph).
8. **UX**: Mobile-first, touch-optimized (≥44px targets), minimalistic, responsive grid. Stepper navigation reflecting layered architecture (Spec → Intent → Plan → Lab/Execute → Preview → Library).

### Non-Functional
- **Determinism First**: Temperature 0 where used, strict JSON Schema validation (AJV or equivalent), validation loops, "NO INVENTION" rules.
- **Safety**: Read-only default. Explicit session-level (or per-card) write toggle. Per-operation safety in graph.
- **Reliability for Real Specs**: Handle poor OpenAPI quality via normalization layer, heuristics, and fallbacks.
- **Storage**: IndexedDB (with future sync). Jobs are versioned and composable.

## 🚫 Constraints
- LLM **never** has orchestration authority. It assists only in intent, ranking, and high-level composition.
- UI Renderer stays disciplined: Fixed component registry driven by schema inference. No freeform generation.
- All outputs must validate against formal schemas (jdCard, IR layers).
