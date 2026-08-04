import { describe, expect, it } from "vitest";
import { linearize, delinearize, type Rgb } from "./color";
import {
  applyGains,
  CANONICAL_GRAY,
  estimateGains,
  estimateIlluminant,
  IDENTITY_GAINS,
} from "./normalize";

// A spread of tones standing in for a photographed board.
const SCENE: Rgb[] = [
  { r: 12, g: 71, b: 89 },
  { r: 111, g: 96, b: 90 },
  { r: 128, g: 86, b: 77 },
  { r: 110, g: 95, b: 18 },
  { r: 217, g: 141, b: 8 },
  { r: 182, g: 59, b: 58 },
  { r: 182, g: 169, b: 158 },
];

// Re-light a scene by a known per-channel gain in linear light — what a
// different illuminant does to a photograph, to first order.
function relight(scene: Rgb[], gain: [number, number, number]): Rgb[] {
  return scene.map((px) => ({
    r: delinearize(gain[0] * linearize(px.r)),
    g: delinearize(gain[1] * linearize(px.g)),
    b: delinearize(gain[2] * linearize(px.b)),
  }));
}

describe("applyGains", () => {
  it("leaves pixels alone at unit gain", () => {
    for (const px of SCENE) {
      const out = applyGains(IDENTITY_GAINS, px);
      expect(out.r).toBeCloseTo(px.r, 4);
      expect(out.g).toBeCloseTo(px.g, 4);
      expect(out.b).toBeCloseTo(px.b, 4);
    }
  });

  it("scales in linear light, not in sRGB", () => {
    // Doubling linear light is a much smaller step in encoded sRGB than 2x.
    const out = applyGains({ gain: [2, 2, 2] }, { r: 128, g: 128, b: 128 });
    expect(out.r).toBeCloseTo(delinearize(2 * linearize(128)), 6);
    expect(out.r).toBeLessThan(255);
    expect(out.r).toBeGreaterThan(128);
  });

  it("clamps rather than wrapping when a gain overflows the gamut", () => {
    const out = applyGains({ gain: [4, 4, 4] }, { r: 250, g: 250, b: 250 });
    expect(out.r).toBeLessThanOrEqual(255);
    expect(out.g).toBeLessThanOrEqual(255);
    expect(out.b).toBeLessThanOrEqual(255);
  });
});

describe("estimateIlluminant", () => {
  it("reports the canonical gray for an empty sample set", () => {
    expect(estimateIlluminant([])).toEqual([CANONICAL_GRAY, CANONICAL_GRAY, CANONICAL_GRAY]);
  });

  // Gains chosen to keep every channel inside the gamut: a clipped highlight
  // is no longer a scalar multiple of the original, and would test sRGB
  // clamping rather than the estimator.
  it("scales with the light: a re-lit scene reports a proportionally shifted illuminant", () => {
    const base = estimateIlluminant(SCENE);
    const lit = estimateIlluminant(relight(SCENE, [1.3, 1, 0.7]));
    expect(lit[0] / base[0]).toBeCloseTo(1.3, 1);
    expect(lit[1] / base[1]).toBeCloseTo(1.0, 1);
    expect(lit[2] / base[2]).toBeCloseTo(0.7, 1);
  });
});

describe("estimateGains", () => {
  // Approximate rather than exact: correcting the pixels moves some of them
  // across bucket boundaries, so re-estimating the corrected scene is not a
  // perfect fixed point. Landing near the canonical gray is all that is needed
  // — both the photo and the palette get the same treatment.
  it("moves a scene onto the canonical illuminant", () => {
    const corrected = SCENE.map((px) => applyGains(estimateGains(SCENE), px));
    for (const channel of estimateIlluminant(corrected)) {
      expect(channel).toBeCloseTo(CANONICAL_GRAY, 1);
    }
  });

  // The whole point: two photos of the same board under different light have
  // to land in the same place, or the swatches can never be camera-independent.
  it("brings a re-lit scene back onto the original, undoing the cast", () => {
    const warm = relight(SCENE, [1.3, 1.0, 0.7]);
    const a = SCENE.map((px) => applyGains(estimateGains(SCENE), px));
    const b = warm.map((px) => applyGains(estimateGains(warm), px));
    // Within a code value or two: sRGB's linear toe means a re-light and its
    // inverse do not compose exactly at the very bottom of the range.
    for (let i = 0; i < SCENE.length; i++) {
      expect(Math.abs(b[i]!.r - a[i]!.r)).toBeLessThan(2);
      expect(Math.abs(b[i]!.g - a[i]!.g)).toBeLessThan(2);
      expect(Math.abs(b[i]!.b - a[i]!.b)).toBeLessThan(2);
    }
  });

  it("clamps the correction for a pathological scene instead of running away", () => {
    // Near-black input would otherwise demand an enormous gain.
    const { gain } = estimateGains([{ r: 1, g: 1, b: 1 }]);
    for (const g of gain) expect(g).toBeLessThanOrEqual(4);
  });

  it("survives an empty sample set", () => {
    expect(estimateGains([]).gain).toEqual([1, 1, 1]);
  });
});
