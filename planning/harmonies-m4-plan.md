# Milestone 4 Plan — Vision Layer (Photo → Proposed BoardState)

## Context

M1–M3 are merged to `main`. This milestone builds **M4 only**: turning a photo of the
physical board into a *proposed* `HarmoniesBoardState` (top colors only), per spec §8 —
corner-tap calibration → homography → per-cell color sampling → nearest-swatch Lab
classification, entirely client-side with **zero new dependencies** (the 4-point
homography is ~60 lines of linear algebra; OpenCV.js is not needed). No photo-overlay
correction, no depth annotation, no boardSide detection (all M5 or never). The proposed
board lands in the existing M2 entry screen, which already works as an editing surface.

Confirmed decisions:
1. **Placeholder calibration data + debug tooling** (the M3 card-data pattern): swatch
   Lab values and board-margin geometry ship as clearly-marked estimates; a built-in
   debug view (sampled color per cell, distances, sample-point overlay) lets the user
   tune them from real photos afterward. Data-only edits; tests keep shapes honest.
2. **Red top → propose `[brown, red]`** (building). Rules note (confirmed with the
   user): a red tile may legally be placed alone, but a lone red is *not* a completed
   building and never scores — it does still count toward a neighboring building's
   3-distinct-colors check, exactly as `rules.ts` already encodes. The vision layer
   can't see under a red token, and the two readings are neighbor-identical (the top
   token is red either way); they differ only in the cell's own 5 building points. At
   game end nearly every red sits on a base, so defaulting to `[brown, red]` is right
   far more often; spec §7 says the hidden base is scoring-irrelevant — "default it
   and move on" — and the rare lone red gets fixed in correction (M5, or the M2
   editor meanwhile). All other tokens propose their height-1 stack (`[green]`,
   `[gray]`, `[blue]`, `[yellow]`, `[brown]`); heights are M5's depth-annotation job.
3. **M4 ends inside the entry screen**: "Score from photo" → calibrate → classify →
   review + debug table → "Use this board" replaces the current board (with confirm)
   in the existing entry/scoring flow.

Gate: `npm test` + `npm run build` green, end-to-end browser verification (below),
then commit and push on the designated feature branch.

Step 0 of execution — copying this plan into `planning/` — is already done (this file).

## Design decisions

1. **Mechanism in `core/vision`, Harmonies specifics as data** (architecture doc §§4–5).
   All pipeline code is written against `BoardTopology`, `TokenDef.referenceSwatch`,
   and a small vision spec on the game module — never against hexes or the 6 colors.
2. **No image warp.** Instead of warping the whole photo flat, map each cell's
   *normalized board position* through the homography into photo space and sample a
   patch there. Same math, far less code, no canvas round-trip; the homography maps
   the unit square (0,0)-(1,1) onto the 4 tapped corner points.
3. **Pure pixel access.** Sampling/classification operate on a structural
   `PixelSource = { width, height, data: Uint8ClampedArray }` — compatible with DOM
   `ImageData` but constructible in plain Node, so the entire pipeline (minus the file
   input and taps) is unit-testable without jsdom, matching M2/M3 practice.
4. **Classification** (spec §8): median RGB over a patch (window radius ∝ the photo-px
   distance between adjacent cell centers, so it adapts to photo scale) → sRGB→Lab
   (D65) → nearest swatch by ΔE among the 6 token swatches **plus the game's
   empty-board swatches**. Empty wins → cell omitted from the proposal.
5. **Multiple empty swatches per board side.** The printed board art is not one flat
   color — side A has a printed river that could shade toward the blue token. The
   game supplies a *list* of empty-board Lab swatches per variant; any of them winning
   means "empty". Placeholders start with one estimate per side; the debug view exists
   precisely to discover which extra empties are needed. (If real photos later show
   per-region art defeating swatch lists, the fallback is an empty-board reference
   photo per side — noted as a possible M4.5, not built now.)
6. **Contract extensions in `core/types`** (additive; architecture doc §§4–5):
   - `Lab = { L: number; a: number; b: number }`; `TokenDef.referenceSwatch?: Lab`
     (narrowed from the M1 `unknown` placeholder).
   - `BoardTopology.cellCenterNorm?(id): { x; y }` — the cell center in normalized
     [0,1]² coordinates inside the calibration rectangle (the architecture doc's
     `cellCenterPx`, split so core owns the px math and the game owns only geometry).
     Optional: only `hasVisualBoard` games supply it.
   - `GameModule.vision?: { emptySwatches(variant): Lab[]; proposedStack(token): TokenId[] }`
     — present iff `hasVisualBoard`; the entry screen shows the photo flow only when set.
7. **Corner-tap UX**: prompted order TL → TR → BR → BL of the board as displayed,
   a dot marker per tap, "Undo tap" and "Start over" buttons. Photo drawn to a canvas
   capped at ~1600 px on the long side (display and sampling use the same canvas).
   All browser-default UI, no CSS, per the plain-UI constraint.
8. **The debug view ships as part of the flow, always visible in M4** — it *is* the
   calibration tool: per-cell table (cell id, sampled RGB + Lab, chosen token, ΔE to
   winner and runner-up) plus sample-point dots drawn over the photo so the margin
   constants can be tuned, and the proposed board rendered via the existing
   `renderBoard` for a side-by-side eyeball check.

## Harmonies vision data

- `games/harmonies/topology.ts` — `cellCenterNorm`: reuse the existing `cellCenter`
  layout units, normalize the grid's bounding box (including hex extents) into [0,1]²,
  then inset by `BOARD_MARGINS` — named per-side `{ left, right, top, bottom }`
  fractions of the board rectangle, **placeholder estimates clearly marked** for
  tuning against a real photo via the debug overlay.
- `games/harmonies/tokens.ts` — `referenceSwatch` Lab placeholders per token,
  estimated from typical token colors, clearly marked (like M3's dummy card tracks).
- `games/harmonies/vision.ts` (new) — `emptySwatches(side)` (placeholder list per
  side) and `proposedStack(token)`: red → `[brown, red]`, everything else →
  `[token]`. Every proposed stack must pass the existing `validateStack()`.

## Files

**New:**
- `core/vision/homography.ts` — `computeHomography(src4, dst4)` via DLT + 8×8 Gaussian
  elimination; `applyHomography(h, point)`. Pure math, no deps.
- `core/vision/color.ts` — sRGB→Lab (D65) conversion, `deltaE` (CIE76 — adequate for
  6 well-separated colors).
- `core/vision/sample.ts` — `PixelSource` type; median-per-channel patch sampling.
- `core/vision/classify.ts` — the architecture doc's `TokenClassifier`: nearest-swatch
  over `TokenDef[]` + empty swatches → `TokenId | null`.
- `core/vision/propose.ts` — `proposeBoard(image, corners, topology, vocabulary,
  visionSpec, variant)` → `{ board: BoardState; debug: PerCellDebug[] }`, composing
  the above. Pure; the DOM never touches it.
- `core/ui/photo-screen.ts` — DOM glue: file input
  (`accept="image/*" capture="environment"`), canvas + corner taps, "Read board",
  debug table + overlay + proposed-board preview, "Use this board" / "Cancel".
- `games/harmonies/vision.ts` — as above.
- Tests: `core/vision/homography.test.ts`, `color.test.ts`, `sample.test.ts`,
  `classify.test.ts`, `propose.test.ts` (the Vitest glob already covers
  `core/**/*.test.ts`), `games/harmonies/tests/vision.test.ts`, plus
  `cellCenterNorm` cases in the existing `topology.test.ts`.

**Modified (additive only):**
- `core/types/index.ts` — `Lab`, `referenceSwatch` narrowing, `cellCenterNorm?`,
  `GameModule.vision?` (decision 6).
- `games/harmonies/topology.ts`, `tokens.ts`, `index.ts` — vision data + wiring.
- `core/ui/entry-screen.ts` — a "Score from photo" button (shown when
  `module.vision` is set and a side is chosen); mounts the photo screen; on accept,
  the proposal goes through the existing `setBoard` (persists + re-scores).

**Untouched:** `games/harmonies/rules.ts`, `core/graph.ts`, all M1–M3 scoring logic
and tests — engine behavior is frozen; everything stays green unmodified.

## UI flow

1. Entry screen (side already chosen, since `boardSide` is always manual) → tap
   "Score from photo".
2. Pick/take a photo → it renders on a canvas.
3. Tap the 4 board corners in the prompted order; undo/restart as needed.
4. "Read board" → pipeline runs → proposed board preview (existing SVG renderer),
   per-cell debug table, sample-point overlay.
5. "Use this board" → confirm (it replaces the current board) → back to the entry
   screen with the proposal loaded, live-scored, editable cell-by-cell as today.
   Config/cards are untouched by the photo flow.

## Tests (written first, pure Node)

- **homography** — maps the 4 correspondences exactly; round-trips interior points
  under a known synthetic perspective; identity and pure-affine cases.
- **color** — anchor checks against published sRGB→Lab values (white, black,
  primaries); ΔE symmetry and zero-on-identical.
- **sample** — median rejects a synthetic glare pixel; window clamps at image edges.
- **classify** — exact swatch → that token; perturbed swatch → nearest; empty swatch
  nearest → null; ambiguity margin reported in debug output.
- **propose (end-to-end fixture)** — build a synthetic photo in Node: pick an
  arbitrary known homography, paint each cell's true token color (plus noise) at its
  warped `cellCenterNorm` position over an empty-swatch background, then run
  `proposeBoard` with the warped unit-square corners and assert the **exact** intended
  `BoardState` comes back — including red → `[brown, red]` and empty cells omitted.
  Deterministic whole-pipeline math check, no real photo required.
- **harmonies vision data** — every `proposedStack` passes `validateStack()`; red maps
  to `[brown, red]`; `cellCenterNorm` stays within [0,1]² with margins respected and
  preserves `cellCenter`'s relative layout; swatches exist for all 6 tokens; empty
  swatch lists non-empty for both sides.

## Verification

1. `npm test` — all M1–M3 suites still green plus the new vision suites.
2. `npm run build` — strict typecheck + Vite build green.
3. End-to-end in the real app: `npm run dev`, drive with Playwright
   (`/opt/pw-browsers/chromium`): generate a synthetic board photo as a PNG (same
   generator as the fixture test), feed it through the file input, click the 4 known
   corner positions, "Read board" → assert the debug table and preview match the
   intended board → "Use this board" → assert the entry screen shows it and the score
   table matches the engine's expected total. Screenshot for sanity.
4. Post-merge (user, with debug view): photograph the real board, inspect per-cell
   ΔE table, tune `BOARD_MARGINS` / swatch Lab values / empty-swatch lists —
   data-only edits, same follow-up pattern as M3's real card values.

## Execution order

1. `core/types` extensions; `core/vision/color.ts` + `homography.ts` + their tests.
2. `sample.ts`, `classify.ts`, `propose.ts` + tests (incl. the synthetic end-to-end
   fixture); `games/harmonies` vision data + tests.
3. `core/ui/photo-screen.ts`; entry-screen integration.
4. Verification above; fix until green; commit and push to the designated branch.

## Out of scope (explicitly)

- Photo-overlay correction UI and green/gray depth prompts — M5 (the M2 editor is the
  interim correction path).
- OpenCV.js or any new dependency; server/API calls of any kind.
- Detecting `boardSide` from the photo — permanently manual (spec §3.1).
- Real calibration values — follow-up data edits after the user's first photos.
- Any styling; the plain-UI constraint holds.
