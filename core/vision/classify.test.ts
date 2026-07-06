import { describe, expect, it } from "vitest";
import type { TokenDef } from "../types";
import { classifyPatch } from "./classify";
import { rgbToLab, type Rgb } from "./color";

const FIRE_BASE: Rgb = { r: 200, g: 40, b: 30 };
const FIRE_PATTERN: Rgb = { r: 240, g: 120, b: 110 }; // lighter print on the token
const SEA: Rgb = { r: 30, g: 60, b: 200 };
const BOARD: Rgb = { r: 235, g: 225, b: 200 };
const AMBER_CUBE: Rgb = { r: 200, g: 140, b: 40 };

const VOCAB: TokenDef[] = [
  {
    id: "fire",
    label: "Fire",
    referenceSwatches: [rgbToLab(FIRE_BASE), rgbToLab(FIRE_PATTERN)],
  },
  { id: "sea", label: "Sea", referenceSwatches: [rgbToLab(SEA)] },
];
const EMPTY = [rgbToLab(BOARD)];
const IGNORE = [rgbToLab(AMBER_CUBE)];

function pixels(...groups: [Rgb, number][]): Rgb[] {
  return groups.flatMap(([rgb, count]) => Array<Rgb>(count).fill(rgb));
}

describe("classifyPatch", () => {
  it("takes the plurality of pixel votes", () => {
    const result = classifyPatch(pixels([FIRE_BASE, 6], [SEA, 4]), VOCAB, EMPTY, IGNORE);
    expect(result.token).toBe("fire");
    expect(result.voteShare).toBeCloseTo(0.6, 5);
    expect(result.runnerUp).toEqual({ token: "sea", voteShare: 0.4 });
  });

  it("counts a token's base and pattern tones as one token", () => {
    const result = classifyPatch(
      pixels([FIRE_BASE, 3], [FIRE_PATTERN, 3], [SEA, 4]),
      VOCAB,
      EMPTY,
      IGNORE,
    );
    expect(result.token).toBe("fire");
    expect(result.voteShare).toBeCloseTo(0.6, 5);
  });

  it("discards ignore-swatch pixels (a cube on the token) from the vote", () => {
    // Half the patch is cube; of what remains, fire has the plurality.
    const result = classifyPatch(
      pixels([AMBER_CUBE, 10], [FIRE_BASE, 6], [SEA, 4]),
      VOCAB,
      EMPTY,
      IGNORE,
    );
    expect(result.token).toBe("fire");
    expect(result.voteShare).toBeCloseTo(0.6, 5);
    expect(result.ignoredShare).toBeCloseTo(0.5, 5);
  });

  it("returns null when the empty-board tone wins", () => {
    const result = classifyPatch(pixels([BOARD, 9], [FIRE_BASE, 1]), VOCAB, EMPTY, IGNORE);
    expect(result.token).toBeNull();
    expect(result.voteShare).toBeCloseTo(0.9, 5);
  });

  it("falls back to a no-ignore vote when the cube swallows the whole patch", () => {
    const result = classifyPatch(pixels([AMBER_CUBE, 10]), VOCAB, EMPTY, IGNORE);
    expect(result.ignoredShare).toBe(1);
    expect(result.token).not.toBeUndefined(); // still yields a best guess
  });

  it("reports the mean color of the winning pixels for recalibration", () => {
    const result = classifyPatch(pixels([FIRE_BASE, 2], [FIRE_PATTERN, 2]), VOCAB, EMPTY, IGNORE);
    expect(result.meanRgb.r).toBeCloseTo((200 + 240) / 2, 5);
    expect(result.meanRgb.g).toBeCloseTo((40 + 120) / 2, 5);
  });

  it("throws when a token has no reference swatches or the patch is empty", () => {
    const missing: TokenDef[] = [{ id: "x", label: "X" }];
    expect(() => classifyPatch(pixels([SEA, 1]), missing, EMPTY, IGNORE)).toThrow(
      /reference swatches/,
    );
    expect(() => classifyPatch([], VOCAB, EMPTY, IGNORE)).toThrow(/empty patch/);
  });
});
