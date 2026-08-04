# M4.6 — Camera-independent tile color detection

## Context

The vision classifier was calibrated against one camera under one lighting condition and
breaks on a photo from a different phone in warm indoor light. This plan makes the
classifier normalize each photo before classifying, adds a real-photo regression test
(there is none today), and gives the user an in-app way to hand back ground truth.

### Why it fails today

`games/harmonies/tokens.ts:23-42` stores **absolute** sRGB swatches measured from
`resources/test_image1.jpg` (a Pixel 10 Pro daylight shot). `classifyPatch`
(`core/vision/classify.ts:55-77`) assigns every pixel to the nearest of those swatches in
Lab and takes a plurality. There is **no white-balance, exposure, or per-photo
normalization anywhere in `core/vision/`** — verified by reading every file in it.

So a new sensor + warm tungsten light shifts the entire measured cloud away from the
swatch set, and because there is also **no absolute ΔE reject**, every pixel still votes
for *something*. Failures are silent and confident. Specifically, in the supplied photo:

- the red building tile reads as washed dusty salmon, far from `red {182,59,58}` and much
  closer to `brown {128,86,77}` / the cream empty tones;
- gray tiles read warm-taupe, overlapping `brown`;
- olive greens drift toward the `yellow` flower-print tone `{211,152,90}`;
- the board's own printed teal background sits near the `blue` token color.

Two secondary contributors, both visible in the photo:

- **Amber cubes sit dead-center** in the sample disc on ~10 of 25 cells. `collectPatch`
  (`core/vision/sample.ts:18`) samples a full disc centered on the hex center, so cube
  pixels are maximally represented. The `CUBE_TONES_RGB` ignore-swatches
  (`games/harmonies/vision.ts:37-43`) are themselves absolute colors and drift with the
  illuminant just like the token swatches.
- Specular highlights on the glossy tiles get captured by the placeholder white-cube
  ignore tone `{240,240,235}`, and deep inter-tile shadows have no handling at all.

### Also worth fixing while here

- `resources/test_image2.jpg` is a **byte-identical duplicate** of `test_image1.jpg`, so
  the "4 sample photos" are really 3 distinct boards.
- No automated test touches a real photo. `games/harmonies/tests/vision.test.ts` paints a
  synthetic board using the very swatches it then tests — circular, and structurally
  unable to catch a bad swatch.
- `createImageBitmap(file)` at `core/ui/photo-screen.ts:260` passes no options, so whether
  EXIF orientation is applied is browser-dependent. Harmless for the live app (taps and
  pixels share a canvas, and the homography absorbs the rotation) but it makes a committed
  fixture non-reproducible in Node.

### Intended outcome

A photo from an unseen camera under unseen lighting classifies correctly, and a
`npm test` run proves it against real committed photos rather than synthetic ones.

## Decisions taken (from the user)

- Ground truth is exported from the **existing M5 correction UI**, not a new page.
- Scope is **per-photo normalization**, plus sampling and reject-threshold changes.
- **`jpeg-js`** may be added as a devDependency so tests decode real photos in Node.
- Only **this one new photo** for now; calibrate across it plus the 3 distinct existing boards.

## Board transcription (provisional — the export will confirm)

Read off the supplied photo. Layout is 4-3-4-3-4-3-4 = 25 hexes, so **Side B (islands)**.
Rows top-to-bottom as the photo is oriented (cell ids depend on which physical corner the
user taps as `0,0`, so this is deliberately picture-relative):

| Row | Tiles |
|---|---|
| 1 | gray, yellow, gray, yellow |
| 2 | yellow, green, blue |
| 3 | gray, green, green, red |
| 4 | yellow, gray, green |
| 5 | yellow, gray, blue, green |
| 6 | blue, gray, green |
| 7 | *(empty)*, gray, blue, green |

Totals: gray 7, green 7, yellow 5, blue 4, red 1, empty 1. This becomes the provisional
fixture so work is not blocked waiting on the export; the user's exported JSON replaces it.

## Work

### 0. Plan file into the repo

Per `CLAUDE.md`, copy this plan to `planning/harmonies-m4.6-vision-color-plan.md` as the
first commit so it is reviewable in an editor.

### 1. Ground-truth export (do first — unblocks the user)

**`core/ui/photo-screen.ts`** — add an "Export labels" button inside the existing collapsed
debug `<details>` (built at lines 428-433, next to `renderDebugTable`). It serializes the
*corrected* `workingBoard`, so the user's normal correction workflow doubles as labeling:

```jsonc
{
  "image": "IMG_20260803_1955332.jpg",
  "boardSide": "B",
  "rotation": 90,                    // quarter-turns already applied in-app
  "canvas": { "width": 1201, "height": 1600 },
  "taps": [ {"x":0.19,"y":0.14}, ... ],   // 4 taps, normalized 0..1 of canvas
  "cells": { "0,0": "gray", "0,1": null, ... }  // TOP token per cell, null = empty
}
```

Button writes to `navigator.clipboard` and also renders the JSON in a `<textarea>` so it
works on mobile Safari where clipboard writes can fail. Taps are normalized so the fixture
survives a change to `MAX_CANVAS_SIDE` (`photo-screen.ts:23`).

Only the top token is exported — vision never determines stack height
(`games/harmonies/vision.ts:57-70` proposes it from a lookup, height is a human tap-cycle),
so height is not something a color test should assert.

**Make orientation deterministic** in the same change: pass
`createImageBitmap(file, { imageOrientation: "from-image" })` at `photo-screen.ts:260`, so
the browser raster and the Node harness agree. The recorded `canvas.width/height` acts as
the cross-check.

Ask the user to run this on the **exact JPEG they uploaded** and paste the JSON back.

### 2. Real-photo test harness

- Add `jpeg-js` to `devDependencies` (pure JS, no native build, never bundled — the app
  keeps zero runtime deps). If it ships no types, add a one-line `.d.ts`.
- Commit the photo as `resources/test_image_islands3.jpg`.
- Fixtures in `resources/fixtures/*.json` (this photo, plus the 3 existing distinct boards
  labeled the same way once the export exists).
- **`games/harmonies/tests/photo-fixture.ts`** (helper, not `*.test.ts`, so vitest's
  `games/**/tests/**/*.test.ts` glob skips it): decode JPEG → read EXIF orientation from
  the APP1 segment (~40 lines, no dep) → apply it → apply the fixture's `rotation` →
  box-filter downscale to `MAX_CANVAS_SIDE` → assert the result matches the recorded
  `canvas` dims → denormalize taps → build a `PixelSource`.
- **`games/harmonies/tests/real-photos.test.ts`**: run `proposeBoard` per fixture, compare
  each cell's top token to the label, print a confusion matrix on failure.

Run this **before** any algorithm change to record the baseline miss count — that number is
what the rest of the plan is measured against.

### 3. Per-photo color normalization (the core fix)

New **`core/vision/normalize.ts`** — game-agnostic, so it stays inside the `core/` rule; it
consumes whatever swatches the `GameVisionSpec` and vocabulary already provide and needs no
change to `core/types`.

```ts
export interface ChannelTransform {
  gain: [number, number, number];    // per-channel, linear light
  offset: [number, number, number];
}
export interface NormalizationResult {
  transform: ChannelTransform;
  meanDeltaEBefore: number;
  meanDeltaEAfter: number;
  applied: boolean;                  // false when the fit was rejected
}
export function estimateNormalization(
  patches: readonly (readonly Rgb[])[],
  swatches: readonly Lab[],
): NormalizationResult;
export function applyTransform(t: ChannelTransform, rgb: Rgb): Rgb;
```

Per-channel **gain + offset in linear-light RGB** — gain models the illuminant (von Kries),
offset models veiling flare/haze, which is what flattens this photo's contrast. Six
parameters total: it cannot rotate hues, so it cannot invent a color that isn't there.

Fit by robust iterative-closest-swatch across **all cells pooled**, so cells share strength:

1. Stride-subsample the pooled patch pixels to a cap (~20k) — keeps it fast on a phone.
2. Seed with per-channel mean matching (gray-world) against the swatch set, offset 0.
3. Repeat ~4×: transform → nearest swatch in Lab → **keep the best 60% by ΔE** (trimmed,
   so outlier cubes/shadows/wood-table bleed don't steer the fit) → least-squares
   gain+offset from raw-linear observed to matched-swatch-linear.
4. Guardrails: clamp gain to `[0.4, 2.5]` and offset to `±0.15` linear; if trimmed mean ΔE
   does not beat identity, return `applied: false` and the identity transform.

`core/vision/propose.ts` gains a normalization pass: collect every cell's patch first,
estimate once per photo, apply to all pixels, then classify exactly as today. `Proposal`
carries the `NormalizationResult`; the debug table (`photo-screen.ts:311`) grows a line
showing the fitted gain/offset and the before/after ΔE, replacing the manual "read Mean RGB
and hand-edit swatches" loop as the calibration readout.

Unit tests in `core/vision/normalize.test.ts`: a synthetic photo tinted by a known gain
recovers ~that gain; a pathological all-one-color input hits the rejection path.

### 4. Sampling and pixel filters

- **`core/vision/sample.ts`** — `collectPatch` gains an optional `innerRadius`, giving an
  annulus that steps over the center-mounted cube. Nearest-neighbor distance in layout
  space is √3 ≈ 1.73 units and the tile disc is ~0.8 units, so the current
  `PATCH_RADIUS_RATIO = 0.3` samples out to ~0.52 units. The ring geometry (outer ratio,
  inner ratio) is a **two-parameter sweep scored against the fixtures**, starting from
  outer 0.30-0.40 × inner 0.0-0.6 — not a guessed constant. M4.5 found larger discs scored
  worse, but that trade-off changes once the center is excluded.
- **Pixel pre-filter**, meaningful now that pixels are normalized: drop blown speculars
  (`L > 92`), deep shadow (`L < 12`), and pixels whose nearest-swatch ΔE exceeds
  `MAX_PIXEL_DELTA_E ≈ 28`. The last group is counted as a new `unmatchedShare` on
  `PatchClassification` rather than silently voting.
- With the specular filter in place, drop the placeholder white-cube tone
  `{240,240,235}` (`games/harmonies/vision.ts:42`) and replace it with the real clear-cube
  tone measured from this photo (row 4 has one on a green tile).

### 5. Re-derive swatches in normalized space

Once normalization is in, replace the hand-picked `TOKEN_TONES_RGB` values with robust
cluster medians computed across all 4 distinct labeled boards in normalized space. Give
`brown` a genuine second tone (it ships one, `tokens.ts:32`) and `red` a light/washed tone.
Add a small dev script (scratchpad, not committed) that prints the per-class clusters from
the fixtures so the numbers are derived, not guessed.

Also retune Side A's `EMPTY_TONES_RGB` (`games/harmonies/vision.ts:19-22`) — those are
pedestal slivers, not real empty hexes, and the file itself flags them as needing retune.

### 6. Uncertainty

Extend `isUncertain` (`core/vision/classify.ts:30`) with an absolute reject: winner
`meanDeltaE > CELL_REJECT_DELTA_E ≈ 20`, or high `unmatchedShare`, flags the cell. Keep it
advisory — it draws the "?" and never blocks "Use this board", matching current behavior.

## Out of scope

- **Stack parallax.** Tall stacks project off the board plane and their tops sit visibly
  off-center (clearly so in this photo's 3-high stacks). Known and documented in
  `planning/harmonies-m4.5-plan.md:31-35`; a separate problem from color.
- Detecting stack height from the photo — still a human tap-cycle.
- Any UI styling. Per `CLAUDE.md`, the export button is a browser-default button.

## Verification

1. `npm test` — new `real-photos.test.ts` passes on all fixtures; existing synthetic vision
   tests still pass unchanged (normalization must be a no-op on already-calibrated input,
   which the synthetic board is — a good regression signal in itself).
2. `npm run build` — `tsc --noEmit` clean, and `jpeg-js` must not leak into the browser
   bundle.
3. Report a **before/after per-cell accuracy table** for all 4 boards, so the effect of the
   change is a number, not a claim. Target: 25/25 on the new photo without regressing
   `test_image1` (23/23) or `test_image_islands2` (25/25); `test_image_islands` was 24/25.
4. `npm run dev`, load the new photo, tap corners, confirm the proposal matches the
   transcription above and that the debug table shows a sane fitted transform.
5. Commit per green gate on `claude/harmonies-tile-color-detection-hw1e1w`; never push to
   `main`.

## Sequencing note

Step 1 ships first and stops for the user's exported JSON. Work continues meanwhile using
the provisional transcription above, so nothing blocks; the exported labels then replace it
and every accuracy number is re-run against the real fixture.
