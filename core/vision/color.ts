// Color math for the vision classifier: sRGB → CIE Lab (D65) and ΔE
// distance. Lab is used because nearest-swatch matching in a perceptual
// space is far more robust to lighting shifts than raw RGB (spec §8).

import type { Lab } from "../types";

export interface Rgb {
  r: number; // 0-255
  g: number;
  b: number;
}

// sRGB gamma expansion to linear light. Exported because the per-photo
// normalization fits its gains in linear light, where an illuminant is a
// plain multiplication.
export function linearize(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

// Inverse of linearize: linear light (0..1) back to an sRGB byte.
export function delinearize(linear: number): number {
  const c = Math.min(1, Math.max(0, linear));
  const encoded = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return encoded * 255;
}

// D65 reference white in XYZ, scaled so Y = 1.
const WHITE = { x: 0.95047, y: 1, z: 1.08883 };

function labF(t: number): number {
  const delta = 6 / 29;
  return t > delta ** 3 ? Math.cbrt(t) : t / (3 * delta * delta) + 4 / 29;
}

export function rgbToLab({ r, g, b }: Rgb): Lab {
  const rl = linearize(r);
  const gl = linearize(g);
  const bl = linearize(b);

  // sRGB (D65) → XYZ
  const x = 0.4124564 * rl + 0.3575761 * gl + 0.1804375 * bl;
  const y = 0.2126729 * rl + 0.7151522 * gl + 0.072175 * bl;
  const z = 0.0193339 * rl + 0.119192 * gl + 0.9503041 * bl;

  const fx = labF(x / WHITE.x);
  const fy = labF(y / WHITE.y);
  const fz = labF(z / WHITE.z);

  return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
}

// Inverse of rgbToLab. Reference swatches are authored and stored in Lab, but
// the normalization fit needs its targets in linear light, so it needs the way
// back. Channels are clamped to the sRGB gamut.
export function labToRgb({ L, a, b }: Lab): Rgb {
  const fy = (L + 16) / 116;
  const fx = fy + a / 500;
  const fz = fy - b / 200;

  const delta = 6 / 29;
  const finv = (t: number): number => (t > delta ? t ** 3 : 3 * delta * delta * (t - 4 / 29));

  const x = WHITE.x * finv(fx);
  const y = WHITE.y * finv(fy);
  const z = WHITE.z * finv(fz);

  // XYZ → linear sRGB (D65)
  const rl = 3.2404542 * x - 1.5371385 * y - 0.4985314 * z;
  const gl = -0.969266 * x + 1.8760108 * y + 0.041556 * z;
  const bl = 0.0556434 * x - 0.2040259 * y + 1.0572252 * z;

  return { r: delinearize(rl), g: delinearize(gl), b: delinearize(bl) };
}

// CIE76 ΔE — Euclidean distance in Lab. Adequate for telling apart a small
// vocabulary of well-separated token colors.
export function deltaE(p: Lab, q: Lab): number {
  return Math.hypot(p.L - q.L, p.a - q.a, p.b - q.b);
}
