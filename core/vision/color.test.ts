import { describe, expect, it } from "vitest";
import { deltaE, delinearize, labToRgb, linearize, rgbToLab } from "./color";

describe("rgbToLab", () => {
  // Anchor values from the standard sRGB (D65) → Lab conversion.
  it("maps white to L=100 with no chroma", () => {
    const lab = rgbToLab({ r: 255, g: 255, b: 255 });
    expect(lab.L).toBeCloseTo(100, 1);
    expect(lab.a).toBeCloseTo(0, 1);
    expect(lab.b).toBeCloseTo(0, 1);
  });

  it("maps black to the origin", () => {
    const lab = rgbToLab({ r: 0, g: 0, b: 0 });
    expect(lab.L).toBeCloseTo(0, 1);
    expect(lab.a).toBeCloseTo(0, 1);
    expect(lab.b).toBeCloseTo(0, 1);
  });

  it("matches published values for the sRGB primaries", () => {
    const red = rgbToLab({ r: 255, g: 0, b: 0 });
    expect(red.L).toBeCloseTo(53.24, 1);
    expect(red.a).toBeCloseTo(80.09, 1);
    expect(red.b).toBeCloseTo(67.2, 1);

    const green = rgbToLab({ r: 0, g: 255, b: 0 });
    expect(green.L).toBeCloseTo(87.74, 1);
    expect(green.a).toBeCloseTo(-86.18, 1);
    expect(green.b).toBeCloseTo(83.18, 1);

    const blue = rgbToLab({ r: 0, g: 0, b: 255 });
    expect(blue.L).toBeCloseTo(32.3, 1);
    expect(blue.a).toBeCloseTo(79.2, 1);
    expect(blue.b).toBeCloseTo(-107.86, 1);
  });
});

describe("labToRgb", () => {
  // The normalization fits its gains in linear light, so it needs to get from
  // an authored Lab swatch back to RGB. A swatch that does not survive the
  // round trip would be silently corrected to the wrong color.
  it("round-trips every reference-swatch-like color through Lab", () => {
    const colors = [
      { r: 12, g: 71, b: 89 },
      { r: 111, g: 96, b: 90 },
      { r: 128, g: 86, b: 77 },
      { r: 110, g: 95, b: 18 },
      { r: 217, g: 141, b: 8 },
      { r: 182, g: 59, b: 58 },
      { r: 182, g: 169, b: 158 },
      { r: 240, g: 240, b: 235 },
      { r: 0, g: 0, b: 0 },
      { r: 255, g: 255, b: 255 },
    ];
    for (const rgb of colors) {
      const back = labToRgb(rgbToLab(rgb));
      expect(back.r).toBeCloseTo(rgb.r, 3);
      expect(back.g).toBeCloseTo(rgb.g, 3);
      expect(back.b).toBeCloseTo(rgb.b, 3);
    }
  });

  it("clamps colors that fall outside the sRGB gamut", () => {
    // A wildly saturated Lab point has no sRGB equivalent; channels must stay
    // in range rather than going negative and poisoning later math.
    const out = labToRgb({ L: 60, a: 120, b: -120 });
    for (const channel of [out.r, out.g, out.b]) {
      expect(channel).toBeGreaterThanOrEqual(0);
      expect(channel).toBeLessThanOrEqual(255);
    }
  });
});

describe("linearize / delinearize", () => {
  it("are inverses across the range, including across the piecewise knee", () => {
    for (const v of [0, 1, 5, 10, 11, 12, 50, 128, 200, 255]) {
      expect(delinearize(linearize(v))).toBeCloseTo(v, 6);
    }
  });
});

describe("deltaE", () => {
  it("is zero for identical colors and symmetric", () => {
    const p = rgbToLab({ r: 120, g: 80, b: 40 });
    const q = rgbToLab({ r: 20, g: 180, b: 240 });
    expect(deltaE(p, p)).toBe(0);
    expect(deltaE(p, q)).toBeCloseTo(deltaE(q, p), 10);
    expect(deltaE(p, q)).toBeGreaterThan(0);
  });
});
