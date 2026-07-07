import { describe, expect, it } from "vitest";
import { applyHomography, computeHomography, type Point } from "./homography";

const UNIT: [Point, Point, Point, Point] = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 0, y: 1 },
];

// A convincingly skewed quadrilateral, as a handheld photo of a board
// would produce.
const PHOTO: [Point, Point, Point, Point] = [
  { x: 212, y: 158 },
  { x: 1385, y: 204 },
  { x: 1497, y: 1043 },
  { x: 105, y: 962 },
];

function expectClose(p: Point, q: Point, digits = 6): void {
  expect(p.x).toBeCloseTo(q.x, digits);
  expect(p.y).toBeCloseTo(q.y, digits);
}

describe("computeHomography", () => {
  it("maps all four correspondences exactly", () => {
    const h = computeHomography(UNIT, PHOTO);
    UNIT.forEach((src, i) => expectClose(applyHomography(h, src), PHOTO[i]!, 6));
  });

  it("is the identity for identical quads", () => {
    const h = computeHomography(PHOTO, PHOTO);
    expectClose(applyHomography(h, { x: 700, y: 600 }), { x: 700, y: 600 }, 4);
  });

  it("reproduces a pure affine transform on interior points", () => {
    // scale (2, 3) + translate (10, 20): affine, so w stays 1 everywhere
    const dst = UNIT.map(({ x, y }) => ({ x: 2 * x + 10, y: 3 * y + 20 })) as typeof UNIT;
    const h = computeHomography(UNIT, dst);
    expectClose(applyHomography(h, { x: 0.25, y: 0.75 }), { x: 10.5, y: 22.25 });
  });

  it("round-trips interior points through a perspective and its inverse", () => {
    const forward = computeHomography(UNIT, PHOTO);
    const inverse = computeHomography(PHOTO, UNIT);
    for (const p of [
      { x: 0.5, y: 0.5 },
      { x: 0.1, y: 0.9 },
      { x: 0.98, y: 0.02 },
    ]) {
      expectClose(applyHomography(inverse, applyHomography(forward, p)), p, 6);
    }
  });

  it("rejects degenerate (collinear) corners", () => {
    const collinear: [Point, Point, Point, Point] = [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
      { x: 3, y: 3 },
    ];
    expect(() => computeHomography(UNIT, collinear)).toThrow(/[Dd]egenerate/);
  });
});
