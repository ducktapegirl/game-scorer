// Nearest-swatch token classification (the architecture doc's
// TokenClassifier): a sampled Lab color against the game's token swatches
// plus its empty-board swatches. Winning an empty swatch means "no token".

import type { Lab, TokenDef, TokenId } from "../types";
import { deltaE } from "./color";

export interface Classification {
  token: TokenId | null; // null = empty board
  distance: number; // ΔE to the winning swatch
  // Nearest swatch with a *different* verdict — the ambiguity margin the
  // debug view surfaces for calibration.
  runnerUp: { token: TokenId | null; distance: number } | null;
}

export function classifyColor(
  sample: Lab,
  vocabulary: readonly TokenDef[],
  emptySwatches: readonly Lab[],
): Classification {
  const candidates: { token: TokenId | null; swatch: Lab }[] = [];
  for (const def of vocabulary) {
    if (!def.referenceSwatch) {
      throw new Error(`Token "${def.id}" has no reference swatch to classify against`);
    }
    candidates.push({ token: def.id, swatch: def.referenceSwatch });
  }
  for (const swatch of emptySwatches) candidates.push({ token: null, swatch });
  if (candidates.length === 0) throw new Error("No swatches to classify against");

  const ranked = candidates
    .map(({ token, swatch }) => ({ token, distance: deltaE(sample, swatch) }))
    .sort((a, b) => a.distance - b.distance);

  const winner = ranked[0]!;
  const runnerUp = ranked.find((c) => c.token !== winner.token) ?? null;
  return { token: winner.token, distance: winner.distance, runnerUp };
}
