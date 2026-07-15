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

// Placeholder scoring functions — will be replaced with real rules once card data is verified.
const spiritScores = {
  spi_001: (board: HarmoniesBoardState) => {
    // Owl (additive): +3 pts per bush (height-1 tree)
    const bushes = board.cells.filter((c) => c.stack.at(-1) === "green" && c.stack.length === 1);
    return { points: 3 * bushes.length, cells: bushes.map((c) => c.id) };
  },

  spi_002: (board: HarmoniesBoardState) => {
    // Lion (additive): +2 pts per group of 1-2 yellows; +10 pts per group of 3+
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
    // Butterfly (additive): +5 pts per field (including singles)
    const topo = topology(board.boardSide);
    const yellows = board.cells.filter((c) => c.stack.at(-1) === "yellow").map((c) => c.id);
    const groups = connectedComponents(yellows, topo.neighbors);
    const points = 5 * groups.length;
    return { points, cells: yellows };
  },

  spi_004: (board: HarmoniesBoardState) => {
    // Dragonfly (add): +2 per blue token
    const blues = board.cells.filter((c) => c.stack.at(-1) === "blue");
    return { points: 2 * blues.length, cells: blues.map((c) => c.id) };
  },

  spi_005: (board: HarmoniesBoardState) => {
    // Frog (add): +1 per tree (green)
    const greens = board.cells.filter((c) => c.stack.at(-1) === "green");
    return { points: greens.length, cells: greens.map((c) => c.id) };
  },

  spi_006: (board: HarmoniesBoardState) => {
    // Heron (additive): +1 pt per mountain (gray-topped stack), no adjacency required
    const grays = board.cells.filter((c) => c.stack.at(-1) === "gray");
    return { points: grays.length, cells: grays.map((c) => c.id) };
  },

  spi_007: (board: HarmoniesBoardState) => {
    // Stork (add): +1 per building (red on base)
    const reds = board.cells.filter((c) => c.stack.at(-1) === "red" && c.stack.length >= 2);
    return { points: reds.length, cells: reds.map((c) => c.id) };
  },

  spi_008: (board: HarmoniesBoardState) => {
    // Cat (additive): +10 pts per building with 2+ neighbor colors; +5 pts with 1 color
    const topo = topology(board.boardSide);
    let points = 0;
    const cells: CellId[] = [];
    for (const cell of board.cells) {
      if (cell.stack.at(-1) === "red" && cell.stack.length >= 2) {
        const neighborColors = new Set(
          topo.neighbors(cell.id).map((n) => board.cells.find((c) => c.id === n)?.stack.at(-1)).filter(Boolean),
        );
        points += neighborColors.size >= 2 ? 10 : 5;
        cells.push(cell.id);
      }
    }
    return { points, cells };
  },

  spi_009: (board: HarmoniesBoardState) => {
    // Squirrel (add): +1 per tree (green)
    const greens = board.cells.filter((c) => c.stack.at(-1) === "green");
    return { points: greens.length, cells: greens.map((c) => c.id) };
  },

  spi_010: (board: HarmoniesBoardState) => {
    // Badger (additive): +3 pts per tree (green-topped stack), any height
    const trees = board.cells.filter((c) => c.stack.at(-1) === "green");
    return { points: 3 * trees.length, cells: trees.map((c) => c.id) };
  },
};

export const SPIRIT_CARDS: SpiritCard[] = [
  { id: "spi_001", name: "Owl", score: spiritScores.spi_001 },
  { id: "spi_002", name: "Lion", score: spiritScores.spi_002 },
  { id: "spi_003", name: "Butterfly", score: spiritScores.spi_003 },
  { id: "spi_004", name: "Dragonfly", score: spiritScores.spi_004 },
  { id: "spi_005", name: "Frog", score: spiritScores.spi_005 },
  { id: "spi_006", name: "Heron", score: spiritScores.spi_006 },
  { id: "spi_007", name: "Stork", score: spiritScores.spi_007 },
  { id: "spi_008", name: "Cat", score: spiritScores.spi_008 },
  { id: "spi_009", name: "Squirrel", score: spiritScores.spi_009 },
  { id: "spi_010", name: "Badger", score: spiritScores.spi_010 },
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
