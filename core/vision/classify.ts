// Per-pixel plurality voting classifier. Real token patches are multi-modal
// — base color, printed pattern, sometimes a translucent animal cube sitting
// on top — so each pixel is classified to its nearest swatch (token tones,
// empty-board tones, or "ignore" tones like cubes), ignore-pixels are
// discarded, and the cell takes the plurality of what remains.

import type { Lab, TokenDef, TokenId } from "../types";
import { deltaE, rgbToLab, type Rgb } from "./color";

export interface PatchClassification {
  token: TokenId | null; // null = empty board
  voteShare: number; // winner votes / non-ignored votes (0..1)
  ignoredShare: number; // ignored votes / all votes (0..1)
  meanDeltaE: number; // mean ΔE of the winning pixels to their matched swatch
  meanRgb: Rgb; // mean color of the winning pixels — feeds swatch recalibration
  runnerUp: { token: TokenId | null; voteShare: number } | null;
}

// Thresholds for flagging a classification as needing human review in the M5
// correction UI. Starting points tuned against the three real photos during
// verification; island photo B1's documented misread at cell 1,2 must flag.
export const UNCERTAIN_VOTE_SHARE = 0.5; // winner won less than half the vote
export const UNCERTAIN_RUNNERUP_MARGIN = 0.15; // runner-up this close to the winner
export const UNCERTAIN_IGNORED_SHARE = 0.6; // a cube covered most of the patch

// Whether a classification is shaky enough to surface a "?" flag. Never blocks
// acceptance — it only draws the user's eye. The boundary is deliberately
// inclusive on the runner-up margin (a tie-ish read flags) and exclusive on the
// two share thresholds (exactly at the line is treated as confident).
export function isUncertain(c: PatchClassification): boolean {
  if (c.voteShare < UNCERTAIN_VOTE_SHARE) return true;
  if (c.runnerUp && c.voteShare - c.runnerUp.voteShare <= UNCERTAIN_RUNNERUP_MARGIN) return true;
  if (c.ignoredShare > UNCERTAIN_IGNORED_SHARE) return true;
  return false;
}

// Internal vote-tally keys; token ids are plain strings, so reserved labels
// use a prefix no TokenId contains.
const EMPTY_LABEL = "\0empty";
const IGNORE_LABEL = "\0ignore";

interface Candidate {
  label: string;
  swatch: Lab;
}

interface Tally {
  count: number;
  deltaESum: number;
  rSum: number;
  gSum: number;
  bSum: number;
}

function vote(pixels: Rgb[], candidates: Candidate[]): Map<string, Tally> {
  const tallies = new Map<string, Tally>();
  for (const rgb of pixels) {
    const lab = rgbToLab(rgb);
    let best: Candidate = candidates[0]!;
    let bestDistance = Infinity;
    for (const candidate of candidates) {
      const distance = deltaE(lab, candidate.swatch);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = candidate;
      }
    }
    const tally = tallies.get(best.label) ?? { count: 0, deltaESum: 0, rSum: 0, gSum: 0, bSum: 0 };
    tally.count += 1;
    tally.deltaESum += bestDistance;
    tally.rSum += rgb.r;
    tally.gSum += rgb.g;
    tally.bSum += rgb.b;
    tallies.set(best.label, tally);
  }
  return tallies;
}

export function classifyPatch(
  pixels: Rgb[],
  vocabulary: readonly TokenDef[],
  emptySwatches: readonly Lab[],
  ignoreSwatches: readonly Lab[],
): PatchClassification {
  if (pixels.length === 0) throw new Error("Cannot classify an empty patch");

  const candidates: Candidate[] = [];
  for (const def of vocabulary) {
    if (!def.referenceSwatches || def.referenceSwatches.length === 0) {
      throw new Error(`Token "${def.id}" has no reference swatches to classify against`);
    }
    for (const swatch of def.referenceSwatches) candidates.push({ label: def.id, swatch });
  }
  for (const swatch of emptySwatches) candidates.push({ label: EMPTY_LABEL, swatch });
  const ignoreCandidates = ignoreSwatches.map((swatch) => ({ label: IGNORE_LABEL, swatch }));
  if (candidates.length === 0) throw new Error("No swatches to classify against");

  let tallies = vote(pixels, [...candidates, ...ignoreCandidates]);
  const ignored = tallies.get(IGNORE_LABEL)?.count ?? 0;
  const ignoredShare = ignored / pixels.length;
  tallies.delete(IGNORE_LABEL);

  // A patch swallowed whole by an ignore color (a cube filling the whole
  // window) leaves nothing to vote — fall back to a vote with the ignore
  // swatches excluded so the cell still gets a best guess; ignoredShare = 1
  // flags it in the debug view.
  if (tallies.size === 0) {
    tallies = vote(pixels, candidates);
  }

  const ranked = [...tallies.entries()]
    .map(([label, tally]) => ({ label, ...tally, meanDeltaE: tally.deltaESum / tally.count }))
    .sort((a, b) => b.count - a.count || a.meanDeltaE - b.meanDeltaE);

  const winner = ranked[0]!;
  const counted = ranked.reduce((sum, entry) => sum + entry.count, 0);
  const runnerUp = ranked[1];
  const toToken = (label: string): TokenId | null => (label === EMPTY_LABEL ? null : label);

  return {
    token: toToken(winner.label),
    voteShare: winner.count / counted,
    ignoredShare,
    meanDeltaE: winner.meanDeltaE,
    meanRgb: {
      r: winner.rSum / winner.count,
      g: winner.gSum / winner.count,
      b: winner.bSum / winner.count,
    },
    runnerUp: runnerUp ? { token: toToken(runnerUp.label), voteShare: runnerUp.count / counted } : null,
  };
}
