import { describe, expect, it } from "vitest";
import type { BoardTopology, CellId } from "../types";
import { computeHomography, type Homography, type Point } from "../vision/homography";
import { cellPolygons, hitTest } from "./photo-overlay";

// A minimal hex topology with two well-separated cells — enough to exercise
// the geometry without pulling a game into a core test. Hexes are size 1
// (center-to-corner), so each spans x ∈ [center−1, center+1] at its own row.
function twoCellTopology(): BoardTopology {
  const centers: Record<CellId, Point> = {
    a: { x: 0, y: 0 },
    b: { x: 4, y: 0 },
  };
  return {
    shape: "hex",
    cells: ["a", "b"],
    neighbors: () => [],
    cellCenter: (id) => centers[id]!,
  };
}

const IDENTITY: Homography = [1, 0, 0, 0, 1, 0, 0, 0, 1];

describe("cellPolygons", () => {
  it("returns one polygon per cell, unchanged under the identity homography", () => {
    const polys = cellPolygons(twoCellTopology(), IDENTITY);
    expect(polys.map((p) => p.cellId)).toEqual(["a", "b"]);
    // Flat-top hex first corner is the east vertex, one unit right of center.
    expect(polys[0]!.polygon[0]).toEqual({ x: 1, y: 0 });
    expect(polys[0]!.polygon).toHaveLength(6);
  });

  it("maps every corner through a translation homography", () => {
    const translate: Homography = [1, 0, 10, 0, 1, 20, 0, 0, 1];
    const polys = cellPolygons(twoCellTopology(), translate);
    expect(polys[0]!.polygon[0]).toEqual({ x: 11, y: 20 });
    expect(polys[1]!.polygon[0]).toEqual({ x: 15, y: 20 }); // b's east vertex (4+1)+10
  });

  it("maps corners through a genuine perspective homography consistently", () => {
    // An arbitrary non-affine correspondence; a cell center must land where
    // applyHomography puts it, and the polygon must surround that point.
    const h = computeHomography(
      [
        { x: 0, y: 0 },
        { x: 4, y: 0 },
        { x: 4, y: 4 },
        { x: 0, y: 4 },
      ],
      [
        { x: 100, y: 100 },
        { x: 900, y: 130 },
        { x: 870, y: 640 },
        { x: 140, y: 610 },
      ],
    );
    const polys = cellPolygons(twoCellTopology(), h);
    const aCenter = { x: 100, y: 100 }; // cell "a" is at layout (0,0) → first tap
    expect(hitTest(polys, aCenter)).toBe("a");
  });
});

describe("hitTest", () => {
  const polys = cellPolygons(twoCellTopology(), IDENTITY);

  it("returns the cell whose polygon contains the point", () => {
    expect(hitTest(polys, { x: 0, y: 0 })).toBe("a");
    expect(hitTest(polys, { x: 4, y: 0 })).toBe("b");
    expect(hitTest(polys, { x: 0.5, y: 0.2 })).toBe("a"); // off-center but inside
  });

  it("returns null in the gap between cells and far outside", () => {
    expect(hitTest(polys, { x: 2, y: 0 })).toBeNull(); // gap between a and b
    expect(hitTest(polys, { x: 100, y: 100 })).toBeNull();
  });

  it("does not leak a point from one cell into its neighbor", () => {
    // Just inside b's west vertex must be b, not a.
    expect(hitTest(polys, { x: 3.1, y: 0 })).toBe("b");
    expect(hitTest(polys, { x: 0.9, y: 0 })).toBe("a");
  });
});
