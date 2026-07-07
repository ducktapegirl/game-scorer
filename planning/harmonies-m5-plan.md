# Milestone 5 Plan — Correction + Depth Annotation

## Context

M1–M4 (plus the M4.5 real-photo hardening) are merged to `main`. This milestone builds
**M5 only**: the photo-based correction and depth-annotation surface that turns the
vision proposal into a final board ready to score. Spec §5, §7, §9: "Correction + depth
annotation: overlay, tap-to-fix, green/gray height picker, then score."

The M4.5 addendum explicitly promised that the classifier's uncertainty signals
(low vote share, high ignored cube %, close runner-up — e.g. island photo B1's
documented misread at cell `1,2`) surface in the M5 correction UI as visible flags.

M5 reuses the M2 cell editor as the correction mechanism; the M5 flow is: photo →
corner-tile taps → `proposeBoard` → *editable working board with uncertainty flags*
(NEW) → live-corrected board → "Use this board" → back to entry screen, which scores.
No scoring happens during correction; the entry screen's score table appears only after
accepting the board.

Work happens on branch `claude/harmonies-m5-plan-rs3sp1`. Gate: `npm test` +
`npm run build` green, then commit and push.

Per CLAUDE.md, **step 0 of execution is copying this plan** to the repo (done in this
session). Step 1 (implementation) happens in a later session after plan review.

## Design decisions

1. **Correction lives in the photo screen's result phase.** After "Read board", the
   proposal becomes an editable *working board*; users tap/gesture to fix cells and
   adjust heights. "Use this board" (with no blocking) hands off the corrected board
   to the entry screen exactly as today (spec §9: "then score"). No live score table
   during correction; the entry screen provides it immediately after accept. The
   photo screen remains the exclusive place where photo, homography, debug data, and
   working board coexist.

2. **Extract the M2 cell editor into `core/ui/cell-editor.ts`.** A stateless,
   reusable component used by both `entry-screen.ts` (behavior-preserving refactor)
   and the new M5 correction phase. Flagged cells additionally get a "Confirm as-is"
   button (tapping it clears the flag and accepts the cell without changes).

3. **Tap-to-cycle for depth + long press/right-click for full editor** (user-confirmed
   gesture model to avoid tap overloading):
   - **Tap** on a green/gray cell cycles its height through the game's `stackChoices`
     for that top token (1→2→3→1); the board label (`G2` etc.) updates in place.
     Exactly matches spec §7: "default to 1, tap to raise."
   - **Tap** on any other cell (or an empty one) does nothing — depth tokens only.
   - **Long press** (~500 ms, pointer events so touch and mouse both work; suppress
     the following synthetic click) or **right-click (mousedown)** on *any* cell opens
     the full cell editor: change color, set any stack, mark empty, "Confirm as-is"
     when flagged.
   - A one-line hint on the screen states the gestures.
   - Which tokens tap-cycle is **game data**: new contract field
     `GameVisionSpec.depthTokens?: TokenId[]` (Harmonies: `["green", "gray"]`) —
     tokens whose vision-proposed height-1 stack has scoring-relevant hidden depth.
     Red is deliberately *not* a depth token (spec §7: default `[brown, red]` and
     move on; its points depend only on neighbors, not on what's underneath).
   - Gesture handling lives in one shared helper (`core/ui/press-gesture.ts`) wired
     to both tap surfaces (photo canvas + SVG board); the M2 entry screen keeps its
     current tap-to-edit behavior (unchanged).

4. **Tappable photo overlay with uncertainty markers:**
   - Map each cell's hex outline (layout-space `cellCorners`) through the calibration
     homography into photo space.
   - Draw outlines + token labels (`cellLabel`) for the working board on the canvas.
   - Uncertain cells get a heavier outline + "?" marker (drawn over the label).
   - Canvas pointer events after the result phase hit-test into cells (point-in-polygon);
     both short taps and long presses are handled by the gesture helper.
   - The SVG board below stays a *second* gesture surface showing the identical
     working board, so users can correct from either surface.
   - Pure geometry (`cellPolygons(topology, h)`, `hitTest`) lives in a new
     `core/ui/photo-overlay.ts`, separated from draw calls so it unit-tests in plain
     Node without DOM.
   - Extend `proposeBoard` (additively) to return the homography in its `Proposal`
     type — needed to map cell centers into photo space.
   - Drop the M4 sample-point circles from the overlay (their margin-tuning job ended
     with M4.5 calibration; radius data stays in the debug table for reference).

5. **Uncertainty predicate as core/vision mechanism:** new function
   `isUncertain(classification: PatchClassification): boolean` in
   `core/vision/classify.ts` with named threshold constants (starting points, tuned
   during verification against all three real photos):
   - Winner vote share < 0.5, *or*
   - Runner-up exists and is within 0.15 vote share of the winner, *or*
   - Ignored (cube) share > 0.6.
   - The documented misread in island photo B1 (cell `1,2`) must flag.
   - Flags clear when the user changes the cell (tap-cycle height or full edit) or
     taps "Confirm as-is" to accept the uncertain read. Never blocks acceptance of
     the board.

6. **Debug table moves into a `<details>` collapsible element** (browser-default HTML,
   plain-UI constraint holds). Still complete — per-cell vote results, mean RGB,
   runner-up, ΔE — but collapsed by default so the correction surface is primary.
   A "Check these cells" summary above the board lists all flagged cell ids.

## Files

**New:**
- `core/ui/cell-editor.ts` — extracted M2 editor: token picker, stack choice picker,
  "Empty" and "Confirm as-is" buttons. Stateless: `{ board, cellId, flagged, module,
  onApply, onCancel }` in, nothing out (callbacks handle state).
- `core/ui/press-gesture.ts` — discriminate tap vs. long press / right-click from
  pointer events. Exports `{ onPointerDown, onPointerUp }` state helpers and a
  configurable press duration (~500 ms). Returns `{ type: "tap" | "press" | "cancel" }`
  events. Pure timing/state logic, unit-tested in Node.
- `core/ui/photo-overlay.ts` — `cellPolygons(topology, homography): { cellId,
  polygon: Point[] }[]` (map cells into photo space), `hitTest(polygons, point):
  cellId | null` (point-in-polygon). Exported for tests; used by photo-screen to
  render overlays and handle clicks. All geometry, no DOM.
- `core/ui/photo-overlay.test.ts` — homography mapping, hit-test inside/outside, edge
  cases (boundary cells, clicked on corners).
- `core/vision/classify.ts` — new `isUncertain(classification): boolean` function +
  named threshold constants; tested against synthetic and real classifications.
- Test cases in `core/vision/classify.test.ts`: uncertain vs. confident
  classifications, threshold edge cases.
- Test cases in `games/harmonies/tests/vision.test.ts`: `depthTokens` is exactly
  green + gray; each has >1 stackChoices; red excluded.

**Modified (all additive, no behavior changes to scoring or existing UIs):**
- `core/types/index.ts`:
  - `GameVisionSpec.depthTokens?: TokenId[]` (tokens that tap-cycle).
  - Extend `Proposal` type in `core/vision/propose.ts` to optionally carry the
    homography (to map cells into photo space in M5).
- `core/vision/propose.ts`: return the computed homography in the `Proposal` result.
- `core/ui/photo-screen.ts`:
  - Import and wire the extracted `cell-editor.ts`.
  - After "Read board" (result phase): render an editable working-board UI over the
    photo with overlay + SVG + depth hints + "Check these cells" list.
  - Wire pointer events from canvas + SVG into `press-gesture` helper.
  - Tap-cycle cycles the working board's cell stacks; long press/right-click opens
    the editor.
  - "Use this board" is always available (never blocked by flags).
  - Move the debug table into `<details>`.
- `core/ui/entry-screen.ts`: refactor to use extracted `cell-editor.ts` (no behavior
  change; the M2 flow is identical).
- `games/harmonies/vision.ts`: export `depthTokens: ["green", "gray"]`.

**Untouched:** `games/harmonies/rules.ts`, `core/graph.ts`, all scoring logic and
tests. M5 is a UI-only addition; the engine stays frozen.

## UI flow

1. Entry screen (side already chosen) → "Score from photo" button.
2. Pick a photo → it renders on a canvas.
3. Tap the 4 board corners (as M4); undo/restart as needed.
4. "Read board" → `proposeBoard` runs → result phase (NEW M5 flow):
   - Prompt: "Correct the board — tap cells to cycle green/gray heights, long-press
     or right-click to change colors."
   - Rendered:
     - Photo canvas with hex cell outlines + labels mapped via homography; uncertain
       cells marked with "?".
     - SVG board below (identical state, alternative tap surface).
     - One-line list: "Check these cells: 1,2 · 3,4" (or empty if none).
     - `<details>` debug table (closed by default).
   - User taps green/gray cells to raise height, long-presses to open full editor,
     fixes colors/stacks as needed, taps "Confirm as-is" on any remaining uncertain
     cells to clear flags.
5. "Use this board" → confirm (if current board non-empty) → the corrected board
   goes into `entry-screen.setBoard` → entry screen renders with live score table.
   Config/cards are untouched (they live in entry screen, not photo flow).

## Tests (written first, pure Node where possible)

**core/ui/photo-overlay.test.ts**
- Cell centers map exactly through a known homography; round-trip checks.
- Polygon hit-test: point inside, point outside, point on boundary, corners.
- Multiple cells, no false positives across neighbors.

**core/ui/press-gesture.test.ts**
- Tap: down + up within ~100 ms → tap event.
- Long press: down + hold 500+ ms → press event; up suppresses the synthetic click.
- Right-click (mousedown with button=2) → immediate press event (no wait).
- Cancellation: move the pointer away and up → cancel event.

**core/vision/classify.test.ts**
- `isUncertain` with synthetic classifications: vote share < 0.5 → uncertain;
  runner-up within 0.15 → uncertain; ignored > 0.6 → uncertain; otherwise confident.
- Boundary cases: exactly 0.5 vote share (not uncertain), runner-up exactly 0.15 away
  (uncertain).

**games/harmonies/tests/vision.test.ts**
- `depthTokens` equals `["green", "gray"]`.
- Green and gray each have exactly 3 stackChoices (heights 1–3).
- Red is not in `depthTokens`.
- `stackChoices` order for green/gray is h1 → h2 → h3 (so tap-cycle produces the
  right sequence).

**All existing suites stay green** (`npm test`, `npm run build`).

**DOM glue** (photo-screen integration: gesture handling, overlay rendering, working
board state) is verified end-to-end in Playwright rather than unit-tested to avoid
adding jsdom.

## Verification

1. `npm test` — all M1–M4 suites stay green plus new overlay/gesture/uncertain tests.
2. `npm run build` — strict typecheck + Vite build green.
3. **Playwright synthetic flow:**
   - Generate a synthetic board photo: several tokens, a cube sitting on one cell
     (triggers high ignored %), a close color pair (to flag runner-up ambiguity).
   - Feed through the file input, tap 4 known corners, "Read board".
   - Assert the flagged cell's "?" appears on the overlay.
   - Tap-cycle a green cell three times, watch the label cycle 1→2→3→1.
   - Long-press an uncertain cell, open the editor, change its color, apply.
   - Assert the flag clears and the overlay updates.
   - Tap "Use this board", assert it hands off to the entry screen with the
     corrected board, live score matches engine's expected total.
4. **Playwright real photos (all three: side A + both island photos):**
   - Feed `resources/test_image1.jpg` (side A), tap corners, read → assert B1's
     documented misread at cell `1,2` is flagged.
   - Fix it (tap-cycle or editor), check that flag clears.
   - "Use this board" → entry screen scores it; verify the score matches.
   - Repeat for both island photos; check that no other cells misclassified
     compared to M4.5's verification output.
   - Collect flag counts per photo and report them (not silently tuned down).
   - Screenshots of all three corrected boards for sign-off.

## Execution order

0. (This session: write this plan to the repo, commit, push.)
1. (Later session: implement M5 in this order)
   - `core/ui/press-gesture.ts` + tests (pure timing/state).
   - `core/ui/photo-overlay.ts` + tests (pure geometry).
   - `core/types/index.ts` extensions; `core/vision/propose.ts` homography export;
     `core/vision/classify.ts` `isUncertain` + tests.
   - Extract M2 editor into `core/ui/cell-editor.ts`; refactor
     `core/ui/entry-screen.ts` to use it (no behavior change).
   - Wire correction phase into `core/ui/photo-screen.ts`.
   - `games/harmonies/vision.ts` `depthTokens` export; test cases.
   - Verification above; fix until green; commit and push.

## Out of scope (explicitly, for M5 or later)

- Angled-photo parallax compensation (noted as a known limitation in M4.5).
- Depth annotation for any token other than those in `depthTokens` (user's game, user
  decides).
- Styling beyond the plain-UI constraint; no CSS.
- Advanced calibration tools (tuning swatches in-app); the M4.5 debug table is the
  existing calibration mechanism.
- Side B depth annotation if it doesn't exist; measurement only on real photos.
