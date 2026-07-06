// Node-side pixel construction shared by the vision test suites — builds
// PixelSource images without any DOM/canvas dependency.

import type { Rgb } from "./color";
import type { PixelSource } from "./sample";

export function makeImage(width: number, height: number, fill: Rgb): PixelSource {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    data[i * 4] = fill.r;
    data[i * 4 + 1] = fill.g;
    data[i * 4 + 2] = fill.b;
    data[i * 4 + 3] = 255;
  }
  return { width, height, data };
}

export function setPixel(image: PixelSource, x: number, y: number, rgb: Rgb): void {
  const i = (y * image.width + x) * 4;
  image.data[i] = rgb.r;
  image.data[i + 1] = rgb.g;
  image.data[i + 2] = rgb.b;
  image.data[i + 3] = 255;
}
