// End-to-end pipeline test against a synthetic "photo": a fictional square
// game's cells painted at their perspective-warped positions, then read back
// through proposeBoard. Deterministic whole-pipeline math check — no real
// photo, no DOM, no Harmonies specifics (core stays game-agnostic).

import { describe, expect, it } from "vitest";
import type { BoardTopology, GameVisionSpec, TokenDef } from "../types";
import { rgbToLab, type Rgb } from "./color";
import { applyHomography, computeHomography, type Point } from "./homography";
import { proposeBoard, type CornerTaps } from "./propose";
import { makeImage, setPixel } from "./test-helpers";
import type { PixelSource } from "./sample";

// --- The fictional game: a 3×3 square grid, two token colors -------------

const IDS = ["0,0", "1,0", "2,0", "0,1", "1,1", "2,1", "0,2", "1,2", "2,2"];

const topology: BoardTopology = {
  shape: "square",
  cells: IDS,
  neighbors: (id) => {
    const [x, y] = id.split(",").map(Number) as [number, number];
    return [
      `${x + 1},${y}`,
      `${x - 1},${y}`,
      `${x},${y + 1}`,
      `${x},${y - 1}`,
    ].filter((n) => IDS.includes(n));
  },
  cellCenter: (id) => {
    const [x, y] = id.split(",").map(Number) as [number, number];
    return { x, y };
  },
  // Cells at 1/6, 3/6, 5/6 of the board rectangle in each axis.
  cellCenterNorm: (id) => {
    const [x, y] = id.split(",").map(Number) as [number, number];
    return { x: (2 * x + 1) / 6, y: (2 * y + 1) / 6 };
  },
};

const FIRE: Rgb = { r: 200, g: 40, b: 30 };
const SEA: Rgb = { r: 30, g: 60, b: 200 };
const BOARD_ART: Rgb = { r: 225, g: 215, b: 190 };

const vocabulary: TokenDef[] = [
  { id: "fire", label: "Fire", referenceSwatch: rgbToLab(FIRE) },
  { id: "sea", label: "Sea", referenceSwatch: rgbToLab(SEA) },
];

const vision: GameVisionSpec = {
  emptySwatches: () => [rgbToLab(BOARD_ART)],
  // "fire" tokens always sit on a "sea" base in this fictional game — this
  // exercises the proposed-stack hook the way Harmonies' [brown, red] will.
  proposedStack: (token) => (token === "fire" ? ["sea", "fire"] : [token]),
};

// --- The synthetic photo ---------------------------------------------------

// The board as tapped in the photo: a skewed quadrilateral.
const CORNERS: CornerTaps = [
  { x: 61, y: 47 },
  { x: 418, y: 72 },
  { x: 445, y: 341 },
  { x: 38, y: 310 },
];

const TRUE_TOKENS = new Map<string, Rgb>([
  ["0,0", FIRE],
  ["1,0", SEA],
  ["2,1", SEA],
  ["1,2", FIRE],
  // every other cell stays empty board art
]);

function paintDisk(image: PixelSource, center: Point, radius: number, rgb: Rgb): void {
  for (let y = Math.ceil(center.y - radius); y <= center.y + radius; y++) {
    for (let x = Math.ceil(center.x - radius); x <= center.x + radius; x++) {
      if (Math.hypot(x - center.x, y - center.y) <= radius) setPixel(image, x, y, rgb);
    }
  }
}

function syntheticPhoto(): PixelSource {
  const image = makeImage(500, 400, BOARD_ART);
  const h = computeHomography(
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ],
    CORNERS,
  );
  for (const [id, rgb] of TRUE_TOKENS) {
    const center = applyHomography(h, topology.cellCenterNorm!(id));
    // Noise: dot the disk with slightly-off pixels the median must absorb.
    paintDisk(image, center, 22, rgb);
    setPixel(image, Math.round(center.x), Math.round(center.y), { r: 255, g: 255, b: 255 });
  }
  return image;
}

// --- The test ---------------------------------------------------------------

describe("proposeBoard", () => {
  it("recovers the exact intended board from a warped synthetic photo", () => {
    const { board, debug } = proposeBoard({
      image: syntheticPhoto(),
      corners: CORNERS,
      topology,
      vocabulary,
      vision,
      variant: "only",
    });

    expect(board.boardSide).toBe("only");
    const byId = new Map(board.cells.map((c) => [c.id, c.stack]));
    expect(byId.size).toBe(TRUE_TOKENS.size); // empty cells omitted
    expect(byId.get("0,0")).toEqual(["sea", "fire"]); // proposedStack applied
    expect(byId.get("1,0")).toEqual(["sea"]);
    expect(byId.get("2,1")).toEqual(["sea"]);
    expect(byId.get("1,2")).toEqual(["sea", "fire"]);

    expect(debug).toHaveLength(topology.cells.length); // debug covers every cell
    for (const entry of debug) {
      expect(entry.radius).toBeGreaterThan(0);
      expect(entry.classification.runnerUp).not.toBeNull();
    }
  });

  it("throws for a topology without cellCenterNorm", () => {
    const bare: BoardTopology = { ...topology };
    delete bare.cellCenterNorm;
    expect(() =>
      proposeBoard({
        image: makeImage(10, 10, BOARD_ART),
        corners: CORNERS,
        topology: bare,
        vocabulary,
        vision,
        variant: "only",
      }),
    ).toThrow(/cellCenterNorm/);
  });
});
