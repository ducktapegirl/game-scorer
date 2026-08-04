// Ground-truth photo labels: the format the correction UI exports and the
// real-photo regression tests read back. Pure data + pure functions so both
// the DOM side and the Node test harness share one definition of the format.
//
// Only the TOP token of each cell is recorded. Vision never determines stack
// height (the pipeline proposes it from a lookup and the user tap-cycles it),
// so height is not something a color fixture should assert.

import type { BoardState, CellId, TokenId } from "../types";
import type { Point } from "./homography";

export interface PhotoLabels {
  image: string; // file name of the photo these labels describe
  boardSide: string;
  rotation: number; // degrees of clockwise rotation applied before sampling
  canvas: { width: number; height: number }; // raster the taps were taken in
  // The four corner taps, normalized to 0..1 of the canvas, in the topology's
  // calibrationCells order. Normalized so a change to the app's downscale cap
  // doesn't invalidate committed fixtures.
  taps: Point[];
  cells: Record<CellId, TokenId | null>; // null = empty cell
}

export interface BuildLabelsOptions {
  image: string;
  board: BoardState;
  cells: readonly CellId[]; // every cell of the topology, so empties are explicit
  rotation: number;
  canvas: { width: number; height: number };
  taps: readonly Point[]; // in canvas pixels
}

// Round to 5 decimals: sub-pixel precision on any plausible canvas, and keeps
// the committed JSON readable.
function round(n: number): number {
  return Number(n.toFixed(5));
}

export function buildLabels(opts: BuildLabelsOptions): PhotoLabels {
  const { image, board, cells, rotation, canvas, taps } = opts;
  const stacks = new Map(board.cells.map((c) => [c.id, c.stack]));
  const labelled: Record<CellId, TokenId | null> = {};
  for (const id of cells) labelled[id] = stacks.get(id)?.at(-1) ?? null;

  return {
    image,
    boardSide: board.boardSide,
    rotation,
    canvas: { width: canvas.width, height: canvas.height },
    taps: taps.map((t) => ({ x: round(t.x / canvas.width), y: round(t.y / canvas.height) })),
    cells: labelled,
  };
}

export function formatLabels(labels: PhotoLabels): string {
  return JSON.stringify(labels, null, 2);
}

// Taps back in pixels for a raster of the given size. The raster need not be
// the one the labels were captured in — that is the point of normalizing.
export function denormalizeTaps(
  labels: PhotoLabels,
  size: { width: number; height: number },
): [Point, Point, Point, Point] {
  if (labels.taps.length !== 4) {
    throw new Error(`Labels for "${labels.image}" have ${labels.taps.length} taps, expected 4`);
  }
  return labels.taps.map((t) => ({
    x: t.x * size.width,
    y: t.y * size.height,
  })) as [Point, Point, Point, Point];
}
