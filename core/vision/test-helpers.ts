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

// A two-tone token disc like the real ones: base color with a printed
// pattern (every third pixel) in a second tone. Pass pattern = base for a
// flat disc.
export function paintPatternedDisk(
  image: PixelSource,
  center: { x: number; y: number },
  radius: number,
  base: Rgb,
  pattern: Rgb,
): void {
  for (let y = Math.ceil(center.y - radius); y <= center.y + radius; y++) {
    for (let x = Math.ceil(center.x - radius); x <= center.x + radius; x++) {
      if (Math.hypot(x - center.x, y - center.y) > radius) continue;
      setPixel(image, x, y, (x + y) % 3 === 0 ? pattern : base);
    }
  }
}

// A translucent animal cube sitting on a token: a filled square at the
// disc's center.
export function paintCube(
  image: PixelSource,
  center: { x: number; y: number },
  halfSide: number,
  rgb: Rgb,
): void {
  for (let y = Math.ceil(center.y - halfSide); y <= center.y + halfSide; y++) {
    for (let x = Math.ceil(center.x - halfSide); x <= center.x + halfSide; x++) {
      setPixel(image, x, y, rgb);
    }
  }
}
