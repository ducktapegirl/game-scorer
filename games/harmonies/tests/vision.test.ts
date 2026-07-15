// Harmonies vision data: proposed stacks, swatches — plus a full-board
// end-to-end run of core/vision's pipeline over a synthetic side-A "photo"
// painted with the calibrated token tones: two-tone patterned discs, some
// with an amber animal cube at the center, calibrated by corner-tile taps.

import { applyHomography, computeHomography, type Point } from "../../../core/vision/homography";
import { proposeBoard, type CornerTaps } from "../../../core/vision/propose";
import type { PixelSource } from "../../../core/vision/sample";
import { makeImage, paintCube, paintPatternedDisk } from "../../../core/vision/test-helpers";
import { stackChoices } from "../entry";
import type { HarmoniesBoardState } from "../rules";
import { TOKEN_COLORS, TOKEN_DEFS, TOKEN_TONES_RGB, type TokenColor } from "../tokens";
import { topology, validateStack } from "../topology";
import { CUBE_TONES_RGB, EMPTY_TONES_RGB, harmoniesVision } from "../vision";

describe("proposedStack", () => {
  it.each(TOKEN_COLORS)("proposes a legal stack for %s", (token) => {
    const stack = harmoniesVision.proposedStack(token);
    expect(validateStack(stack)).toBe(true);
    expect(stack.at(-1)).toBe(token); // the proposed top matches what was seen
  });

  it("proposes the default building base for red", () => {
    expect(harmoniesVision.proposedStack("red")).toEqual(["brown", "red"]);
  });

  it("proposes height 1 for every other token", () => {
    for (const token of TOKEN_COLORS.filter((t) => t !== "red")) {
      expect(harmoniesVision.proposedStack(token)).toEqual([token]);
    }
  });
});

describe("swatches", () => {
  it("every token has at least one reference swatch", () => {
    for (const def of TOKEN_DEFS) {
      expect(def.referenceSwatches!.length).toBeGreaterThan(0);
    }
  });

  it.each(["A", "B"] as const)("side %s has at least one empty-board swatch", (side) => {
    expect(harmoniesVision.emptySwatches(side).length).toBeGreaterThan(0);
  });

  it("declares cube ignore swatches", () => {
    expect(harmoniesVision.ignoreSwatches.length).toBeGreaterThan(0);
  });
});

describe("depthTokens", () => {
  it("are exactly green and gray", () => {
    expect(harmoniesVision.depthTokens).toEqual(["green", "gray"]);
  });

  it("each offer three heights so a tap can cycle 1 → 2 → 3", () => {
    for (const token of harmoniesVision.depthTokens!) {
      expect(stackChoices(token).map((c) => c.stack.length)).toEqual([1, 2, 3]);
    }
  });

  it("excludes red — its hidden base is scoring-irrelevant", () => {
    expect(harmoniesVision.depthTokens).not.toContain("red");
  });
});

describe("end-to-end over a synthetic side-A photo", () => {
  // Where the four corner tiles (0,0 / 4,-2 / 4,2 / 0,4) were "tapped" in a
  // skewed handheld photo.
  const TAPS: CornerTaps = [
    { x: 213, y: 172 },
    { x: 1082, y: 214 },
    { x: 1121, y: 749 },
    { x: 178, y: 703 },
  ];

  // token on each non-empty cell + whether an animal cube sits on it
  const TRUE_BOARD: Partial<Record<string, { token: TokenColor; cube: boolean }>> = {
    "0,0": { token: "green", cube: false }, // a calibration corner with a token
    "0,1": { token: "blue", cube: true },
    "1,0": { token: "blue", cube: false },
    "2,0": { token: "red", cube: true },
    "2,1": { token: "gray", cube: false },
    "2,2": { token: "gray", cube: true },
    "3,0": { token: "yellow", cube: false },
    "3,1": { token: "yellow", cube: true },
    "4,-1": { token: "brown", cube: false },
  };

  function syntheticPhoto(): PixelSource {
    const image = makeImage(1300, 950, EMPTY_TONES_RGB.A[0]!);
    const topo = topology("A");
    const h = computeHomography(
      topo.calibrationCells!.map((id) => topo.cellCenter(id)) as [Point, Point, Point, Point],
      TAPS,
    );
    // Some empty cells show the printed art's second tone — it must read as
    // empty, not as a blue token.
    const artTone = EMPTY_TONES_RGB.A[1] ?? EMPTY_TONES_RGB.A[0]!;
    paintPatternedDisk(image, applyHomography(h, topo.cellCenter("1,1")), 40, artTone, artTone);
    paintPatternedDisk(image, applyHomography(h, topo.cellCenter("1,2")), 40, artTone, artTone);

    for (const [id, { token, cube }] of Object.entries(TRUE_BOARD) as [
      string,
      { token: TokenColor; cube: boolean },
    ][]) {
      const center = applyHomography(h, topo.cellCenter(id));
      const tones = TOKEN_TONES_RGB[token];
      paintPatternedDisk(image, center, 55, tones[0]!, tones[tones.length - 1]!);
      if (cube) paintCube(image, center, 22, CUBE_TONES_RGB[0]!);
    }
    return image;
  }

  it("recovers the exact intended BoardState", () => {
    const { board, debug } = proposeBoard({
      image: syntheticPhoto(),
      taps: TAPS,
      topology: topology("A"),
      vocabulary: TOKEN_DEFS,
      vision: harmoniesVision,
      variant: "A",
    });

    const proposed = board as HarmoniesBoardState;
    expect(proposed.boardSide).toBe("A");
    const byId = new Map(proposed.cells.map((c) => [c.id, c.stack]));
    expect(byId.size).toBe(Object.keys(TRUE_BOARD).length); // art + bare cells → empty
    for (const [id, { token }] of Object.entries(TRUE_BOARD) as [
      string,
      { token: TokenColor },
    ][]) {
      expect(byId.get(id)).toEqual(harmoniesVision.proposedStack(token));
    }
    expect(byId.get("2,0")).toEqual(["brown", "red"]); // the red default

    // Cube-topped cells surface a meaningful ignored share in the debug data.
    const byCell = new Map(debug.map((d) => [d.cellId, d.classification]));
    expect(byCell.get("0,1")!.ignoredShare).toBeGreaterThan(0.1);
    expect(byCell.get("1,0")!.ignoredShare).toBeLessThan(0.05);
  });
});
