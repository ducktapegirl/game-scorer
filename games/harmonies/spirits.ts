// Nature's Spirit cards and scoring modifiers.
// Card data from planning/harmonies-cards-reference.md.

import { connectedComponents } from "../../core/graph";
import type { CellId, ScoreCategory } from "../../core/types";
import type { HarmoniesBoardState } from "./rules";
import { topology } from "./topology";

export interface SpiritCard {
  id: string;
  name: string;
  score(board: HarmoniesBoardState): { points: number; cells: CellId[] };
}

// Scoring functions transcribed from the user's physical cards
// (planning/harmonies-cards-reference.md).
const spiritScores = {
  spi_001: (board: HarmoniesBoardState) => {
    // Owl (per-landscape): h1 tree +3, h2 tree +3, h3 tree +1
    const trees = board.cells.filter((c) => c.stack.at(-1) === "green");
    let points = 0;
    const cells: CellId[] = [];
    for (const cell of trees) {
      const height = cell.stack.length;
      if (height === 1 || height === 2) points += 3;
      else if (height === 3) points += 1;
      cells.push(cell.id);
    }
    return { points, cells };
  },

  spi_002: (board: HarmoniesBoardState) => {
    // Lion (group-based): +2 pts per group of 1-2 yellows; +10 pts per group of 3+
    const topo = topology(board.boardSide);
    const yellows = board.cells.filter((c) => c.stack.at(-1) === "yellow").map((c) => c.id);
    const groups = connectedComponents(yellows, topo.neighbors);
    let points = 0;
    const cells: CellId[] = [];
    for (const group of groups) {
      if (group.length <= 2) {
        points += 2 * group.length;
      } else {
        points += 10;
      }
      cells.push(...group);
    }
    return { points, cells };
  },

  spi_003: (board: HarmoniesBoardState) => {
    // Butterfly (group-based): +5 pts per group of 1+ yellows (including singles)
    const topo = topology(board.boardSide);
    const yellows = board.cells.filter((c) => c.stack.at(-1) === "yellow").map((c) => c.id);
    const groups = connectedComponents(yellows, topo.neighbors);
    const points = 5 * groups.length;
    return { points, cells: yellows };
  },

  spi_004: (board: HarmoniesBoardState) => {
    // Dragonfly (group-based): +7 pts per group of 2+ blues
    const topo = topology(board.boardSide);
    const blues = board.cells.filter((c) => c.stack.at(-1) === "blue").map((c) => c.id);
    const groups = connectedComponents(blues, topo.neighbors);
    let points = 0;
    const cells: CellId[] = [];
    for (const group of groups) {
      if (group.length >= 2) {
        points += 7;
        cells.push(...group);
      }
    }
    return { points, cells };
  },

  spi_005: (board: HarmoniesBoardState) => {
    // Deer (per-landscape): h2 tree +4, h3 tree +3 (h1 bushes score nothing)
    const trees = board.cells.filter((c) => c.stack.at(-1) === "green");
    let points = 0;
    const cells: CellId[] = [];
    for (const cell of trees) {
      const height = cell.stack.length;
      if (height === 2) {
        points += 4;
        cells.push(cell.id);
      } else if (height === 3) {
        points += 3;
        cells.push(cell.id);
      }
    }
    return { points, cells };
  },

  spi_006: (board: HarmoniesBoardState) => {
    // Ram (per-landscape): h2 mountain +4, h3 mountain +4 (h1 grays score nothing)
    const mountains = board.cells.filter((c) => c.stack.at(-1) === "gray");
    let points = 0;
    const cells: CellId[] = [];
    for (const cell of mountains) {
      const height = cell.stack.length;
      if (height === 2 || height === 3) {
        points += 4;
        cells.push(cell.id);
      }
    }
    return { points, cells };
  },

  spi_007: (board: HarmoniesBoardState) => {
    // Stork (group-based): +6 pts per group of 2+ buildings (red-topped)
    const topo = topology(board.boardSide);
    const buildings = board.cells.filter((c) => c.stack.at(-1) === "red").map((c) => c.id);
    const groups = connectedComponents(buildings, topo.neighbors);
    let points = 0;
    const cells: CellId[] = [];
    for (const group of groups) {
      if (group.length >= 2) {
        points += 6;
        cells.push(...group);
      }
    }
    return { points, cells };
  },

  spi_008: (board: HarmoniesBoardState) => {
    // Cat (group-based): +4 pts per group of 1+ buildings (red-topped)
    const topo = topology(board.boardSide);
    const buildings = board.cells.filter((c) => c.stack.at(-1) === "red").map((c) => c.id);
    const groups = connectedComponents(buildings, topo.neighbors);
    const points = 4 * groups.length;
    return { points, cells: buildings };
  },

  spi_009: (board: HarmoniesBoardState) => {
    // Turtle (per-landscape): +2 pts per blue token
    const blues = board.cells.filter((c) => c.stack.at(-1) === "blue");
    return { points: 2 * blues.length, cells: blues.map((c) => c.id) };
  },

  spi_010: (board: HarmoniesBoardState) => {
    // Beaver (per-landscape): h1 building +3, h2 building +3, h3 building +1
    // (h3 red-topped stacks can't occur under the stacking rules — a
    // building tops out at height 2 — so that tier is unreachable but kept
    // for fidelity to the physical card.)
    const buildings = board.cells.filter((c) => c.stack.at(-1) === "red");
    let points = 0;
    const cells: CellId[] = [];
    for (const cell of buildings) {
      const height = cell.stack.length;
      if (height === 1 || height === 2) points += 3;
      else if (height === 3) points += 1;
      cells.push(cell.id);
    }
    return { points, cells };
  },
};

export const SPIRIT_CARDS: SpiritCard[] = [
  { id: "spi_001", name: "Owl", score: spiritScores.spi_001 },
  { id: "spi_002", name: "Lion", score: spiritScores.spi_002 },
  { id: "spi_003", name: "Butterfly", score: spiritScores.spi_003 },
  { id: "spi_004", name: "Dragonfly", score: spiritScores.spi_004 },
  { id: "spi_005", name: "Deer", score: spiritScores.spi_005 },
  { id: "spi_006", name: "Ram", score: spiritScores.spi_006 },
  { id: "spi_007", name: "Stork", score: spiritScores.spi_007 },
  { id: "spi_008", name: "Cat", score: spiritScores.spi_008 },
  { id: "spi_009", name: "Turtle", score: spiritScores.spi_009 },
  { id: "spi_010", name: "Beaver", score: spiritScores.spi_010 },
];

export function applySpirit(
  spiritId: string | "none",
  board: HarmoniesBoardState,
  baseBreakdown: ScoreCategory[],
): { spirit: ScoreCategory; modifiedBreakdown: ScoreCategory[] } {
  if (spiritId === "none") {
    return {
      spirit: { id: "spirit", label: "Spirit", points: 0, cells: [] },
      modifiedBreakdown: baseBreakdown,
    };
  }

  const card = SPIRIT_CARDS.find((c) => c.id === spiritId);
  if (!card) throw new Error(`Unknown spirit card: ${spiritId}`);

  const { points: spiritPoints, cells: spiritCells } = card.score(board);

  // All spirits are additive: base breakdown unchanged, spirit row gets the bonus
  return {
    spirit: { id: "spirit", label: "Spirit", points: spiritPoints, cells: spiritCells },
    modifiedBreakdown: baseBreakdown,
  };
}
