// Color math for the vision classifier: sRGB → CIE Lab (D65) and ΔE
// distance. Lab is used because nearest-swatch matching in a perceptual
// space is far more robust to lighting shifts than raw RGB (spec §8).

import type { Lab } from "../types";

export interface Rgb {
  r: number; // 0-255
  g: number;
  b: number;
}

// sRGB gamma expansion to linear light.
function linearize(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
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

// CIE76 ΔE — Euclidean distance in Lab. Adequate for telling apart a small
// vocabulary of well-separated token colors.
export function deltaE(p: Lab, q: Lab): number {
  return Math.hypot(p.L - q.L, p.a - q.a, p.b - q.b);
}
