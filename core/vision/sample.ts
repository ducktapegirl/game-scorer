// Patch sampling over raw pixels. PixelSource is structurally compatible
// with DOM ImageData (width, height, RGBA bytes) but constructible in plain
// Node, keeping the whole pipeline unit-testable without a DOM.

import type { Rgb } from "./color";
import type { Point } from "./homography";

export interface PixelSource {
  width: number;
  height: number;
  data: Uint8ClampedArray; // RGBA, row-major, 4 bytes per pixel
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

// Median color of the square window of the given radius around `center`
// (clamped at image edges). Median per channel is robust to specks of glare
// or shadow that would skew a mean (spec §8).
export function samplePatch(image: PixelSource, center: Point, radius: number): Rgb {
  const cx = Math.round(center.x);
  const cy = Math.round(center.y);
  const r = Math.max(0, Math.round(radius));

  const x0 = Math.max(0, cx - r);
  const x1 = Math.min(image.width - 1, cx + r);
  const y0 = Math.max(0, cy - r);
  const y1 = Math.min(image.height - 1, cy + r);
  if (x0 > x1 || y0 > y1) {
    throw new Error(`Sample point (${cx}, ${cy}) is outside the image`);
  }

  const reds: number[] = [];
  const greens: number[] = [];
  const blues: number[] = [];
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const i = (y * image.width + x) * 4;
      reds.push(image.data[i]!);
      greens.push(image.data[i + 1]!);
      blues.push(image.data[i + 2]!);
    }
  }
  return { r: median(reds), g: median(greens), b: median(blues) };
}
