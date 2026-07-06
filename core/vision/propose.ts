// The whole photo→BoardState pipeline (spec §8), composed from the pure
// pieces: corner homography → per-cell normalized centers mapped into photo
// space → median patch sample → Lab nearest-swatch classification → a
// proposed board plus per-cell debug data for the calibration view. No
// warp: sampling directly at mapped centers is the same math with less code.

import type { BoardState, BoardTopology, CellId, GameVisionSpec, Lab, TokenDef } from "../types";
import { classifyColor, type Classification } from "./classify";
import { rgbToLab, type Rgb } from "./color";
import { applyHomography, computeHomography, type Point } from "./homography";
import { samplePatch, type PixelSource } from "./sample";

// The four board corners as tapped in the photo, in this order.
export type CornerTaps = readonly [Point, Point, Point, Point]; // TL, TR, BR, BL
const UNIT_SQUARE: CornerTaps = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 0, y: 1 },
];

// Patch radius as a fraction of the distance to the nearest adjacent cell
// in photo pixels — adapts to photo scale and perspective while staying
// well inside the token.
const PATCH_RADIUS_RATIO = 0.2;

export interface CellDebug {
  cellId: CellId;
  point: Point; // sample center in photo pixels
  radius: number;
  rgb: Rgb;
  lab: Lab;
  classification: Classification;
}

export interface ProposeOptions<V extends string> {
  image: PixelSource;
  corners: CornerTaps;
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
  const { image, corners, topology, vocabulary, vision, variant } = opts;
  const centerNorm = topology.cellCenterNorm;
  if (!centerNorm) {
    throw new Error("Topology has no cellCenterNorm — this game cannot use the photo pipeline");
  }

  const h = computeHomography(UNIT_SQUARE, corners);
  const points = new Map<CellId, Point>(
    topology.cells.map((id) => [id, applyHomography(h, centerNorm(id))]),
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

    const rgb = samplePatch(image, point, radius);
    const lab = rgbToLab(rgb);
    const classification = classifyColor(lab, vocabulary, emptySwatches);
    debug.push({ cellId: id, point, radius, rgb, lab, classification });

    if (classification.token !== null) {
      board.cells.push({ id, stack: vision.proposedStack(classification.token) });
    }
  }
  return { board, debug };
}
