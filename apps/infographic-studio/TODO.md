# Infographic Studio — TODO

> Standalone experiment: `apps/infographic-studio` in `api2ui`
> Last reviewed: 2026-08-31

---

## 🚀 High Impact

### 1. Section-Level Regeneration
- [ ] **Add per-section "Regenerate" buttons** in the Result preview
- [ ] **Scope the LLM prompt** to only the selected section (headline, value prop, highlights, capabilities, how-it-works, tech stack, audience, CTA)
- [ ] **Preserve other sections** from the existing JSON spec during regeneration
- [ ] **Track token/cost savings** vs. full regeneration (nice-to-have UX touch)

**Rationale:** Power users often want to tweak one section without burning a full context window. This is the biggest UX gap in the current one-shot flow.

---

### 2. Offline Resilience (Service Worker)
- [ ] **Register a lightweight Service Worker** that caches the app shell (`index.html`, inline CSS/JS)
- [ ] **Cache previous generations** in IndexedDB so they survive browser restarts
- [ ] **Add an offline indicator** in the UI when the network is unavailable
- [ ] **Gracefully degrade** source fetching (disable URL fetch, keep pasted text & local projects working)

**Rationale:** Zero-dependency, client-side architecture is perfect for offline use. A SW would make this feel like a native app after first load.

---

## 🎨 UX & Polish

### 3. Accessibility (A11y) in SVG Output
- [ ] **Inject ARIA roles** (`role="img"`, `aria-label`, `aria-describedby`) into generated SVGs
- [ ] **Add semantic grouping** (`<g role="list">`, `<g role="listitem">`) for structured sections
- [ ] **Generate an HTML fallback** (hidden `<div>` with plain text) alongside each SVG for screen readers
- [ ] **Ensure color contrast ratios** meet WCAG AA across all four themes (midnight, daylight, ember, forest)

**Rationale:** Deterministic SVG rendering gives you full control over markup. A11y is often an afterthought in infographic tools — getting it right early is a differentiator.

---

### 4. Keyboard Shortcuts
- [ ] `Ctrl/Cmd + Enter` — Trigger generation
- [ ] `Ctrl/Cmd + Shift + S` — Export as PNG
- [ ] `Ctrl/Cmd + Shift + E` — Export as SVG
- [ ] `Ctrl/Cmd + D` — Duplicate current project
- [ ] `Escape` — Close modals / cancel generation
- [ ] Show shortcuts in a `?` help modal

---

## 🔧 Architecture & Performance

### 5. Smarter Source Chunking (for >38k char inputs)
- [ ] **Detect oversized sources** before truncation
- [ ] **Implement tiered summarization:**
  - Tier 1: Truncate README/docs to ~20k chars
  - Tier 2: Summarize truncated remainder with a cheap model call (e.g., `llama-3.3-70b` on Groq)
  - Tier 3: Feed condensed summary + full Tier 1 text to the main infographic generator
- [ ] **Expose a "Source density" indicator** so users know how much material was used

**Rationale:** 38k chars is generous, but dense documentation or large monorepos will hit it. Smart chunking extends reach without breaking the one-shot UX.

---

### 6. Project Import / Export
- [ ] **Export full project** as a `.json` file (sources + style + all 20 generations)
- [ ] **Import project** from `.json` file (restore state exactly)
- [ ] **Drag-and-drop import** support
- [ ] Consider a compressed/base64 "share link" format for portability

---

## 🎨 Design & Theming

### 7. Theme Extensibility
- [ ] **Extract theme definitions** into a declarative JSON/YAML config
- [ ] **Allow custom themes** via a "Custom" option in the theme picker
- [ ] **Live theme preview** while editing color values
- [ ] **Persist custom themes** in `localStorage`

---

### 8. Canvas Size Presets
- [ ] Add **LinkedIn carousel** (1080x1080, multi-slide hint)
- [ ] Add **Twitter/X header** (1500x500)
- [ ] Add **GitHub social preview** (1280x640)
- [ ] Add **Custom dimensions** input (width x height)

---

## 🧪 Quality & Trust

### 9. "Grounded" Verification UI
- [ ] **Highlight which source material** contributed to each generated section
- [ ] **Show confidence indicators** (e.g., "3 of 4 highlights directly sourced" vs "1 inferred")
- [ ] **Add a "Source check" mode** that renders the infographic with footnote-style citations

**Rationale:** You already forbid invented metrics in the prompt. Surfacing that grounding to the user builds even more trust.

---

### 10. Undo / Redo Stack
- [ ] **Global undo/redo** for project state changes (sources, style, generation)
- [ ] **Per-generation history** within a project (beyond the current "last 20 generations")
- [ ] **Keyboard shortcuts:** `Ctrl/Cmd + Z`, `Ctrl/Cmd + Shift + Z`

---

## 📦 Distribution

### 11. PWA Packaging
- [ ] Add a `manifest.json` for installability
- [ ] Add app icons (at least 192x192 and 512x512)
- [ ] Ensure standalone display mode works correctly
- [ ] Test on mobile Safari and Chrome

---

### 12. One-Click Deploy Templates
- [ ] **GitHub Pages** — add a GitHub Action workflow
- [ ] **Vercel / Netlify** — add `vercel.json` / `netlify.toml` for SPA routing
- [ ] **Docker** — minimal nginx image for self-hosting

---

## 🏷️ Suggested Labels

| Label | Tasks |
|-------|-------|
| `good-first-issue` | #4 Keyboard Shortcuts, #8 Canvas Presets |
| `performance` | #5 Smarter Chunking, #2 Service Worker |
| `a11y` | #3 Accessibility |
| `ux` | #1 Section Regen, #10 Undo/Redo |
| `distribution` | #11 PWA, #12 Deploy Templates |
