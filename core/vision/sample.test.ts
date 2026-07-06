import { describe, expect, it } from "vitest";
import { samplePatch } from "./sample";
import { makeImage, setPixel } from "./test-helpers";

describe("samplePatch", () => {
  it("returns the flat color of a uniform patch", () => {
    const image = makeImage(20, 20, { r: 40, g: 90, b: 160 });
    expect(samplePatch(image, { x: 10, y: 10 }, 3)).toEqual({ r: 40, g: 90, b: 160 });
  });

  it("median-rejects an outlier glare pixel", () => {
    const image = makeImage(20, 20, { r: 40, g: 90, b: 160 });
    setPixel(image, 10, 10, { r: 255, g: 255, b: 255 }); // glare at dead center
    expect(samplePatch(image, { x: 10, y: 10 }, 2)).toEqual({ r: 40, g: 90, b: 160 });
  });

  it("clamps the window at image edges", () => {
    const image = makeImage(8, 8, { r: 10, g: 20, b: 30 });
    expect(samplePatch(image, { x: 0, y: 0 }, 5)).toEqual({ r: 10, g: 20, b: 30 });
    expect(samplePatch(image, { x: 7.4, y: 7.4 }, 5)).toEqual({ r: 10, g: 20, b: 30 });
  });

  it("throws when the sample point is outside the image", () => {
    const image = makeImage(8, 8, { r: 0, g: 0, b: 0 });
    expect(() => samplePatch(image, { x: 40, y: 4 }, 2)).toThrow(/outside/);
  });
});
