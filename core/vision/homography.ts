// 4-point plane homography, hand-rolled (spec §8 allows OpenCV.js for this,
// but the direct linear transform is a small 8×8 solve — not worth a
// dependency). The calibration flow maps the unit square (0,0)-(1,1) onto
// the four tapped board corners, after which every cell's normalized center
// lands at a predictable photo pixel.

export interface Point {
  x: number;
  y: number;
}

// Row-major 3×3 matrix with h[8] fixed to 1 by the DLT normalization.
export type Homography = readonly number[]; // length 9

// Solve A·x = b for an n×n system by Gaussian elimination with partial
// pivoting. A is mutated; rows are [n coefficients, b].
function solve(rows: number[][]): number[] {
  const n = rows.length;
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(rows[r]![col]!) > Math.abs(rows[pivot]![col]!)) pivot = r;
    }
    if (Math.abs(rows[pivot]![col]!) < 1e-12) {
      throw new Error("Degenerate corner configuration: points are collinear or repeated");
    }
    [rows[col], rows[pivot]] = [rows[pivot]!, rows[col]!];
    for (let r = col + 1; r < n; r++) {
      const factor = rows[r]![col]! / rows[col]![col]!;
      for (let c = col; c <= n; c++) rows[r]![c]! -= factor * rows[col]![c]!;
    }
  }
  const x = new Array<number>(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let sum = rows[r]![n]!;
    for (let c = r + 1; c < n; c++) sum -= rows[r]![c]! * x[c]!;
    x[r] = sum / rows[r]![r]!;
  }
  return x;
}

// Homography h with h22 = 1 such that applyHomography(h, src[i]) = dst[i]
// for all four correspondences.
export function computeHomography(
  src: readonly [Point, Point, Point, Point],
  dst: readonly [Point, Point, Point, Point],
): Homography {
  const rows: number[][] = [];
  for (let i = 0; i < 4; i++) {
    const { x, y } = src[i]!;
    const { x: u, y: v } = dst[i]!;
    rows.push([x, y, 1, 0, 0, 0, -u * x, -u * y, u]);
    rows.push([0, 0, 0, x, y, 1, -v * x, -v * y, v]);
  }
  return [...solve(rows), 1];
}

export function applyHomography(h: Homography, p: Point): Point {
  const w = h[6]! * p.x + h[7]! * p.y + h[8]!;
  return {
    x: (h[0]! * p.x + h[1]! * p.y + h[2]!) / w,
    y: (h[3]! * p.x + h[4]! * p.y + h[5]!) / w,
  };
}
