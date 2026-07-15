// Pure geometry for the M5 tappable photo overlay: map each cell's layout-
// space outline through the calibration homography into photo-pixel space,
// and hit-test a tapped photo point back to a cell. No DOM — the photo screen
// does the drawing and event plumbing; this is the math it unit-tests against.

import type { BoardTopology, CellId } from "../types";
import { applyHomography, type Homography, type Point } from "../vision/homography";
import { cellCorners } from "./board-view";

export interface CellPolygon {
  cellId: CellId;
  polygon: Point[]; // cell outline in photo-pixel space
}

// Each cell's outline (the same polygon board-view draws in layout space)
// projected into photo-pixel space by the calibration homography.
export function cellPolygons(topology: BoardTopology, h: Homography): CellPolygon[] {
  return topology.cells.map((cellId) => {
    const corners = cellCorners(topology.shape, topology.cellCenter(cellId));
    return { cellId, polygon: corners.map((p) => applyHomography(h, p)) };
  });
}

// The cell whose photo-space polygon contains `point`, or null. First match
// wins; board cells don't overlap, so at most one contains any interior point.
export function hitTest(polygons: readonly CellPolygon[], point: Point): CellId | null {
  for (const { cellId, polygon } of polygons) {
    if (pointInPolygon(point, polygon)) return cellId;
  }
  return null;
}

// Standard even-odd ray cast. Behavior exactly on an edge is unspecified (as
// with any point-in-polygon), which is fine for tap hit-testing.
function pointInPolygon(p: Point, polygon: readonly Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i]!;
    const b = polygon[j]!;
    const straddles = a.y > p.y !== b.y > p.y;
    if (straddles && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) {
      inside = !inside;
    }
  }
  return inside;
}
