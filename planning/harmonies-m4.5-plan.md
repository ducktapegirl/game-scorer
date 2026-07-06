# Milestone 4.5 Plan — Real-Photo Hardening (corner-tile calibration, cube-proof voting classifier, calibrated swatches)

## Context

M4's pipeline works on synthetic photos but the first real photos
(`resources/test_image1.jpg`, side A) break three of its assumptions: the board has
no corners to tap (it's a rounded organic shape), translucent amber/white animal
cubes sit at the center of tokens where the sampler reads, and every token is
two-tone (base + printed pattern) rather than one flat color. This milestone fixes
all three and replaces the placeholder side-A calibration with values measured from
the real photo. Engine (`rules.ts`) untouched; plain UI constraint holds.

## Design decisions

1. **Calibrate on the 4 corner hex tiles, not board edges.** The grid-corner cells
   of both sides form a perfect rectangle in `cellCenter` layout space (side A:
   `0,0` / `4,-2` / `4,2` / `0,4`; side B: `0,0` / `6,-3` / `6,0` / `0,3`), and the
   hex layout is an exact model of the physical grid up to an affine transform —
   which the homography absorbs. So fitting the homography through the 4 tapped
   corner-tile centers, with `cellCenter` as the source frame, makes every other
   cell's sample point exact **with no margin estimation at all**:
   - `BoardTopology.calibrationCells?: [CellId, CellId, CellId, CellId]`
     (TL, TR, BR, BL in layout orientation) replaces `cellCenterNorm` in
     `core/types` — `cellCenterNorm` and `BOARD_MARGINS` are **deleted** (M4 is
     unmerged; no compatibility concern).
   - `propose.ts`: homography source points are `cellCenter(calibrationCells[i])`,
     destinations are the taps; all cells sampled at `H·cellCenter(id)`.
   - Photo-screen prompts become "Tap the center of the top-left corner tile of the
     hex grid (the tile, or the token sitting on it)". Entry-screen gates the photo
     button on `calibrationCells` instead of `cellCenterNorm`.
   - Known limitation (accepted): tokens have physical height, so on an angled
     photo a token's top is parallax-shifted off the board plane. Tapping token
     tops on the corners puts the sampling plane at token height, which is
     roughly where all token tops are; the M2 editor / M5 correction is the
     backstop. Not solved further in M4.5.

2. **Per-pixel plurality voting instead of median-then-classify.** A cube-topped
   cell's patch is multi-modal (token base + token pattern + cube) — no single
   median color represents it. New classification:
   - `sample.ts`: `collectPatch(image, center, radius): Rgb[]` — all pixels in the
     **circular** patch (clamped at edges). The median `samplePatch` is removed.
   - `classify.ts`: `classifyPatch(pixels, vocabulary, emptySwatches,
     ignoreSwatches)` — each pixel classified to its nearest swatch among token
     swatches ∪ empty swatches ∪ **ignore swatches**; ignore-pixels are discarded;
     the winner is the plurality label among the rest (tie → lower mean ΔE).
     Returns vote shares, ignored share, mean ΔE, mean RGB of winning pixels
     (feeds recalibration), and the runner-up label + share.
   - `propose.ts`: patch radius ratio 0.2 → **0.3** of nearest-neighbor spacing
     (wider, so token pixels outvote the cube), tuned against the real photo
     during verification.
   - `CellDebug` and the photo-screen table gain: winner vote %, ignored %,
     runner-up %, mean winning RGB. This is the new calibration readout.

3. **Multi-swatch tokens + ignore swatches as game data** (`core/types`):
   - `TokenDef.referenceSwatch?: Lab` → `referenceSwatches?: Lab[]` (base tone +
     pattern tone(s) per token — same shape as `emptySwatches` already has).
   - `GameVisionSpec` gains `ignoreSwatches: Lab[]` — colors that mean "something
     is sitting on the token, don't let it vote": amber cube (calibrated from the
     photo) and white cube (marked placeholder until one appears in a photo).
     Not variant-keyed — cubes look the same on both sides.

4. **Real side-A calibration from `resources/test_image1.jpg`.** During
   implementation (not in the shipped app):
   - Transcribe the 23-cell ground truth and the 4 corner-tile pixel positions
     from the photo at full resolution; record the transcription in the
     verification output for user review.
   - A scratchpad Playwright script loads the photo in Chromium canvas, maps every
     cell via the corner-tap homography, collects per-cell patch pixels grouped by
     transcribed token, and derives swatches (2 tones per token via a simple
     2-medians split; empty-cell tones for `emptySwatches`; amber-cube pixels for
     `ignoreSwatches`).
   - Write the measured values into `games/harmonies/tokens.ts` and `vision.ts`
     as side-A data. Side B and the white cube stay clearly-marked placeholders.
     If any token color never appears in the photo (e.g. no brown-topped stack),
     it keeps a marked placeholder too — noted in code comments.

## Files

- `core/types/index.ts` — `calibrationCells`, `referenceSwatches: Lab[]`,
  `GameVisionSpec.ignoreSwatches`; remove `cellCenterNorm`.
- `core/vision/sample.ts` — `collectPatch` (circular), drop `samplePatch`.
- `core/vision/classify.ts` — `classifyPatch` voting classifier (replaces
  `classifyColor`).
- `core/vision/propose.ts` — corner-tile homography frame, voting, wider radius,
  richer `CellDebug`.
- `core/ui/photo-screen.ts` — corner-tile prompts, new debug columns.
- `core/ui/entry-screen.ts` — gate on `calibrationCells`.
- `games/harmonies/topology.ts` — `calibrationCells` per side; delete
  `BOARD_MARGINS`/`cellCenterNorm`.
- `games/harmonies/tokens.ts`, `games/harmonies/vision.ts` — measured side-A
  swatches (multi-tone), amber ignore swatch, marked placeholders for the rest.
- Tests updated in place: `core/vision/*.test.ts` (synthetic fixtures repainted as
  two-tone discs with amber "cubes" at some centers, taps on corner cells),
  `games/harmonies/tests/vision.test.ts` + `topology.test.ts`
  (calibrationCells valid, at layout-bbox corners, in TL/TR/BR/BL order).

**Untouched:** `games/harmonies/rules.ts`, `core/graph.ts`, all scoring logic/tests.

## Verification

1. `npm test` + `npm run build` green.
2. Playwright, synthetic flow (regression): as in M4 but with corner-tile taps,
   patterned discs, and cubes painted on several tokens — exact board recovered.
3. Playwright, **real photo**: feed `resources/test_image1.jpg` through the actual
   UI via the file input, click the 4 corner tiles, "Read board", assert the
   proposal matches my transcription cell-for-cell (report any mismatches with
   their debug rows rather than silently tuning until green — misreads inform
   swatch/radius tuning, which is then re-run). Screenshot the review screen and
   share it with the transcription for user sign-off.
4. Commit + push after each green gate (step-0 plan commit, then implementation).

## Out of scope

- Side B calibration and white-cube measurement (need photos of those).
- Parallax/height compensation for angled photos.
- Depth annotation, photo-overlay correction (M5); styling (still plain).
