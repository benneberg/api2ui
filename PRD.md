API2UI Studio - Product Requirements Document (Refined)

🎯 Vision

API2UI Studio is a schema-constrained orchestration compiler with deterministic UI projection.

The platform ingests OpenAPI specifications, constructs typed capability graphs, translates operational intent into deterministic execution workflows, and projects predictable operational interfaces from schemas and interaction contracts.

Rather than generating arbitrary applications, API2UI Studio focuses on:

* deterministic orchestration
* operational accessibility
* schema fidelity
* reusable execution artifacts
* safe runtime execution
* predictable UI projection

The system enables non-technical operational users to safely execute complex API-driven tasks without needing to understand the underlying APIs.

⸻

🧠 Product Positioning

Platform Runtime

Cortex

The deterministic orchestration engine responsible for:

* capability graph resolution
* planning
* compilation
* execution orchestration
* runtime safety
* artifact generation

Studio Environment

API2UI Studio

The visual operational tooling workbench where users:

* ingest OpenAPI specifications
* define operational goals
* inspect execution flows
* test workflows
* project operational UIs
* manage jdCard artifacts

Artifact Format

jdCard

Portable orchestration artifact format containing:

* Intent
* Planning IR
* Execution IR
* UI IR
* Contracts
* Metadata

⸻

💡 Original Product Intent

API2UI Studio originated from a real operational problem observed in production support workflows.

Support teams often need to perform repetitive operational tasks across complex REST API ecosystems, but the underlying APIs are too technical and fragmented for efficient day-to-day use by non-developer staff.

In many organizations, APIs already expose the required operational capabilities, but the missing layer is a safe, deterministic operational interface that translates business intent into validated execution workflows.

The original goal of API2UI Studio was therefore not to generate arbitrary applications, but to:

* Transform OpenAPI contracts into operational capability graphs.
* Allow users to express operational intent in natural language.
* Deterministically compile those intents into safe execution workflows.
* Project predictable, schema-driven operational interfaces from the resulting execution graph.
* Package workflows into reusable operational artifacts.

The system evolved from an “API-to-UI” concept into a schema-constrained orchestration compiler focused on operational tooling generation rather than freeform AI application generation.

⸻

🧩 Real-World Operational Scenario

A core design inspiration came from digital signage operations.

A support team manages thousands of deployed Android signage devices distributed across multiple organizations and partners. Some devices are provisioned and managed through external platforms such as signageOS, while others exist in internal CMS systems.

The support workflow requires identifying and updating outdated devices.

Example Task

A support operator needs to:

1. Find all Android devices belonging to partner “ABC”.
2. Identify devices running firmware versions lower than version 10.
3. Review affected devices.
4. Schedule firmware updates for those devices at 01:00 overnight.

Although all required functionality already exists in REST APIs, the operational process is difficult because it requires:

* Understanding multiple API endpoints
* Managing authentication and filtering logic
* Traversing relationships between systems
* Building valid payloads
* Executing mutative operations safely

This creates unnecessary operational complexity for support staff.

API2UI Studio Approach

Instead of building a single hardcoded dashboard for this specific use case, API2UI Studio generalizes the problem into a reusable orchestration model.

The platform:

1. Ingests OpenAPI specifications
2. Builds a typed capability graph from available operations
3. Allows operators to describe operational goals in natural language
4. Uses constrained LLM-assisted intent extraction
5. Deterministically compiles execution workflows
6. Projects operational UIs from schemas and interaction contracts
7. Packages workflows into reusable jdCard artifacts

The result is a reusable operational tool that support staff can safely execute without needing to understand the underlying APIs.

⸻

⚙️ Operational Task Compilation

API2UI Studio is fundamentally designed around the concept of operational task compilation.

Users do not think in terms of:

* REST endpoints
* HTTP payloads
* parameter bindings
* orchestration graphs
* execution ordering

Users think in operational goals such as:

“Show all outdated Android players for partner ABC and schedule firmware updates tonight.”

The platform translates this operational intent into deterministic execution workflows through a layered compilation pipeline:

Operational Intent
    ↓
Structured Intent
    ↓
Capability Resolution
    ↓
Planning IR
    ↓
Execution IR
    ↓
UI Projection
    ↓
Executable Operational Artifact

This architecture allows non-technical operational staff to safely interact with complex API ecosystems through predictable interfaces while preserving:

* validation
* auditability
* composability
* runtime safety
* deterministic execution

⸻

👤 User Persona

Primary users include:

* API consumers
* support teams
* operations staff
* data engineers
* internal tool builders
* platform teams

These users value:

* predictability
* schema fidelity
* composability
* auditability
* operational safety
* mobile accessibility
* deterministic execution

over:

* flashy AI generation
* arbitrary automation
* freeform UI generation

⸻

📐 Core Requirements

1. OpenAPI Ingestion & Normalization

Input

* OpenAPI JSON/YAML URL
* Uploaded OpenAPI file

Processing

* Schema normalization
* Reference resolution
* Repair heuristics
* Schema inference
* Example repair
* Missing type reconstruction
* Capability extraction

Output

* Typed Capability Graph
* Indexed spec store
* Operation dependency graph
* Input/output contracts

⸻

2. Intent Extraction (LLM-Assisted)

Purpose

Convert natural language operational goals into structured intent.

Constraints

The LLM is strictly limited to:

* intent mapping
* capability ranking
* high-level composition suggestions

The LLM does NOT:

* orchestrate execution
* generate runtime bindings
* create execution graphs
* control execution

Requirements

* Temperature 0
* Strict schema validation
* Deterministic outputs
* “NO INVENTION” enforcement

⸻

3. Deterministic Planner & Compiler

Planner Responsibilities

* Resolve capabilities from intent
* Match operations to constraints
* Build Planning IR
* Determine dependencies

Compiler Responsibilities

Compile:

* Planning IR
    → Execution IR

Including:

* execution nodes
* edges
* variable bindings
* transforms
* runtime validations
* dependency ordering
* safety annotations

Safety

* Read-only by default
* Explicit write session required
* Per-operation safety markers
* Runtime validation gates

⸻

4. UI Projection (Renderer)

Philosophy

UI generation must remain deterministic and schema-constrained.

No:

* arbitrary layouts
* generated React code
* AI-designed interfaces
* freeform UI composition

Projection Model

Map:

* output schemas
* data shapes
* interaction contracts

→ fixed component registry

Supported Components

* Table
* Form
* Chart
* Metric
* Toggle
* Date picker
* Filter builder
* Stepper
* Batch action panel
* Confirmation dialog

Goal

Predictable operational interfaces optimized for repeatable workflows.

⸻

5. jdCard Artifact Format

Portable, versioned orchestration artifact.

jdCard Structure

Intent

Operational goal and structured intent representation.

Planning IR

Capability selection and orchestration planning.

Execution IR

Execution graph:

* nodes
* edges
* bindings
* validations
* safety metadata

UI IR

Layout bindings to renderer registry.

Contracts

* Input schemas
* Output schemas
* Acceptance tests
* Runtime assertions

Metadata

* Spec references
* Versioning
* Timestamps
* Execution policies

⸻

6. Runtime & Execution

Mock Runtime

* Schema-aware mocking
* OpenAPI example usage
* Validation-first execution
* Offline simulation

Real Runtime

* Live API execution
* Policy enforcement
* Write safety controls
* Runtime validation

Chain Runner

Traverses Execution IR graph deterministically.

Future Runtime Goals

* replayability
* execution journaling
* resumability
* audit history
* approval workflows

⸻

7. Library & Composability

jdCard Library

Searchable and filterable artifact repository.

Composition Support

* nested jdCards
* reusable subflows
* parameterized workflows
* reusable operational primitives

Future Goals

* bidirectional UI sync
* shared runtime modules
* organization-level libraries
* collaborative orchestration tooling

⸻

8. UX Requirements

Design Philosophy

Minimalistic operational tooling interface.

Requirements

* Mobile-first
* Touch-optimized (≥44px targets)
* Responsive grid layout
* Accessibility-conscious
* Predictable interaction patterns

Navigation Flow

Spec
  ↓
Intent
  ↓
Plan
  ↓
Lab / Execute
  ↓
Preview
  ↓
Library

Visual Language

* Technical branded UI
* High-contrast layouts
* Swiss-style typography
* Deterministic interaction surfaces
* Minimal visual ambiguity

⸻

🔒 Non-Functional Requirements

Determinism First

* Temperature 0 where applicable
* Strict schema validation (AJV or equivalent)
* Validation loops
* Formal IR schemas
* “NO INVENTION” rules

Safety

* Read-only by default
* Explicit write sessions
* Runtime confirmations
* Per-operation safety annotations
* Mutation visibility

Reliability

* Handle malformed OpenAPI specs
* Heuristic normalization
* Fallback inference
* Runtime validation
* Graceful degradation

Storage

* IndexedDB persistence
* Versioned artifacts
* Offline-safe workflows
* Future sync support

⸻

🚫 Constraints & Non-Goals

LLM Constraints

The LLM NEVER has orchestration authority.

The LLM only assists with:

* intent extraction
* capability ranking
* composition suggestions

The deterministic runtime owns:

* planning
* execution
* validation
* orchestration
* projection

⸻

UI Constraints

The renderer remains disciplined:

* fixed component registry
* schema-driven projection
* deterministic layouts
* predictable interaction models

No:

* arbitrary frontend generation
* AI-generated React applications
* freeform layout systems

⸻

Validation Constraints

All generated artifacts must validate against:

* jdCard schemas
* IR schemas
* execution contracts
* runtime validation rules

⸻

🚫 Explicit Non-Goals

API2UI Studio is NOT:

* a freeform AI app builder
* an autonomous agent platform
* a prompt-driven orchestration engine
* a generic low-code frontend generator
* a generated React scaffolding tool

The platform intentionally prioritizes:

* deterministic orchestration
* operational tooling
* schema fidelity
* composability
* auditability
* runtime safety
* operational accessibility
