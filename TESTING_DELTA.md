# Testing Delta

## Current State
- **Automated Tests**: Limited to `tsc --noEmit` and build checks. No unit or integration test suite (Vitest/Jest) found in `package.json`.
- **Manual Verification**: Primary method. Relies on the "Lab" view to test graph execution.

## Delta to "Production Ready"
1. **Unit Tests (Execution Engine)**: Critical. Need to test `executionService.ts` against various schema edge cases (optional fields, nested objects, status codes).
2. **Schema Validation Tests**: Ensure `openapiService.ts` correctly normalizes valid and invalid Swagger/OAS documents.
3. **Prompt Regression Tests**: Test `geminiService.ts` prompts against fixed intents to ensure consistent planning IR generation.
4. **End-to-End Tests**: Critical for the flow: Ingest -> Plan -> Execute -> Preview.
