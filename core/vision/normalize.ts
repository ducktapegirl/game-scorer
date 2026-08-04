// Per-photo illuminant normalization.
//
// The classifier matches pixels against swatches measured from particular
// photographs. A different camera under a different light moves the whole
// measured cloud away from those swatches, and since every pixel votes for its
// nearest swatch no matter how far away it lands, the result is confidently
// wrong. Enumerating more tones per token does not fix this — it only papers
// over the cameras you happen to own. The swatches have to stop being
// camera-specific instead.
//
// So both sides are moved to a common illuminant before they are compared:
// the photo's pixels and the swatch palette are each scaled so their estimated
// illuminant is CANONICAL_GRAY. The estimate is Shades-of-Gray (Finlayson &
// Trezzi): the Minkowski p-norm of each channel. p = 1 is gray-world, which
// assumes the average of the scene is neutral and so gets dragged around by a
// board that happens to be mostly one color; p → ∞ is white-patch, which bets
// everything on the brightest pixels. Intermediate p is the standard
// compromise, and p = 6 measured best here (see the note on MINKOWSKI_P).
//
// The correction is a per-channel gain and nothing else. That matters: a gain
// cannot compress contrast, so unlike a fitted gain+offset it cannot quietly
// collapse the palette toward its own center and "improve" every distance
// while destroying the separation the vote depends on.

import { delinearize, linearize, type Rgb } from "./color";

export interface ChannelGains {
  gain: [number, number, number];
}

export const IDENTITY_GAINS: ChannelGains = { gain: [1, 1, 1] };

// The illuminant every photo and the palette are moved to. Arbitrary — only
// the fact that both sides use the same one matters — but a mid gray keeps
// corrected pixels inside the representable range.
export const CANONICAL_GRAY = 0.18;

// Minkowski exponent for the illuminant estimate. Chosen by leave-one-photo-out
// over the fixtures in resources/fixtures: p = 1 scored 87/98, p = 2 90/98,
// p = 4 91/98, p = 6 92/98, p = 10 84/98. Re-measure if the fixture set grows.
export const MINKOWSKI_P = 6;

// A photo needing more correction than this is not a white balance problem;
// clamping keeps a pathological input from turning every token the same color.
const MIN_GAIN = 0.25;
const MAX_GAIN = 4;

// Estimating six numbers does not need every pixel of every cell, and this
// runs on a phone.
const MAX_SAMPLES = 20000;

// Levels per channel used to reduce a photo to the distinct colors it
// contains. Fine enough to keep the token colors apart, coarse enough that
// noise and shading across one token collapse into a handful of entries.
const QUANTIZE_LEVELS = 12;

// No single color may contribute more than this share of the illuminant
// estimate, however much of the board it covers.
const MAX_COLOR_SHARE = 0.05;

export function applyGains({ gain }: ChannelGains, rgb: Rgb): Rgb {
  return {
    r: delinearize(gain[0] * linearize(rgb.r)),
    g: delinearize(gain[1] * linearize(rgb.g)),
    b: delinearize(gain[2] * linearize(rgb.b)),
  };
}

// The distinct colors a sample set contains: bucket into a coarse RGB grid and
// return each occupied bucket's mean, each counted once.
//
// This is what keeps the estimate independent of what happens to be ON the
// board. Counting pixels would let composition masquerade as illumination — a
// mid-game board is mostly bare cream hexes, and fourteen identical empty
// cells would outvote the entire token palette, so the correction would
// "neutralize" the board's own printed cream and drag every token with it.
// One vote per distinct color, and a board with one token of each color and a
// board with fourteen of one color estimate the same light.
export interface ColorBucket {
  color: Rgb;
  weight: number;
}

// The colors a sample set contains: bucket into a coarse RGB grid, weight each
// bucket by how many pixels landed in it, but let no single color count for
// more than MAX_COLOR_SHARE of the whole.
//
// The cap is the point. Weighting purely by area lets composition masquerade
// as illumination — a mid-game board is mostly bare cream hexes, and a dozen
// identical empty cells outvote the entire token palette, so the correction
// "neutralizes" the board's own printed cream and drags every token with it.
// Counting each distinct color once instead overcorrects the other way:
// antialiased edges and shadow slivers, which cover almost no area, would then
// weigh as much as a whole token, and that measurably costs two brown cells
// across the fixtures. Capping keeps area meaningful for everything that isn't
// dominant, and stops the dominant surface from deciding on its own.
export function colorBuckets(samples: readonly Rgb[]): ColorBucket[] {
  const buckets = new Map<number, { r: number; g: number; b: number; n: number }>();
  const stride = Math.max(1, Math.ceil(samples.length / MAX_SAMPLES));
  const level = (v: number): number =>
    Math.min(QUANTIZE_LEVELS - 1, Math.max(0, Math.floor((v / 256) * QUANTIZE_LEVELS)));
  let counted = 0;
  for (let i = 0; i < samples.length; i += stride) {
    const px = samples[i]!;
    const key = (level(px.r) * QUANTIZE_LEVELS + level(px.g)) * QUANTIZE_LEVELS + level(px.b);
    const bucket = buckets.get(key) ?? { r: 0, g: 0, b: 0, n: 0 };
    bucket.r += px.r;
    bucket.g += px.g;
    bucket.b += px.b;
    bucket.n += 1;
    buckets.set(key, bucket);
    counted++;
  }
  const cap = counted * MAX_COLOR_SHARE;
  return [...buckets.values()].map((b) => ({
    color: { r: b.r / b.n, g: b.g / b.n, b: b.b / b.n },
    weight: Math.min(cap, b.n),
  }));
}

// The Shades-of-Gray illuminant estimate, per channel, in linear light, over
// the capped color buckets.
export function estimateIlluminant(samples: readonly Rgb[], p = MINKOWSKI_P): [number, number, number] {
  if (samples.length === 0) return [CANONICAL_GRAY, CANONICAL_GRAY, CANONICAL_GRAY];
  const buckets = colorBuckets(samples);
  const sums = [0, 0, 0];
  let total = 0;
  for (const { color, weight } of buckets) {
    sums[0]! += weight * linearize(color.r) ** p;
    sums[1]! += weight * linearize(color.g) ** p;
    sums[2]! += weight * linearize(color.b) ** p;
    total += weight;
  }
  return sums.map((s) => (s / total) ** (1 / p)) as [number, number, number];
}

// Gains that move `samples` onto the canonical illuminant.
export function estimateGains(samples: readonly Rgb[], p = MINKOWSKI_P): ChannelGains {
  const illuminant = estimateIlluminant(samples, p);
  return {
    gain: illuminant.map((e) =>
      Math.min(MAX_GAIN, Math.max(MIN_GAIN, CANONICAL_GRAY / Math.max(1e-6, e))),
    ) as [number, number, number],
  };
}

export interface NormalizationResult {
  // What the photo's pixels were scaled by.
  photo: ChannelGains;
  // What the swatch palette was scaled by. Both land on CANONICAL_GRAY, which
  // is what makes them comparable.
  palette: ChannelGains;
}
