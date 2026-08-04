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
import { delinearize, linearize } from "../../../core/vision/color";
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

// --- ICC colour management -------------------------------------------------

// A canvas is sRGB, and the browser converts a wide-gamut photo into it when
// drawing. Skipping that here would mean the tests measure different colours
// than the app sees — not a small difference: reading Display P3 code values
// as if they were sRGB desaturates every token, which is exactly the kind of
// shift this whole milestone is about. Phones increasingly save P3, so this is
// the common case rather than an edge case.
//
// Only matrix/TRC profiles are handled (the kind cameras emit), and the tone
// curve is assumed to be the sRGB one — true for plain sRGB and for Apple's
// "Display P3 Gamut with sRGB Transfer". Anything else falls back to identity.

type Matrix = [number, number, number][];

function multiply(a: Matrix, b: Matrix): Matrix {
  return a.map((row) => [0, 1, 2].map((j) => row.reduce((s, v, k) => s + v * b[k]![j]!, 0))) as Matrix;
}

// Bradford chromatic adaptation from the ICC connection space (D50) to D65,
// which is what sRGB is defined against.
const D50_TO_D65: Matrix = [
  [0.9555766, -0.0230393, 0.0631636],
  [-0.0282895, 1.0099416, 0.0210077],
  [0.0122982, -0.020483, 1.3299098],
];

// XYZ (D65) → linear sRGB.
const XYZ_TO_SRGB: Matrix = [
  [3.2404542, -1.5371385, -0.4985314],
  [-0.969266, 1.8760108, 0.041556],
  [0.0556434, -0.2040259, 1.0572252],
];

const IDENTITY: Matrix = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];

function findIccProfile(jpeg: Uint8Array): Uint8Array | null {
  const view = new DataView(jpeg.buffer, jpeg.byteOffset, jpeg.byteLength);
  let offset = 2;
  const chunks: Uint8Array[] = [];
  while (offset + 4 <= jpeg.length) {
    if (jpeg[offset] !== 0xff) break;
    const marker = jpeg[offset + 1]!;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) {
      offset += 2;
      continue;
    }
    if (marker === 0xda) break;
    const length = view.getUint16(offset + 2);
    if (length < 2) break;
    if (
      marker === 0xe2 &&
      String.fromCharCode(...jpeg.slice(offset + 4, offset + 15)) === "ICC_PROFILE"
    ) {
      // Skip the 12-byte identifier plus the 2-byte chunk counters.
      chunks.push(jpeg.slice(offset + 18, offset + 2 + length));
    }
    offset += 2 + length;
  }
  if (chunks.length === 0) return null;
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const profile = new Uint8Array(total);
  let at = 0;
  for (const chunk of chunks) {
    profile.set(chunk, at);
    at += chunk.length;
  }
  return profile;
}

// The profile's linear-RGB → linear-sRGB matrix, or the identity when the
// profile is absent, unsupported, or already sRGB.
export function iccToSrgbMatrix(jpeg: Uint8Array): Matrix {
  const profile = findIccProfile(jpeg);
  if (!profile || profile.length < 132) return IDENTITY;
  const view = new DataView(profile.buffer, profile.byteOffset, profile.byteLength);

  const tags = new Map<string, { offset: number; size: number }>();
  const count = view.getUint32(128);
  if (count > 200) return IDENTITY;
  for (let i = 0; i < count; i++) {
    const at = 132 + i * 12;
    if (at + 12 > profile.length) return IDENTITY;
    const sig = String.fromCharCode(...profile.slice(at, at + 4));
    tags.set(sig, { offset: view.getUint32(at + 4), size: view.getUint32(at + 8) });
  }

  // An XYZType colorant tag: 8-byte header then three s15Fixed16 values.
  const colorant = (sig: string): [number, number, number] | null => {
    const tag = tags.get(sig);
    if (!tag || tag.size < 20 || tag.offset + 20 > profile.length) return null;
    return [
      view.getInt32(tag.offset + 8) / 65536,
      view.getInt32(tag.offset + 12) / 65536,
      view.getInt32(tag.offset + 16) / 65536,
    ];
  };

  const r = colorant("rXYZ");
  const g = colorant("gXYZ");
  const b = colorant("bXYZ");
  if (!r || !g || !b) return IDENTITY;

  // Colorants are the columns of the profile's RGB → XYZ(D50) matrix.
  const toXyzD50: Matrix = [
    [r[0], g[0], b[0]],
    [r[1], g[1], b[1]],
    [r[2], g[2], b[2]],
  ];
  return multiply(XYZ_TO_SRGB, multiply(D50_TO_D65, toXyzD50));
}

// True when the matrix is close enough to the identity that applying it would
// only add rounding noise — i.e. the photo is already sRGB.
function isIdentity(m: Matrix): boolean {
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (Math.abs(m[i]![j]! - (i === j ? 1 : 0)) > 0.002) return false;
    }
  }
  return true;
}

// Lookup tables: a full-resolution phone photo is ~12M pixels, and three
// pow() calls each way per pixel is slow enough to matter in a test run.
const TO_LINEAR = Float64Array.from({ length: 256 }, (_, i) => linearize(i));
const FROM_LINEAR_STEPS = 4096;
const FROM_LINEAR = Uint8ClampedArray.from({ length: FROM_LINEAR_STEPS + 1 }, (_, i) =>
  Math.round(delinearize(i / FROM_LINEAR_STEPS)),
);

function encode(linear: number): number {
  const i = Math.round(Math.min(1, Math.max(0, linear)) * FROM_LINEAR_STEPS);
  return FROM_LINEAR[i]!;
}

export function convertToSrgb(image: PixelSource, matrix: Matrix): PixelSource {
  if (isIdentity(matrix)) return image;
  const [m0, m1, m2] = matrix as [
    [number, number, number],
    [number, number, number],
    [number, number, number],
  ];
  const data = new Uint8ClampedArray(image.data.length);
  for (let i = 0; i < image.data.length; i += 4) {
    const r = TO_LINEAR[image.data[i]!]!;
    const g = TO_LINEAR[image.data[i + 1]!]!;
    const b = TO_LINEAR[image.data[i + 2]!]!;
    data[i] = encode(m0[0] * r + m0[1] * g + m0[2] * b);
    data[i + 1] = encode(m1[0] * r + m1[1] * g + m1[2] * b);
    data[i + 2] = encode(m2[0] * r + m2[1] * g + m2[2] * b);
    data[i + 3] = 255;
  }
  return { width: image.width, height: image.height, data };
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
  const managed = convertToSrgb(decoded, iccToSrgbMatrix(file));
  return remap(managed, readExifOrientation(file));
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
