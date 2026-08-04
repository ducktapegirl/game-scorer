// The fixture harness has to reproduce the raster the browser hands the
// pipeline. Where it doesn't, the real-photo tests measure something the app
// never sees — which is exactly what happened before colour management was
// added here: the Display P3 photo was read as sRGB, and the recorded baseline
// was four cells better than the app's actual behaviour.

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { iccToSrgbMatrix, readExifOrientation, remap, rotate } from "./photo-fixture";
import type { PixelSource } from "../../../core/vision/sample";

const read = (name: string): Uint8Array => new Uint8Array(readFileSync(`resources/${name}`));

describe("readExifOrientation", () => {
  it("reads the tag from a real photo", () => {
    expect(readExifOrientation(read("test_image_islands3.jpg"))).toBe(1);
  });

  it("falls back to 1 on data that is not a JPEG", () => {
    expect(readExifOrientation(new Uint8Array([1, 2, 3, 4]))).toBe(1);
  });
});

describe("iccToSrgbMatrix", () => {
  // Anchors the conversion against the published Display P3 → sRGB matrix.
  it("recovers the Display P3 matrix from the wide-gamut photo", () => {
    const m = iccToSrgbMatrix(read("test_image_islands3.jpg"));
    const expected = [
      [1.2249, -0.2249, 0],
      [-0.0421, 1.0421, 0],
      [-0.0196, -0.0786, 1.0983],
    ];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        expect(m[i]![j]!).toBeCloseTo(expected[i]![j]!, 2);
      }
    }
  });

  it("is the identity for photos already tagged sRGB", () => {
    for (const name of ["test_image1.jpg", "test_image_islands.jpg", "test_image_islands2.jpg"]) {
      const m = iccToSrgbMatrix(read(name));
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          expect(m[i]![j]!).toBeCloseTo(i === j ? 1 : 0, 2);
        }
      }
    }
  });

  it("falls back to the identity when there is no profile", () => {
    const m = iccToSrgbMatrix(new Uint8Array([0xff, 0xd8, 0xff, 0xd9]));
    expect(m).toEqual([
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ]);
  });
});

// A 2x1 image: left pixel red, right pixel green.
function pair(): PixelSource {
  const data = new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255]);
  return { width: 2, height: 1, data };
}

const at = (img: PixelSource, x: number, y: number): number[] => {
  const i = (y * img.width + x) * 4;
  return [img.data[i]!, img.data[i + 1]!, img.data[i + 2]!];
};

describe("remap", () => {
  it("returns the image untouched for orientation 1", () => {
    const img = pair();
    expect(remap(img, 1)).toBe(img);
  });

  it("transposes the dimensions for the rotating orientations", () => {
    for (const orientation of [5, 6, 7, 8]) {
      const out = remap(pair(), orientation);
      expect([out.width, out.height]).toEqual([1, 2]);
    }
  });

  it("rotates orientation 6 a quarter turn clockwise", () => {
    // Left-to-right red|green becomes top-to-bottom red over green.
    const out = remap(pair(), 6);
    expect(at(out, 0, 0)).toEqual([255, 0, 0]);
    expect(at(out, 0, 1)).toEqual([0, 255, 0]);
  });

  it("mirrors horizontally for orientation 2", () => {
    const out = remap(pair(), 2);
    expect(at(out, 0, 0)).toEqual([0, 255, 0]);
    expect(at(out, 1, 0)).toEqual([255, 0, 0]);
  });
});

describe("rotate", () => {
  it("is a no-op at zero degrees", () => {
    const img = pair();
    expect(rotate(img, 0)).toBe(img);
  });

  it("returns to the original after four quarter turns", () => {
    let img: PixelSource = pair();
    for (let i = 0; i < 4; i++) img = rotate(img, 90);
    expect([img.width, img.height]).toEqual([2, 1]);
    expect(at(img, 0, 0)).toEqual([255, 0, 0]);
    expect(at(img, 1, 0)).toEqual([0, 255, 0]);
  });

  it("treats 360 and negative turns the same as their equivalents", () => {
    expect(at(rotate(pair(), -90), 0, 0)).toEqual(at(rotate(pair(), 270), 0, 0));
    expect(rotate(pair(), 360).width).toBe(2);
  });
});
