import type { ScoreBreakdown } from "../../../core/types";
import { EMPTY_CONFIG } from "../config";
import { score, type HarmoniesBoardState } from "../rules";
import type { TokenColor } from "../tokens";
import { cellId, topology, validateStack, type BoardSide } from "../topology";

export type Placement = [q: number, r: number, ...stack: TokenColor[]];

/**
 * Build a sparse board from hand-authored placements, rejecting cells that
 * are not on the given side and stacks that break the stacking rules — so a
 * test can't accidentally assert against an impossible board.
 */
export function boardWith(side: BoardSide, placements: Placement[]): HarmoniesBoardState {
  const valid = new Set(topology(side).cells);
  const cells = placements.map(([q, r, ...stack]) => {
    const id = cellId(q, r);
    if (!valid.has(id)) throw new Error(`test board: ${id} is not on side ${side}`);
    if (!validateStack(stack)) throw new Error(`test board: illegal stack [${stack}] at ${id}`);
    return { id, stack };
  });
  return { boardSide: side, cells };
}

export function scoreBoard(side: BoardSide, placements: Placement[]): ScoreBreakdown {
  return score(boardWith(side, placements), EMPTY_CONFIG);
}

export function points(breakdown: ScoreBreakdown, categoryId: string): number {
  return category(breakdown, categoryId).points;
}

export function categoryCells(breakdown: ScoreBreakdown, categoryId: string): string[] {
  return [...category(breakdown, categoryId).cells].sort();
}

function category(breakdown: ScoreBreakdown, categoryId: string) {
  const found = breakdown.categories.find((c) => c.id === categoryId);
  if (!found) throw new Error(`no category "${categoryId}" in breakdown`);
  return found;
}
