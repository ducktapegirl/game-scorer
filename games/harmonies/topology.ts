import type { BoardTopology, CellId } from "../../core/types";
import type { TokenColor } from "./tokens";

export type BoardSide = "A" | "B";

// Physical board shapes as columns of hexes (flat-top), left to right.
// Side A (river scoring): 5-4-5-4-5 = 23 cells.
// Side B (island scoring): 4-3-4-3-4-3-4 = 25 cells.
const COLUMN_HEIGHTS: Record<BoardSide, readonly number[]> = {
  A: [5, 4, 5, 4, 5],
  B: [4, 3, 4, 3, 4, 3, 4],
};

// Axial coordinates: column c = q, and the shorter odd columns sit half a hex
// lower than their neighbors ("odd-q shifted down"), so row i in column q maps
// to r = i - floor(q / 2). The exact assignment is an internal convention —
// scoring only depends on the adjacency graph this produces.
export function cellId(q: number, r: number): CellId {
  return `${q},${r}`;
}

export function parseCellId(id: CellId): { q: number; r: number } {
  const [q, r] = id.split(",");
  return { q: Number(q), r: Number(r) };
}

const AXIAL_DIRECTIONS = [
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, 0],
  [-1, 1],
  [0, 1],
] as const;

// Photo calibration reference points (M4.5): the user taps the centers of
// the grid's four corner tiles. Both sides' corner cells form a rectangle in
// cellCenter layout space, so the homography fitted through them is exact
// for every other cell — no board-margin estimation exists or is needed.
const CALIBRATION_CELLS: Record<BoardSide, readonly [CellId, CellId, CellId, CellId]> = {
  A: ["0,0", "4,-2", "4,2", "0,4"], // TL, TR, BR, BL
  B: ["0,0", "6,-3", "6,0", "0,3"],
};

function buildTopology(side: BoardSide): BoardTopology {
  const cells: CellId[] = [];
  COLUMN_HEIGHTS[side].forEach((height, q) => {
    for (let row = 0; row < height; row++) {
      cells.push(cellId(q, row - Math.floor(q / 2)));
    }
  });

  const valid = new Set(cells);
  const neighborMap = new Map<CellId, CellId[]>();
  for (const id of cells) {
    const { q, r } = parseCellId(id);
    neighborMap.set(
      id,
      AXIAL_DIRECTIONS.map(([dq, dr]) => cellId(q + dq, r + dr)).filter((n) => valid.has(n)),
    );
  }

  return {
    shape: "hex",
    cells,
    neighbors: (id) => neighborMap.get(id) ?? [],
    // Flat-top hex layout in units of one hex "size" (center-to-corner):
    // adjacent columns are 1.5 apart, rows √3 apart, odd columns shifted by
    // the same half-row the axial convention above encodes.
    cellCenter: (id) => {
      const { q, r } = parseCellId(id);
      return { x: 1.5 * q, y: Math.sqrt(3) * (r + q / 2) };
    },
    calibrationCells: CALIBRATION_CELLS[side],
  };
}

const TOPOLOGIES: Record<BoardSide, BoardTopology> = {
  A: buildTopology("A"),
  B: buildTopology("B"),
};

export function topology(side: BoardSide): BoardTopology {
  return TOPOLOGIES[side];
}

// Stacking rules from planning/harmonies-rules-reference.md constrain stacks
// to a small closed set of compositions, so a whitelist is the whole rule:
// - gray on gray only, max height 3
// - max 2 brown; one green may top 0-2 brown (never green on green)
// - red may sit alone on empty ground, or on exactly 1 brown/gray/red (never
//   the 3rd token) — a lone red is legal but is not a "building" for scoring
// - blue and yellow are ground-level only
const VALID_STACKS = new Set([
  "",
  "blue",
  "yellow",
  "gray",
  "gray,gray",
  "gray,gray,gray",
  "brown",
  "brown,brown",
  "green",
  "brown,green",
  "brown,brown,green",
  "red",
  "brown,red",
  "gray,red",
  "red,red",
]);

export function validateStack(stack: TokenColor[]): boolean {
  return VALID_STACKS.has(stack.join(","));
}
