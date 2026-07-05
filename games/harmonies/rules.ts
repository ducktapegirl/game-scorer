// The pure Harmonies scoring engine: boardState + config → ScoreBreakdown.
// No DOM, no image code, no network. Scoring values come from
// planning/harmonies-rules-reference.md — the single source of truth.

import { componentTokenDiameter, connectedComponents } from "../../core/graph";
import type { BoardState, CellId, ScoreBreakdown, ScoreCategory } from "../../core/types";
import type { HarmoniesConfig } from "./config";
import type { TokenColor } from "./tokens";
import { topology, type BoardSide } from "./topology";

export type HarmoniesBoardState = BoardState<BoardSide, TokenColor>;

const HEIGHT_POINTS: Record<number, number> = { 1: 1, 2: 3, 3: 7 }; // trees and mountains
const RIVER_POINTS: Record<number, number> = { 1: 0, 2: 2, 3: 5, 4: 8, 5: 11, 6: 15 };

function riverPoints(length: number): number {
  return length > 6 ? 15 + 4 * (length - 6) : (RIVER_POINTS[length] ?? 0);
}

export function score(board: HarmoniesBoardState, config: HarmoniesConfig): ScoreBreakdown {
  const topo = topology(board.boardSide);
  const validCells = new Set(topo.cells);

  const stacks = new Map<CellId, TokenColor[]>();
  for (const cell of board.cells) {
    if (!validCells.has(cell.id)) {
      throw new Error(`Cell ${cell.id} is not on board side ${board.boardSide}`);
    }
    stacks.set(cell.id, cell.stack);
  }

  const top = (id: CellId): TokenColor | undefined => stacks.get(id)?.at(-1);
  const topped = (color: TokenColor): CellId[] => topo.cells.filter((id) => top(id) === color);

  // Trees: green-topped stack scores by height (1/3/7); brown-only stacks 0.
  const trees: ScoreCategory = { id: "trees", label: "Trees", points: 0, cells: [] };
  for (const id of topped("green")) {
    trees.points += HEIGHT_POINTS[stacks.get(id)!.length] ?? 0;
    trees.cells.push(id);
  }

  // Mountains: gray stack scores by height (1/3/7), but only if hex-adjacent
  // to at least one other mountain — any height counts, including a lone
  // height-1 gray, on both sides of the check.
  const mountains: ScoreCategory = { id: "mountains", label: "Mountains", points: 0, cells: [] };
  const grayCells = new Set(topped("gray"));
  for (const id of grayCells) {
    if (topo.neighbors(id).some((n) => grayCells.has(n))) {
      mountains.points += HEIGHT_POINTS[stacks.get(id)!.length] ?? 0;
      mountains.cells.push(id);
    }
  }

  // Fields: each group of 2+ contiguous yellow scores 5, regardless of size.
  const fields: ScoreCategory = { id: "fields", label: "Fields", points: 0, cells: [] };
  for (const group of connectedComponents(topped("yellow"), topo.neighbors)) {
    if (group.length >= 2) {
      fields.points += 5;
      fields.cells.push(...group);
    }
  }

  // Buildings: a red token counts as a building only when it sits on a base
  // (height ≥ 2) — a lone red on bare ground is a legal placement but is not
  // a building and never scores. A building scores 5 if the top tokens of its
  // neighbors show 3+ different colors (a neighboring red counts; empty cells
  // don't).
  const buildings: ScoreCategory = { id: "buildings", label: "Buildings", points: 0, cells: [] };
  for (const id of topped("red")) {
    if (stacks.get(id)!.length < 2) continue; // lone red: not a building
    const colors = new Set(topo.neighbors(id).map(top).filter(Boolean));
    if (colors.size >= 3) {
      buildings.points += 5;
      buildings.cells.push(id);
    }
  }

  const water =
    board.boardSide === "A"
      ? scoreRiver(topped("blue"), topo.neighbors)
      : scoreIslands(topo.cells, topo.neighbors, top);

  // Animals and spirit are scored in M3 from config.animalCards / config.spirit;
  // the config is accepted now so the public signature is final from M1.
  void config;
  const animals: ScoreCategory = { id: "animals", label: "Animals", points: 0, cells: [] };
  const spirit: ScoreCategory = { id: "spirit", label: "Spirit", points: 0, cells: [] };

  const categories = [trees, mountains, fields, buildings, water, animals, spirit];
  return {
    categories,
    total: categories.reduce((sum, c) => sum + c.points, 0),
  };
}

// Side A: only the single best river scores. A river's length is the number
// of tokens along the longest shortest-path between any two of its tokens
// (the component's token-diameter) — not its token count, which would
// overscore branching or looping rivers.
function scoreRiver(blueCells: CellId[], neighbors: (id: CellId) => CellId[]): ScoreCategory {
  let best: { points: number; cells: CellId[] } = { points: 0, cells: [] };
  for (const component of connectedComponents(blueCells, neighbors)) {
    const points = riverPoints(componentTokenDiameter(component, neighbors));
    if (points > best.points) best = { points, cells: component };
  }
  return { id: "water", label: "Water", points: best.points, cells: best.cells };
}

// Side B: every island (a group of non-blue spaces, empty cells included,
// separated from the others by water) scores 5; always at least 1 island.
function scoreIslands(
  allCells: CellId[],
  neighbors: (id: CellId) => CellId[],
  top: (id: CellId) => TokenColor | undefined,
): ScoreCategory {
  const land = allCells.filter((id) => top(id) !== "blue");
  const islands = connectedComponents(land, neighbors);
  return {
    id: "water",
    label: "Water",
    points: 5 * Math.max(islands.length, 1),
    cells: land,
  };
}
