# M4.6 — Camera-independent tile color detection

Status: implemented. This document was written as the plan, then updated with what
measurement actually showed — several of its original assumptions were wrong, and those
are called out below rather than quietly edited away.

## Context

The vision classifier was calibrated against one camera under one lighting condition and
misread a photo taken with a different phone in warm indoor light. This work makes the
classifier normalize each photo before classifying, adds a real-photo regression test
(there was none), and gives the user an in-app way to hand back ground truth.

### Why it failed

`games/harmonies/tokens.ts` stores **absolute** sRGB swatches measured from
`resources/test_image1.jpg`. `classifyPatch` assigns every pixel to the nearest of those
swatches in Lab and takes a plurality. There was **no white-balance, exposure, or
per-photo normalization anywhere in `core/vision/`**, and **no absolute ΔE reject** — so a
new sensor plus warm tungsten shifted the whole measured cloud off the swatch set, and
every pixel still voted for something. Failures were silent and confident.

This is structural, not a matter of imperfect swatch values. Leave-one-photo-out over the
four labelled boards: swatches derived from three photos score **12–18/25** on the fourth.
Absolute swatches do not transfer across cameras, however carefully they are measured.

## What shipped

### 1. Ground-truth export (`core/vision/labels.ts`, `core/ui/photo-screen.ts`)

An "Export labels" button in the correction screen's debug section. The correction
workflow *is* the labelling workflow: fix what's wrong, then export taps (normalized to
the canvas), rotation, board side, and the top token of every cell. That JSON is the
fixture format.

`createImageBitmap` now passes `imageOrientation: "from-image"` so the raster does not
depend on the browser, which a committed fixture cannot tolerate.

### 2. Real-photo regression harness (`games/harmonies/tests/`)

`jpeg-js` (devDependency, never bundled) plus a hand-rolled EXIF orientation read
reproduce the app's raster exactly: decode with orientation applied → downscale to
`MAX_CANVAS_SIDE` → rotate. The recorded canvas size is checked against the decode so
drift fails loudly instead of silently sampling the wrong places.

Four fixtures, one per distinct board — note `test_image2.jpg` is a byte-identical copy of
`test_image1.jpg`, so the "four sample photos" were really three.

### 3. Per-photo illuminant normalization (`core/vision/normalize.ts`)

Photo and palette are both moved onto a common illuminant before they are compared,
estimated with **Shades-of-Gray**: the Minkowski p-norm of each channel in linear light.
p = 1 is gray-world, p → ∞ is white-patch; p = 6 measured best by leave-one-out
(p=1 87/98, p=2 90/98, p=4 91/98, **p=6 92/98**, p=10 84/98).

The correction is **gain only**. That is load-bearing: a gain cannot compress contrast, so
it cannot collapse the palette toward its own center.

The estimate weights colors by area but **caps any single color at 5% of the total**.
Uncapped, a mid-game board of mostly bare cream hexes reports its own printed cream as a
color cast and drags every token with it. Counted once each, antialiased edges weigh as
much as whole tokens and two brown cells are lost.

### 4. Swatch corrections (`games/harmonies/vision.ts`)

Removed on measurement: side B's second empty tone (a desaturated mid-neutral that sat in
the middle of every token color and voted occupied cells empty), and the amber-over-blue
cube tone (within a few ΔE of blue's own base tone, so it discarded whole blue tokens as
"cube"). Side A's empty tones are untouched — no side-A photo with genuinely empty cells
exists to validate against.

### 5. Uncertainty (`core/vision/classify.ts`)

`UNCERTAIN_IGNORED_SHARE` 0.6 → 0.45. The real-photo test now also asserts that **every**
cell the classifier gets wrong is flagged for review.

### 6. Colour management in the harness (`games/harmonies/tests/photo-fixture.ts`)

The new photo carries a **Display P3** ICC profile; the three older ones are plain sRGB.
A canvas is sRGB and the browser converts on draw, so a harness that ignores the profile
measures different colours than the app sees — reading P3 code values as sRGB desaturates
every token. Matrix/TRC profiles are now applied (validated: the P3 photo produces exactly
the published P3→sRGB matrix, and the three sRGB photos come out identity to within
0.0004).

This is also a second, independent cause of the original misreads: the new phone shoots
wide-gamut. The app was always fine — Chromium colour-manages — but the numbers measured
before this went in were measured on the wrong pixels.

## Results

Measured with colour management on both sides, so before and after are comparable:

| Photo | Before | After |
|---|---|---|
| riverA (side A, daylight) | 23/23 | 23/23 |
| islands1 | 25/25 | 25/25 |
| islands2 | 25/25 | 25/25 |
| **islands3 (new phone, warm light)** | **18/25** | **24/25** |
| **total** | **91/98** | **97/98** |
| **silent (unflagged) errors** | **5** | **0** |

Confirmed by driving the real app in a browser with the same photo and taps: **17/25 →
24/25**, harness and app agreeing cell for cell afterwards.

The one remaining miss is a lone brown token under warm tungsten that normalizes to within
~15 ΔE of an empty cream hex, with an animal cube over half of it. A swatch close enough
to catch it would start reading genuinely empty hexes as brown. It is flagged for review
instead.

## Things the plan assumed that measurement disproved

- **A gain+offset fit by iterative-closest-swatch.** Did exactly what an unconstrained fit
  does: compressed contrast to shrink every distance while destroying the separation the
  vote depends on. Scored *worse than no correction*. Replaced with gain-only.
- **Annulus sampling to dodge center-mounted cubes.** Consistently worse — 95 → 93 → 91 →
  88 as the inner radius grows, and a larger outer radius is worse too. The full disc at
  `PATCH_RADIUS_RATIO = 0.3` stays. The per-pixel vote with ignore-swatches already handles
  cubes better than geometry does.
- **An absolute ΔE reject to flag bad reads.** At ΔE > 14 it flags 20 correct cells and
  still misses the one wrong one — which wins 89% of its vote at ΔE 6.2, *better matched
  than the median correct cell*. Not shipped.
- **The near-white cube tone is a placeholder to remove.** It is real (the clear cube in
  the new photo) and it also mops up blown highlights. Removing it costs nine cells.
- **Re-deriving all swatches by clustering.** Leave-one-out showed derived codebooks
  (83–92/98) score below the hand-authored set. Only the two harmful swatches were removed.
- **The new photo's "red" building tile.** It is a *brown* trunk tile — same mottled matte
  surface as the known brown in islands2, and nothing like the vivid pink building tiles.
- **That the problem was purely illumination.** Half of it was the colour space: the new
  phone saves Display P3. The app handled that already; the first version of the test
  harness did not, which made the baseline look better than it was (22/25 rather than
  18/25) and would have quietly mismeasured every future wide-gamut photo.

## Caveats

- Four boards is a thin evidence base. Every threshold here is measured, but measured
  against a small set; the leave-one-out numbers are the honest generalization estimate,
  and they are lower than the in-sample ones.
- The four fixtures' labels were transcribed from the photos and their taps estimated by
  eye (then verified against rendered sample-point overlays). `islands3`'s colours have
  since been **confirmed** against the board owner's own export — 25/25, including the
  lone brown trunk. The other three remain unconfirmed, and all four still carry
  eye-estimated taps.
- Stack parallax is still unsolved and out of scope: tall stacks project off the board
  plane and their tops sit off-center.
- Vision still never determines stack height; that remains a tap-cycle in the correction UI.

## Re-running the measurements

The scripts used to sweep p, ring geometry, swatch ablations and leave-one-out validation
were scratch tooling and are not committed. What *is* committed is the fixture set and
`games/harmonies/tests/real-photos.test.ts`, which is enough to re-measure any change:
per-photo accuracy, per-cell misses, and the flagging guarantee.
