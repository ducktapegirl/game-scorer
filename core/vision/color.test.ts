import { describe, expect, it } from "vitest";
import { deltaE, rgbToLab } from "./color";

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

describe("deltaE", () => {
  it("is zero for identical colors and symmetric", () => {
    const p = rgbToLab({ r: 120, g: 80, b: 40 });
    const q = rgbToLab({ r: 20, g: 180, b: 240 });
    expect(deltaE(p, p)).toBe(0);
    expect(deltaE(p, q)).toBeCloseTo(deltaE(q, p), 10);
    expect(deltaE(p, q)).toBeGreaterThan(0);
  });
});
