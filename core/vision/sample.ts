// Patch collection over raw pixels. PixelSource is structurally compatible
// with DOM ImageData (width, height, RGBA bytes) but constructible in plain
// Node, keeping the whole pipeline unit-testable without a DOM.

import type { Rgb } from "./color";
import type { Point } from "./homography";

export interface PixelSource {
  width: number;
  height: number;
  data: Uint8ClampedArray; // RGBA, row-major, 4 bytes per pixel
}

// Every pixel within the circular patch of the given radius around `center`
// (clamped at image edges). The classifier votes over all of them — a patch
// on a real token is multi-modal (base color, printed pattern, maybe an
// animal cube), so no single summary color is taken here.
export function collectPatch(image: PixelSource, center: Point, radius: number): Rgb[] {
  const cx = center.x;
  const cy = center.y;
  const r = Math.max(1, radius);

  const x0 = Math.max(0, Math.floor(cx - r));
  const x1 = Math.min(image.width - 1, Math.ceil(cx + r));
  const y0 = Math.max(0, Math.floor(cy - r));
  const y1 = Math.min(image.height - 1, Math.ceil(cy + r));
  if (x0 > x1 || y0 > y1) {
    throw new Error(`Sample point (${Math.round(cx)}, ${Math.round(cy)}) is outside the image`);
  }

  const pixels: Rgb[] = [];
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (Math.hypot(x - cx, y - cy) > r) continue;
      const i = (y * image.width + x) * 4;
      pixels.push({ r: image.data[i]!, g: image.data[i + 1]!, b: image.data[i + 2]! });
    }
  }
  if (pixels.length === 0) {
    throw new Error(`Sample patch at (${Math.round(cx)}, ${Math.round(cy)}) contains no pixels`);
  }
  return pixels;
}
