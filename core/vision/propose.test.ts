// End-to-end pipeline test against a synthetic "photo": a fictional square
// game's cells painted as two-tone discs (some with an amber "cube" at the
// center) at their perspective-warped positions, calibrated by tapping the
// four corner cells. Deterministic whole-pipeline check — no real photo, no
// DOM, no Harmonies specifics (core stays game-agnostic).

import { describe, expect, it } from "vitest";
import type { BoardTopology, GameVisionSpec, TokenDef } from "../types";
import { rgbToLab, type Rgb } from "./color";
import { applyHomography, computeHomography, type Point } from "./homography";
import { proposeBoard, type CornerTaps } from "./propose";
import { makeImage, paintCube, paintPatternedDisk } from "./test-helpers";
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
  calibrationCells: ["0,0", "2,0", "2,2", "0,2"], // TL, TR, BR, BL in layout
};

const FIRE_BASE: Rgb = { r: 200, g: 40, b: 30 };
const FIRE_PATTERN: Rgb = { r: 240, g: 120, b: 110 };
const SEA_BASE: Rgb = { r: 30, g: 60, b: 200 };
const SEA_PATTERN: Rgb = { r: 110, g: 160, b: 230 };
const BOARD_ART: Rgb = { r: 225, g: 215, b: 190 };
const AMBER_CUBE: Rgb = { r: 200, g: 140, b: 40 };

const vocabulary: TokenDef[] = [
  { id: "fire", label: "Fire", referenceSwatches: [rgbToLab(FIRE_BASE), rgbToLab(FIRE_PATTERN)] },
  { id: "sea", label: "Sea", referenceSwatches: [rgbToLab(SEA_BASE), rgbToLab(SEA_PATTERN)] },
];

const vision: GameVisionSpec = {
  emptySwatches: () => [rgbToLab(BOARD_ART)],
  ignoreSwatches: [rgbToLab(AMBER_CUBE)],
  // "fire" tokens always sit on a "sea" base in this fictional game — this
  // exercises the proposed-stack hook the way Harmonies' [brown, red] will.
  proposedStack: (token) => (token === "fire" ? ["sea", "fire"] : [token]),
};

// --- The synthetic photo ---------------------------------------------------

// Where the four corner cells were "tapped" in the skewed photo.
const TAPS: CornerTaps = [
  { x: 101, y: 87 },
  { x: 378, y: 112 },
  { x: 405, y: 301 },
  { x: 78, y: 270 },
];

const TRUE_TOKENS = new Map<string, { token: string; cube: boolean }>([
  ["0,0", { token: "fire", cube: false }], // a calibration corner with a token
  ["1,0", { token: "sea", cube: true }], // cube sitting on the token
  ["2,1", { token: "sea", cube: false }],
  ["1,2", { token: "fire", cube: true }],
  // every other cell stays empty board art
]);

function syntheticPhoto(): PixelSource {
  const image = makeImage(500, 400, BOARD_ART);
  const h = computeHomography(
    topology.calibrationCells!.map((id) => topology.cellCenter(id)) as [
      Point,
      Point,
      Point,
      Point,
    ],
    TAPS,
  );
  for (const [id, { token, cube }] of TRUE_TOKENS) {
    const center = applyHomography(h, topology.cellCenter(id));
    if (token === "fire") paintPatternedDisk(image, center, 30, FIRE_BASE, FIRE_PATTERN);
    else paintPatternedDisk(image, center, 30, SEA_BASE, SEA_PATTERN);
    if (cube) paintCube(image, center, 12, AMBER_CUBE); // dead-center, like real cubes
  }
  return image;
}

// --- The tests --------------------------------------------------------------

describe("proposeBoard", () => {
  it("recovers the exact board from a warped photo with patterned, cube-topped tokens", () => {
    const { board, debug } = proposeBoard({
      image: syntheticPhoto(),
      taps: TAPS,
      topology,
      vocabulary,
      vision,
      variant: "only",
    });

    expect(board.boardSide).toBe("only");
    const byId = new Map(board.cells.map((c) => [c.id, c.stack]));
    expect(byId.size).toBe(TRUE_TOKENS.size); // empty cells omitted
    expect(byId.get("0,0")).toEqual(["sea", "fire"]); // proposedStack applied
    expect(byId.get("1,0")).toEqual(["sea"]); // read correctly despite the cube
    expect(byId.get("2,1")).toEqual(["sea"]);
    expect(byId.get("1,2")).toEqual(["sea", "fire"]);

    expect(debug).toHaveLength(topology.cells.length); // debug covers every cell
    const byCell = new Map(debug.map((d) => [d.cellId, d]));
    // Cube-topped cells report a meaningful ignored share; clean cells don't.
    expect(byCell.get("1,0")!.classification.ignoredShare).toBeGreaterThan(0.1);
    expect(byCell.get("2,1")!.classification.ignoredShare).toBeLessThan(0.05);
    for (const entry of debug) {
      expect(entry.radius).toBeGreaterThan(0);
      expect(entry.classification.voteShare).toBeGreaterThan(0.5);
    }
  });

  it("throws for a topology without calibrationCells", () => {
    const bare: BoardTopology = { ...topology };
    delete bare.calibrationCells;
    expect(() =>
      proposeBoard({
        image: makeImage(10, 10, BOARD_ART),
        taps: TAPS,
        topology: bare,
        vocabulary,
        vision,
        variant: "only",
      }),
    ).toThrow(/calibrationCells/);
  });
});
