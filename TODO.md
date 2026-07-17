# TODO

## Urgent (Security/Stability)
- [x] Implement allowed-domain whitelist for `/api/proxy`.
- [x] Add rate limiting to `/api/inference` to prevent API key exhaustion.

## High (Functionality)
- [x] Implement parallel node execution for independent graph branches.
- [x] Add persistence for the "Lab" results (currently lost on refresh).
- [x] Expand `mockDataService` to handle `anyOf`/`oneOf` schema constraints.

## Medium (UX/Design)
- [x] Add a visual loader for graph execution steps in the "Lab" view.
- [x] Implement "Export to Code" feature to download the generated UI as a standalone React component.

## Low (Maintenance)
- [x] Add Vitest for service-layer unit testing.
- [x] Refactor `App.tsx` (over 1k lines) into smaller feature-based components (e.g., `Nav.tsx`, `Workspace.tsx`).
