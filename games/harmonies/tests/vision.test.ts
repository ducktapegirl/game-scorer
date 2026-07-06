// Harmonies vision data: proposed stacks, swatches, normalized geometry —
// plus a full-board end-to-end run of core/vision's pipeline over a
// synthetic side-A "photo" painted with the placeholder swatch colors.

import { applyHomography, computeHomography, type Point } from "../../../core/vision/homography";
import { proposeBoard, type CornerTaps } from "../../../core/vision/propose";
import type { PixelSource } from "../../../core/vision/sample";
import { makeImage, setPixel } from "../../../core/vision/test-helpers";
import type { Rgb } from "../../../core/vision/color";
import type { HarmoniesBoardState } from "../rules";
import { PLACEHOLDER_TOKEN_RGB, TOKEN_COLORS, TOKEN_DEFS, type TokenColor } from "../tokens";
import { topology, validateStack } from "../topology";
import { harmoniesVision } from "../vision";

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
  it("every token has a reference swatch", () => {
    for (const def of TOKEN_DEFS) {
      expect(def.referenceSwatch).toBeDefined();
    }
  });

  it.each(["A", "B"] as const)("side %s has at least one empty-board swatch", (side) => {
    expect(harmoniesVision.emptySwatches(side).length).toBeGreaterThan(0);
  });
});

describe("cellCenterNorm", () => {
  it.each(["A", "B"] as const)("side %s centers stay inside the unit square margins", (side) => {
    const topo = topology(side);
    for (const id of topo.cells) {
      const { x, y } = topo.cellCenterNorm!(id);
      expect(x).toBeGreaterThan(0);
      expect(x).toBeLessThan(1);
      expect(y).toBeGreaterThan(0);
      expect(y).toBeLessThan(1);
    }
  });

  it("preserves the relative layout of cellCenter", () => {
    const topo = topology("A");
    const [first, second] = [topo.cells[0]!, topo.cells[1]!];
    const layout = [topo.cellCenter(first), topo.cellCenter(second)];
    const norm = [topo.cellCenterNorm!(first), topo.cellCenterNorm!(second)];
    // Same ordering along both axes as the abstract layout.
    expect(Math.sign(norm[1]!.x - norm[0]!.x)).toBe(Math.sign(layout[1]!.x - layout[0]!.x));
    expect(Math.sign(norm[1]!.y - norm[0]!.y)).toBe(Math.sign(layout[1]!.y - layout[0]!.y));
  });
});

describe("end-to-end over a synthetic side-A photo", () => {
  // The board as tapped in a skewed handheld photo.
  const CORNERS: CornerTaps = [
    { x: 96, y: 74 },
    { x: 1210, y: 118 },
    { x: 1262, y: 861 },
    { x: 54, y: 802 },
  ];

  const TRUE_BOARD: Partial<Record<string, TokenColor>> = {
    "0,0": "green",
    "0,1": "blue",
    "1,0": "blue",
    "2,0": "red",
    "2,1": "gray",
    "2,2": "gray",
    "3,0": "yellow",
    "3,1": "yellow",
    "4,-1": "brown",
  };

  function syntheticPhoto(): PixelSource {
    const boardArt: Rgb = { r: 222, g: 208, b: 180 };
    const image = makeImage(1350, 950, boardArt);
    const topo = topology("A");
    const h = computeHomography(
      [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 0, y: 1 },
      ],
      CORNERS,
    );
    // Paint printed-river art (the pale blue-gray empty swatch) on a couple
    // of empty cells — it must classify as empty, not as a blue token.
    const riverArt: Rgb = { r: 168, g: 190, b: 200 };
    const painted = new Map<string, Rgb>([
      ...Object.entries(TRUE_BOARD).map(([id, t]): [string, Rgb] => [id, PLACEHOLDER_TOKEN_RGB[t!]]),
      ["1,1", riverArt],
      ["1,2", riverArt],
    ]);
    for (const [id, rgb] of painted) {
      const center = applyHomography(h, topo.cellCenterNorm!(id));
      paintDisk(image, center, 26, rgb);
      // a glare speck the median sampling must reject
      setPixel(image, Math.round(center.x), Math.round(center.y), { r: 255, g: 255, b: 255 });
    }
    return image;
  }

  function paintDisk(image: PixelSource, center: Point, radius: number, rgb: Rgb): void {
    for (let y = Math.ceil(center.y - radius); y <= center.y + radius; y++) {
      for (let x = Math.ceil(center.x - radius); x <= center.x + radius; x++) {
        if (Math.hypot(x - center.x, y - center.y) <= radius) setPixel(image, x, y, rgb);
      }
    }
  }

  it("recovers the exact intended BoardState", () => {
    const { board } = proposeBoard({
      image: syntheticPhoto(),
      corners: CORNERS,
      topology: topology("A"),
      vocabulary: TOKEN_DEFS,
      vision: harmoniesVision,
      variant: "A",
    });

    const proposed = board as HarmoniesBoardState;
    expect(proposed.boardSide).toBe("A");
    const byId = new Map(proposed.cells.map((c) => [c.id, c.stack]));
    expect(byId.size).toBe(Object.keys(TRUE_BOARD).length); // river art + bare cells → empty
    for (const [id, token] of Object.entries(TRUE_BOARD)) {
      expect(byId.get(id)).toEqual(harmoniesVision.proposedStack(token!));
    }
    expect(byId.get("2,0")).toEqual(["brown", "red"]); // the red default
  });
});
