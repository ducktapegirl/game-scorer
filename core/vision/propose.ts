// The whole photo→BoardState pipeline (spec §8, hardened in M4.5): the user
// taps the centers of the grid's four corner tiles; the homography from
// those cells' layout centers to the taps is exact for every other cell
// (the layout models the physical grid up to an affine transform, which the
// homography absorbs). Each cell is then patch-sampled and classified by
// per-pixel plurality vote. No warp, no margins, no DOM.

import type { BoardState, BoardTopology, CellId, GameVisionSpec, TokenDef } from "../types";
import { classifyPatch, type PatchClassification } from "./classify";
import { applyHomography, computeHomography, type Point } from "./homography";
import { collectPatch, type PixelSource } from "./sample";

// The four corner-tile taps, in the calibrationCells order (TL, TR, BR, BL).
export type CornerTaps = readonly [Point, Point, Point, Point];

// Patch radius as a fraction of the distance to the nearest adjacent cell
// in photo pixels — wide enough that token pixels outvote an animal cube
// sitting at the center, while staying on the token.
const PATCH_RADIUS_RATIO = 0.3;

export interface CellDebug {
  cellId: CellId;
  point: Point; // sample center in photo pixels
  radius: number;
  classification: PatchClassification;
}

export interface ProposeOptions<V extends string> {
  image: PixelSource;
  taps: CornerTaps;
  topology: BoardTopology;
  vocabulary: readonly TokenDef[];
  vision: GameVisionSpec<V>;
  variant: V;
}

export interface Proposal<V extends string> {
  board: BoardState<V>;
  debug: CellDebug[];
}

export function proposeBoard<V extends string>(opts: ProposeOptions<V>): Proposal<V> {
  const { image, taps, topology, vocabulary, vision, variant } = opts;
  const calibration = topology.calibrationCells;
  if (!calibration) {
    throw new Error("Topology has no calibrationCells — this game cannot use the photo pipeline");
  }

  const h = computeHomography(
    calibration.map((id) => topology.cellCenter(id)) as [Point, Point, Point, Point],
    taps,
  );
  const points = new Map<CellId, Point>(
    topology.cells.map((id) => [id, applyHomography(h, topology.cellCenter(id))]),
  );

  const emptySwatches = vision.emptySwatches(variant);
  const board: BoardState<V> = { boardSide: variant, cells: [] };
  const debug: CellDebug[] = [];

  for (const id of topology.cells) {
    const point = points.get(id)!;
    const nearest = Math.min(
      ...topology.neighbors(id).map((n) => Math.hypot(points.get(n)!.x - point.x, points.get(n)!.y - point.y)),
    );
    // Isolated cells have no neighbor to scale by; fall back to 1% of the
    // image's short side.
    const radius = Number.isFinite(nearest)
      ? nearest * PATCH_RADIUS_RATIO
      : Math.min(image.width, image.height) * 0.01;

    const pixels = collectPatch(image, point, radius);
    const classification = classifyPatch(pixels, vocabulary, emptySwatches, vision.ignoreSwatches);
    debug.push({ cellId: id, point, radius, classification });

    if (classification.token !== null) {
      board.cells.push({ id, stack: vision.proposedStack(classification.token) });
    }
  }
  return { board, debug };
}
