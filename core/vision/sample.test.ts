import { describe, expect, it } from "vitest";
import { collectPatch } from "./sample";
import { makeImage, setPixel } from "./test-helpers";

describe("collectPatch", () => {
  it("collects only pixels inside the circular radius", () => {
    const image = makeImage(21, 21, { r: 40, g: 90, b: 160 });
    // A corner of the bounding square, outside the circle (distance ≈ 7 > 5)
    setPixel(image, 15, 15, { r: 255, g: 0, b: 0 });
    const pixels = collectPatch(image, { x: 10, y: 10 }, 5);
    expect(pixels.length).toBeGreaterThan(0);
    expect(pixels.length).toBeLessThan(11 * 11); // circle, not the square
    for (const p of pixels) expect(p).toEqual({ r: 40, g: 90, b: 160 });
  });

  it("clamps the window at image edges", () => {
    const image = makeImage(8, 8, { r: 10, g: 20, b: 30 });
    const corner = collectPatch(image, { x: 0, y: 0 }, 5);
    const center = collectPatch(image, { x: 4, y: 4 }, 3);
    expect(corner.length).toBeGreaterThan(0);
    expect(corner.length).toBeLessThan(center.length * 4); // quarter disc
    for (const p of corner) expect(p).toEqual({ r: 10, g: 20, b: 30 });
  });

  it("throws when the sample point is outside the image", () => {
    const image = makeImage(8, 8, { r: 0, g: 0, b: 0 });
    expect(() => collectPatch(image, { x: 40, y: 4 }, 2)).toThrow(/outside/);
  });
});
