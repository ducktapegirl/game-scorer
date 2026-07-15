# Apply the "Games with Friends" design system to the Harmonies scorer

## Context

The app has been deliberately unstyled since M2 — black-on-white, browser defaults,
no CSS — per the `CLAUDE.md` "keep all UI completely plain until explicitly asked"
constraint. The user has now created a design system with Claude Design (in
`design_system/`) and is explicitly asking to apply it. This request **lifts** that
constraint for the surfaces we touch.

**Key finding that shapes the approach:** the design system ships its components as
**React JSX with inline styles** (`Button.jsx`, `Card.jsx`, `Input.jsx`, …). Our app is
**plain-DOM TypeScript with no React and no JSX build**, so those component files
cannot be imported or reused directly. What *is* reusable is the framework-agnostic
**token/CSS layer** (`design_system/styles.css` → `tokens/*.css` + `base.css`), which
defines CSS custom properties and a light element reset — all pure CSS.

So the plan is: **link the DS token layer, author a thin project stylesheet of utility
classes that mirror the DS component specs, and add `className`s in the existing
DOM-building code.** Almost no logic changes — a presentation layer on top of the
existing render functions.

This keeps the `core/` architecture rule intact: the design system is the
game-agnostic *"Games with Friends"* brand (not Harmonies-specific), so its CSS and the
generic class-adding belong in `core/ui/` and the app shell — no game code writes UI.

**Scope (confirmed with user):** primary surfaces first — app shell/layout, buttons,
config form, and the score table (the manual-entry + scoring path). The photo/vision
flow (`photo-screen.ts`) and its debug table stay on plain defaults this pass. Layout:
mobile-first **~428px centered single column** (`--container-mobile`).

## Approach

### 1. Vendor the design tokens into the build
Link `design_system/styles.css` directly from `index.html`
(`<link rel="stylesheet" href="/design_system/styles.css">`). Vite serves from the
project root; the file's relative `@import` paths resolve against its own location, and
`tokens/fonts.css` pulls Baloo 2 / Nunito / Space Mono from the Google Fonts CDN (needs
network on first load; `--font-body` etc. fall back to `system-ui`).

### 2. Author `app/app.css`
A small stylesheet (linked after the DS `styles.css`) of utility classes built from
tokens: layout (`.app-shell` → `--container-mobile`, centered), `.btn` +
`--primary/--secondary/--ghost/--sm/--block`, `.card`, `.select`/`.checkbox` rows,
`.score-table` (numbers in `--font-mono`, emphasized total).

### 3. Consolidate the duplicated `button()` helper
Extract the copy-pasted private helper (entry-screen, cell-editor, photo-screen) into
`core/ui/controls.ts`:
`button(label, onClick, variant = "ghost")` → sets type, text, handler, and
`class="btn btn--<variant>"`.

### 4. Add classes in the render code (primary surfaces only)
`index.html` (link tags + wordmark `h1`), `entry-screen.ts` (button variants + `.card`
wrappers + single-column flow), `config-view.ts` (`.select`/`.checkbox`/`.btn--sm`),
`score-view.ts` (`.score-table` + `.card` at call site), `board-view.ts` (token-driven
SVG chrome colors; placed-piece fills unchanged).

**Not touched this pass:** `photo-screen.ts` render surfaces, the debug `<table>`, and
`cell-editor.ts` beyond the shared-button swap.

## Files
- New: `app/app.css`, `core/ui/controls.ts`, this planning doc.
- Edit: `index.html`, `core/ui/entry-screen.ts`, `core/ui/config-view.ts`,
  `core/ui/score-view.ts`, `core/ui/board-view.ts`, `core/ui/cell-editor.ts`.

## Verification
- `npm run build` — `tsc --noEmit` + Vite build must pass.
- `npm test` — Vitest green (DOM tests assert structure/geometry, not styling).
- `npm run dev` — manual check: centered mobile column, teal bg + cream cards, Baloo 2
  wordmark; pill buttons with hover-darken/press-scale; score numbers in Space Mono;
  config form legible; board chrome token-colored, piece fills unchanged; photo flow
  unchanged.
