# Milestone 2 Plan — Manual Board Entry UI

## Context

M1 (pure scoring engine, generic data model, both board sides) is merged to `main`.
This session builds **M2 only**: a manual board entry UI that lets the user enter a
`BoardState` by hand and see the `ScoreBreakdown` from the existing `score()` in
`games/harmonies/rules.ts`. It doubles as the M5 correction surface later, so the
component boundaries are drawn with that in mind — but no M5 features (photo overlay,
vision pre-fill) are built now. No cards/spirits (M3), no vision (M4).

Work happens on branch `claude/m2-manual-board-entry-m1s7q9`. Gate: `npm test` +
`npm run build` green, UI verified end-to-end in the browser, then commit and push.

Per CLAUDE.md, **step 0 of execution is copying this plan to
`planning/harmonies-m2-plan.md`** so it lives in the repo before the code does.

## Decisions

1. **Vanilla TypeScript + DOM, no framework.** The repo has zero runtime
   dependencies and the UI is one screen with ≤25 cells. State lives in one small
   store; every change triggers a full re-render of the dynamic regions. No new
   dependencies at all.
2. **SVG for the hex board.** A hex grid cannot be rendered with browser-default
   HTML flow layout; SVG geometry attributes (`points`, `fill`) are content, not
   styling. This stays within the plain-UI constraint: no stylesheets, no CSS
   classes, black text/strokes on white, token fills only because seeing token
   colors *is* the function. Everything outside the board is default HTML
   (`<button>`, `<table>`, `<p>`).
3. **Live scoring.** The side selector is answered before the grid exists, so
   `score()` always has a valid `boardSide`; the breakdown table recomputes after
   every edit. No separate "Score" button to go stale.
4. **Generic contract extensions in `core/types`** (mechanism in core, Harmonies
   specifics as data — additive only, engine behavior untouched):
   - `BoardTopology.cellCenter(id): { x: number; y: number }` — abstract layout
     units for rendering (distinct from M4's photo-space `cellCenterPx`).
   - `GameModule.board.variants: { id; label }[]` — drives the generic variant
     selector. Harmonies: Side A (river) / Side B (islands). A single-variant game
     would auto-select and show no prompt.
   - `GameModule.board.stackChoices(token): { label; stack }[]` — the valid
     enterable stacks topped by a token, bottom-to-top, as game data. This is how
     the green/gray height picker "writes the full stack array" (spec §7) without
     core knowing any stacking rules.
   - `TokenDef.displayColor?: string` — CSS color for rendering (fallback: white
     fill + label text).

## Harmonies entry data (`games/harmonies/entry.ts`)

Stack choices per top token, from the rules reference / spec §7:

| token | choices (bottom-to-top) |
|---|---|
| green | h1 `[green]` · h2 `[brown,green]` · h3 `[brown,brown,green]` |
| gray | h1 `[gray]` · h2 `[gray,gray]` · h3 `[gray,gray,gray]` |
| brown | h1 `[brown]` · h2 `[brown,brown]` |
| red | "on ground (not a building)" `[red]` · "on a base (building)" — the physical base may be brown, gray, or red, but it is hidden and scoring-irrelevant, so it is recorded as `[brown,red]` per spec §7 ("default it and move on") |
| blue | `[blue]` (applied immediately, no picker) |
| yellow | `[yellow]` (applied immediately, no picker) |

A building scores purely from its own stack height (≥2) and its neighbors' *top*
tokens, so a brown, gray, or red token hidden under the red can never influence
any category — `[brown,red]`, `[gray,red]`, and `[red,red]` are score-identical.
Recording one default base (confirmed with the user) keeps the picker to the one
red distinction that *does* matter: lone red (never scores) vs. based red
(building).
Every choice must pass the existing `validateStack()` (asserted in tests).

## Files

**New:**
- `core/ui/entry-state.ts` — pure, DOM-free board-editing state:
  `createBoard(side)`, `setStack(board, cellId, stack)`, `clearCell(...)`,
  plus `validateSavedBoard(raw, module)` (cells exist in topology, every stack is
  one of the game's `stackChoices` for its top token). Testable in plain Node.
- `core/ui/board-view.ts` — generic stateless renderer:
  `renderBoard(topology, tokenDefs, cells, onTap, selectedId)` → SVG element.
  Hex polygon corners computed from `shape` + `cellCenter`; filled cells show the
  top token's `displayColor` and a text label (e.g. `G2` = green, height 2);
  empty cells are white with a black outline. Exports the pure geometry helpers
  for tests.
- `core/ui/score-view.ts` — `ScoreBreakdown` → plain `<table>` (category label,
  points, total row).
- `core/ui/entry-screen.ts` — assembles the screen for any `GameModule`:
  blocking variant selector → board view + tap-to-edit cell editor (token buttons
  + "Empty", then stack-choice buttons when a token has >1 choice) → live score
  table → "Clear board" / "Change side" (both `confirm()`, side change resets the
  board since the cell sets differ). Persists via `core/storage` on every change.
- `core/storage/index.ts` — `loadBoard(gameId)` / `saveBoard(gameId, board)` /
  `clearBoard(gameId)` under key `game-scorer:<gameId>:board`, with an injectable
  `Storage` for Node tests; corrupt/invalid JSON → `null` (start fresh).
- `app/main.ts` — mounts the entry screen with the `harmonies` module
  (no game-select screen yet — one game, don't over-build).
- Tests: `games/harmonies/tests/entry.test.ts`,
  `core/ui/entry-state.test.ts`, `core/storage/storage.test.ts`
  (the Vitest glob already covers `core/**/*.test.ts`).

**Modified (all additive):**
- `core/types/index.ts` — the four contract extensions above.
- `games/harmonies/topology.ts` — `cellCenter`: flat-top axial layout,
  `x = 1.5q`, `y = √3·(r + q/2)` (matches M1's odd-columns-shifted-down
  convention).
- `games/harmonies/tokens.ts` — `displayColor` per token.
- `games/harmonies/entry.ts` (new) + `games/harmonies/index.ts` — wire
  `variants` and `stackChoices` into the `GameModule`.
- `index.html` — `<script type="module" src="/app/main.ts">`, drop the M1 stub
  text. No CSS.

**Untouched:** `games/harmonies/rules.ts`, `core/graph.ts` — engine behavior is
frozen; all existing tests must stay green.

## UI flow

1. On load, try restoring the saved board from localStorage. If none, show only
   the required side prompt: "Side A (river)" / "Side B (islands)" buttons.
   Nothing else renders — and `score()` never runs — until a side is chosen; the
   side is never inferred.
2. Once a side is set, render the hex grid (23 or 25 cells), the cell editor
   area, the live score table, and Clear/Change-side controls.
3. Tap a cell → it highlights; the editor shows one button per token plus
   "Empty". Blue/yellow apply immediately; green/gray/brown/red show their stack
   choices (height 1–3 etc.), defaulting per spec to the height-1 choice being
   the first listed. Choosing writes the full bottom-to-top stack.
4. Every change saves to localStorage and recomputes the breakdown via
   `harmonies.score(board, EMPTY_CONFIG)`. Animals/Spirit rows display 0 (M3).

## M5 reuse boundaries (design now, don't build)

- `board-view.ts` is stateless (topology + cells + tap callback in, SVG out) —
  M5 renders the same view over a warped photo and adds an overlay; no rewrite.
- `entry-screen.ts` takes its initial `BoardState` from storage-or-empty today;
  M5 feeds a vision-proposed `BoardState` through the same editing path — the
  cell editor *is* the correction UI, and the green/gray choice picker *is* the
  depth annotator.
- `stackChoices` already encodes the depth-annotation vocabulary M5 needs.

## Tests

- `games/harmonies/tests/entry.test.ts` — every `stackChoices` stack passes
  `validateStack()`; choices exist for all 6 tokens; green/gray offer exactly
  heights 1–3; `variants` lists exactly A and B.
- `core/ui/entry-state.test.ts` — set/clear round-trips into a well-formed
  `BoardState` (only non-empty cells serialized); `validateSavedBoard` rejects
  off-board cells, illegal stacks, wrong shapes.
- `core/storage/storage.test.ts` — save/load round-trip with a fake `Storage`;
  corrupt JSON and missing keys return `null`.
- DOM glue (`board-view`, `entry-screen`) stays thin and is verified end-to-end
  in the browser rather than unit-tested — avoids adding a jsdom dependency.

## Verification

1. `npm test` — all M1 tests still green plus the new ones.
2. `npm run build` — strict typecheck + Vite build green.
3. End-to-end in the real app: `npm run dev`, drive with Playwright
   (`/opt/pw-browsers/chromium`): pick Side A → enter the known board from
   `score.test.ts`'s integration fixture cell by cell → assert the on-screen
   total equals the engine's expected total; reload the page → board and score
   persist; "Change side" → confirm → board resets and re-prompts. Screenshot
   the board for a visual sanity check of the 5-4-5-4-5 hex layout.
4. Gate green → commit → `git push -u origin claude/m2-manual-board-entry-m1s7q9`.

## Execution order

0. Copy this plan to `planning/harmonies-m2-plan.md`.
1. `core/types` extensions; `games/harmonies` entry data + `cellCenter`;
   their tests.
2. `core/ui/entry-state.ts` + `core/storage` + their tests (pure Node).
3. `board-view.ts`, `score-view.ts`, `entry-screen.ts`, `app/main.ts`,
   `index.html`.
4. Verification steps above; fix until green; commit and push.
