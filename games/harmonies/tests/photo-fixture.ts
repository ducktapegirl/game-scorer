// Loads a real photo + its exported ground-truth labels into the exact raster
// the app's vision pipeline would see, so tests can run the real classifier
// against real boards.
//
// Node-only (fs + a JPEG decoder), which is why it lives under tests/ rather
// than in core/vision: the browser gets its pixels from createImageBitmap and
// must never pull a decoder into the bundle.
//
// The app's path is: decode with EXIF orientation applied → downscale to
// MAX_CANVAS_SIDE → rotate by the user's quarter-turns. This mirrors that
// order exactly, and cross-checks the result against the canvas dimensions
// recorded in the labels, so a mismatch fails loudly instead of silently
// sampling the wrong places.

import { readFileSync } from "node:fs";
import { decode } from "jpeg-js";
import { denormalizeTaps, type PhotoLabels } from "../../../core/vision/labels";
import type { CornerTaps } from "../../../core/vision/propose";
import type { PixelSource } from "../../../core/vision/sample";
import { MAX_CANVAS_SIDE } from "../../../core/ui/photo-screen";

// --- EXIF ------------------------------------------------------------------

// The Orientation tag (0x0112) from IFD0, or 1 when the file carries no EXIF.
// Hand-rolled rather than pulling a dependency: this is one tag in one IFD.
export function readExifOrientation(jpeg: Uint8Array): number {
  const view = new DataView(jpeg.buffer, jpeg.byteOffset, jpeg.byteLength);
  if (jpeg.length < 4 || jpeg[0] !== 0xff || jpeg[1] !== 0xd8) return 1;

  let offset = 2;
  while (offset + 4 <= jpeg.length) {
    if (jpeg[offset] !== 0xff) return 1; // lost segment alignment
    const marker = jpeg[offset + 1]!;
    // Standalone markers carry no payload.
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) {
      offset += 2;
      continue;
    }
    if (marker === 0xda) return 1; // start of scan — no EXIF before the image
    const length = view.getUint16(offset + 2);
    const isExif =
      marker === 0xe1 &&
      offset + 10 <= jpeg.length &&
      String.fromCharCode(...jpeg.slice(offset + 4, offset + 9)) === "Exif";
    if (isExif) return readTiffOrientation(view, offset + 10);
    if (length < 2) return 1;
    offset += 2 + length;
  }
  return 1;
}

function readTiffOrientation(view: DataView, base: number): number {
  if (base + 8 > view.byteLength) return 1;
  const byteOrder = view.getUint16(base);
  if (byteOrder !== 0x4949 && byteOrder !== 0x4d4d) return 1;
  const little = byteOrder === 0x4949;
  if (view.getUint16(base + 2, little) !== 42) return 1;

  const ifd = base + view.getUint32(base + 4, little);
  if (ifd + 2 > view.byteLength) return 1;
  const count = view.getUint16(ifd, little);
  for (let i = 0; i < count; i++) {
    const entry = ifd + 2 + i * 12;
    if (entry + 12 > view.byteLength) break;
    if (view.getUint16(entry, little) !== 0x0112) continue;
    const value = view.getUint16(entry + 8, little);
    return value >= 1 && value <= 8 ? value : 1;
  }
  return 1;
}

// --- raster operations -----------------------------------------------------

// Where output pixel (x, y) reads from, per EXIF orientation. `w`/`h` are the
// SOURCE dimensions; orientations 5-8 transpose, so the output is h × w.
const ORIENTATIONS: Record<
  number,
  { transposes: boolean; source: (x: number, y: number, w: number, h: number) => [number, number] }
> = {
  1: { transposes: false, source: (x, y) => [x, y] },
  2: { transposes: false, source: (x, y, w) => [w - 1 - x, y] },
  3: { transposes: false, source: (x, y, w, h) => [w - 1 - x, h - 1 - y] },
  4: { transposes: false, source: (x, y, _w, h) => [x, h - 1 - y] },
  5: { transposes: true, source: (x, y) => [y, x] },
  6: { transposes: true, source: (x, y, _w, h) => [y, h - 1 - x] },
  7: { transposes: true, source: (x, y, w, h) => [w - 1 - y, h - 1 - x] },
  8: { transposes: true, source: (x, y, w) => [w - 1 - y, x] },
};

export function remap(image: PixelSource, orientation: number): PixelSource {
  const spec = ORIENTATIONS[orientation] ?? ORIENTATIONS[1]!;
  if (orientation === 1) return image;
  const { width: w, height: h } = image;
  const outW = spec.transposes ? h : w;
  const outH = spec.transposes ? w : h;
  const data = new Uint8ClampedArray(outW * outH * 4);
  for (let y = 0; y < outH; y++) {
    for (let x = 0; x < outW; x++) {
      const [sx, sy] = spec.source(x, y, w, h);
      const from = (sy * w + sx) * 4;
      const to = (y * outW + x) * 4;
      data[to] = image.data[from]!;
      data[to + 1] = image.data[from + 1]!;
      data[to + 2] = image.data[from + 2]!;
      data[to + 3] = image.data[from + 3]!;
    }
  }
  return { width: outW, height: outH, data };
}

// Clockwise quarter-turns, expressed as the equivalent EXIF orientation so
// there is only one remapping implementation.
export function rotate(image: PixelSource, degrees: number): PixelSource {
  const turns = ((Math.round(degrees / 90) % 4) + 4) % 4;
  return remap(image, [1, 6, 3, 8][turns]!);
}

// Box-filter downscale to the app's cap. Canvas drawImage uses its own
// resampling, so this is close rather than identical — good enough, because
// the classifier votes over hundreds of pixels and never depends on one.
export function downscale(image: PixelSource, maxSide: number): PixelSource {
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  if (scale === 1) return image;
  const outW = Math.round(image.width * scale);
  const outH = Math.round(image.height * scale);
  const data = new Uint8ClampedArray(outW * outH * 4);

  for (let y = 0; y < outH; y++) {
    const y0 = Math.floor((y * image.height) / outH);
    const y1 = Math.max(y0 + 1, Math.floor(((y + 1) * image.height) / outH));
    for (let x = 0; x < outW; x++) {
      const x0 = Math.floor((x * image.width) / outW);
      const x1 = Math.max(x0 + 1, Math.floor(((x + 1) * image.width) / outW));
      let r = 0;
      let g = 0;
      let b = 0;
      let n = 0;
      for (let sy = y0; sy < y1; sy++) {
        for (let sx = x0; sx < x1; sx++) {
          const i = (sy * image.width + sx) * 4;
          r += image.data[i]!;
          g += image.data[i + 1]!;
          b += image.data[i + 2]!;
          n++;
        }
      }
      const to = (y * outW + x) * 4;
      data[to] = r / n;
      data[to + 1] = g / n;
      data[to + 2] = b / n;
      data[to + 3] = 255;
    }
  }
  return { width: outW, height: outH, data };
}

// --- fixture loading -------------------------------------------------------

export interface LoadedFixture {
  labels: PhotoLabels;
  image: PixelSource;
  taps: CornerTaps;
}

export function decodePhoto(path: string): PixelSource {
  const file = new Uint8Array(readFileSync(path));
  const raw = decode(file, { useTArray: true, formatAsRGBA: true });
  const decoded: PixelSource = {
    width: raw.width,
    height: raw.height,
    data: new Uint8ClampedArray(raw.data.buffer, raw.data.byteOffset, raw.data.byteLength),
  };
  return remap(decoded, readExifOrientation(file));
}

export function loadFixture(labelsPath: string, photoDir: string): LoadedFixture {
  const labels = JSON.parse(readFileSync(labelsPath, "utf8")) as PhotoLabels;
  const image = rotate(downscale(decodePhoto(`${photoDir}/${labels.image}`), MAX_CANVAS_SIDE), labels.rotation);

  if (image.width !== labels.canvas.width || image.height !== labels.canvas.height) {
    throw new Error(
      `Fixture "${labels.image}": labels were captured on a ` +
        `${labels.canvas.width}×${labels.canvas.height} canvas but the photo decodes to ` +
        `${image.width}×${image.height}. The taps would not line up.`,
    );
  }
  return { labels, image, taps: denormalizeTaps(labels, image) };
}
