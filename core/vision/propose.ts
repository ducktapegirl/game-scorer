// The whole photo→BoardState pipeline (spec §8, hardened in M4.5): the user
// taps the centers of the grid's four corner tiles; the homography from
// those cells' layout centers to the taps is exact for every other cell
// (the layout models the physical grid up to an affine transform, which the
// homography absorbs). Each cell is then patch-sampled and classified by
// per-pixel plurality vote. No warp, no margins, no DOM.

import type { BoardState, BoardTopology, CellId, GameVisionSpec, Lab, TokenDef } from "../types";
import { classifyPatch, type PatchClassification } from "./classify";
import { labToRgb, rgbToLab, type Rgb } from "./color";
import { applyHomography, computeHomography, type Homography, type Point } from "./homography";
import { applyGains, estimateGains, type NormalizationResult } from "./normalize";
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
  // The calibration homography (layout → photo pixels), so callers can map
  // any cell's outline into photo space for the M5 correction overlay.
  homography: Homography;
  // The per-photo color correction that was fitted before classifying.
  normalization: NormalizationResult;
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

  // Sample every cell first: the color correction is fitted from the whole
  // board at once, so a cell holding an unusual color still benefits from the
  // illuminant its neighbors reveal.
  const patches: { cellId: CellId; point: Point; radius: number; pixels: Rgb[] }[] = [];
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
    patches.push({ cellId: id, point, radius, pixels: collectPatch(image, point, radius) });
  }

  // Move the photo and the palette onto a common illuminant. Both sides are
  // corrected — normalizing only the photo would leave it chasing whatever
  // light the swatches happened to be measured under.
  const allSwatches: Lab[] = [
    ...vocabulary.flatMap((def) => def.referenceSwatches ?? []),
    ...emptySwatches,
    ...vision.ignoreSwatches,
  ];
  const normalization: NormalizationResult = {
    photo: estimateGains(patches.flatMap((p) => p.pixels)),
    palette: estimateGains(allSwatches.map(labToRgb)),
  };
  const correctSwatch = (lab: Lab): Lab =>
    rgbToLab(applyGains(normalization.palette, labToRgb(lab)));
  const normalizedVocabulary: TokenDef[] = vocabulary.map((def) => ({
    ...def,
    referenceSwatches: (def.referenceSwatches ?? []).map(correctSwatch),
  }));
  const normalizedEmpty = emptySwatches.map(correctSwatch);
  const normalizedIgnore = vision.ignoreSwatches.map(correctSwatch);

  const board: BoardState<V> = { boardSide: variant, cells: [] };
  const debug: CellDebug[] = [];
  for (const { cellId, point, radius, pixels } of patches) {
    const corrected = pixels.map((px) => applyGains(normalization.photo, px));
    const classification = classifyPatch(
      corrected,
      normalizedVocabulary,
      normalizedEmpty,
      normalizedIgnore,
    );
    debug.push({ cellId, point, radius, classification });

    if (classification.token !== null) {
      board.cells.push({ id: cellId, stack: vision.proposedStack(classification.token) });
    }
  }
  return { board, debug, homography: h, normalization };
}
