// Nature's Spirit cards and scoring modifiers.
// Card data from planning/harmonies-cards-reference.md.

import { connectedComponents } from "../../core/graph";
import type { CellId, ScoreCategory } from "../../core/types";
import type { HarmoniesBoardState } from "./rules";
import { topology } from "./topology";

export interface SpiritCard {
  id: string;
  name: string;
  mode: "add" | "replace";
  replaces?: string; // category id if mode === "replace"
  score(board: HarmoniesBoardState): { points: number; cells: CellId[] };
}

// Placeholder scoring functions — will be replaced with real rules once card data is verified.
const spiritScores = {
  spi_001: (board: HarmoniesBoardState) => {
    // Owl (add): +1 per bush (h1 green)
    const bushes = board.cells.filter((c) => c.stack[0] === "green" && c.stack.length === 1);
    return { points: bushes.length, cells: bushes.map((c) => c.id) };
  },

  spi_002: (board: HarmoniesBoardState) => {
    // Lion (replace fields): 2 pts per field of 1-2 yellows; 10 pts per 3+
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
    // Butterfly (replace fields): 5 pts per field (including singles)
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
    // Heron (replace mountains): 1 pt per gray, no adjacency
    const grays = board.cells.filter((c) => c.stack.at(-1) === "gray");
    return { points: grays.length, cells: grays.map((c) => c.id) };
  },

  spi_007: (board: HarmoniesBoardState) => {
    // Stork (add): +1 per building (red on base)
    const reds = board.cells.filter((c) => c.stack.at(-1) === "red" && c.stack.length >= 2);
    return { points: reds.length, cells: reds.map((c) => c.id) };
  },

  spi_008: (board: HarmoniesBoardState) => {
    // Cat (replace buildings): 10 pts per building with 2+ colors; 5 pts with 1
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

  spi_010: () => {
    // Badger (replace animals): handled in rules.ts (config-based)
    // This is a placeholder; actual implementation depends on config
    return { points: 0, cells: [] };
  },
};

export const SPIRIT_CARDS: SpiritCard[] = [
  {
    id: "spi_001",
    name: "Owl",
    mode: "add",
    score: spiritScores.spi_001,
  },
  {
    id: "spi_002",
    name: "Lion",
    mode: "replace",
    replaces: "fields",
    score: spiritScores.spi_002,
  },
  {
    id: "spi_003",
    name: "Butterfly",
    mode: "replace",
    replaces: "fields",
    score: spiritScores.spi_003,
  },
  {
    id: "spi_004",
    name: "Dragonfly",
    mode: "add",
    score: spiritScores.spi_004,
  },
  {
    id: "spi_005",
    name: "Frog",
    mode: "add",
    score: spiritScores.spi_005,
  },
  {
    id: "spi_006",
    name: "Heron",
    mode: "replace",
    replaces: "mountains",
    score: spiritScores.spi_006,
  },
  {
    id: "spi_007",
    name: "Stork",
    mode: "add",
    score: spiritScores.spi_007,
  },
  {
    id: "spi_008",
    name: "Cat",
    mode: "replace",
    replaces: "buildings",
    score: spiritScores.spi_008,
  },
  {
    id: "spi_009",
    name: "Squirrel",
    mode: "add",
    score: spiritScores.spi_009,
  },
  {
    id: "spi_010",
    name: "Badger",
    mode: "replace",
    replaces: "animals",
    score: spiritScores.spi_010,
  },
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

  // For additive spirits, base breakdown unchanged; spirit row gets the bonus
  if (card.mode === "add") {
    return {
      spirit: { id: "spirit", label: "Spirit", points: spiritPoints, cells: spiritCells },
      modifiedBreakdown: baseBreakdown,
    };
  }

  // For replacing spirits, zero out the replaced category and put all points in spirit
  if (card.mode === "replace" && card.replaces) {
    const modified = baseBreakdown.map((cat) =>
      cat.id === card.replaces ? { ...cat, points: 0, cells: [] } : cat,
    );
    return {
      spirit: { id: "spirit", label: "Spirit", points: spiritPoints, cells: spiritCells },
      modifiedBreakdown: modified,
    };
  }

  return {
    spirit: { id: "spirit", label: "Spirit", points: spiritPoints, cells: spiritCells },
    modifiedBreakdown: baseBreakdown,
  };
}
