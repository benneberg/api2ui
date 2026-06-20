# TODO

## Urgent (Security/Stability)
- [ ] Implement allowed-domain whitelist for `/api/proxy`.
- [ ] Add rate limiting to `/api/inference` to prevent API key exhaustion.

## High (Functionality)
- [ ] Implement parallel node execution for independent graph branches.
- [ ] Add persistence for the "Lab" results (currently lost on refresh).
- [ ] Expand `mockDataService` to handle `anyOf`/`oneOf` schema constraints.

## Medium (UX/Design)
- [ ] Add a visual loader for graph execution steps in the "Lab" view.
- [ ] Implement "Export to Code" feature to download the generated UI as a standalone React component.

## Low (Maintenance)
- [ ] Add Vitest for service-layer unit testing.
- [ ] Refactor `App.tsx` (over 1k lines) into smaller feature-based components (e.g., `Nav.tsx`, `Workspace.tsx`).
