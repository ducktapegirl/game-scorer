import { describe, expect, it } from "vitest";
import { buildLabels, denormalizeTaps, formatLabels, type PhotoLabels } from "./labels";
import type { BoardState } from "../types";

const BOARD: BoardState = {
  boardSide: "B",
  cells: [
    { id: "0,0", stack: ["gray"] },
    { id: "0,1", stack: ["brown", "green"] },
    { id: "0,2", stack: ["brown", "red"] },
  ],
};

const CELLS = ["0,0", "0,1", "0,2", "0,3"];

const CANVAS = { width: 1200, height: 1600 };

const TAPS = [
  { x: 120, y: 160 },
  { x: 1080, y: 160 },
  { x: 1080, y: 1440 },
  { x: 120, y: 1440 },
];

function build(): PhotoLabels {
  return buildLabels({
    image: "IMG_0001.jpg",
    board: BOARD,
    cells: CELLS,
    rotation: 90,
    canvas: CANVAS,
    taps: TAPS,
  });
}

describe("buildLabels", () => {
  it("records the top token of each stack", () => {
    const labels = build();
    expect(labels.cells["0,0"]).toBe("gray");
    expect(labels.cells["0,1"]).toBe("green");
    expect(labels.cells["0,2"]).toBe("red");
  });

  it("records cells absent from the board as empty", () => {
    expect(build().cells["0,3"]).toBeNull();
  });

  it("covers every cell of the topology, not just the occupied ones", () => {
    expect(Object.keys(build().cells)).toEqual(CELLS);
  });

  it("normalizes taps to the canvas", () => {
    expect(build().taps).toEqual([
      { x: 0.1, y: 0.1 },
      { x: 0.9, y: 0.1 },
      { x: 0.9, y: 0.9 },
      { x: 0.1, y: 0.9 },
    ]);
  });

  it("carries the photo, side, rotation and canvas through", () => {
    const labels = build();
    expect(labels.image).toBe("IMG_0001.jpg");
    expect(labels.boardSide).toBe("B");
    expect(labels.rotation).toBe(90);
    expect(labels.canvas).toEqual(CANVAS);
  });
});

describe("denormalizeTaps", () => {
  it("round-trips through the canvas the labels were captured in", () => {
    expect(denormalizeTaps(build(), CANVAS)).toEqual(TAPS);
  });

  it("rescales to a differently sized raster", () => {
    expect(denormalizeTaps(build(), { width: 600, height: 800 })).toEqual([
      { x: 60, y: 80 },
      { x: 540, y: 80 },
      { x: 540, y: 720 },
      { x: 60, y: 720 },
    ]);
  });

  it("rejects labels that do not carry exactly four taps", () => {
    const labels = { ...build(), taps: [{ x: 0, y: 0 }] };
    expect(() => denormalizeTaps(labels, CANVAS)).toThrow(/expected 4/);
  });
});

describe("formatLabels", () => {
  it("emits JSON that parses back to the same labels", () => {
    const labels = build();
    expect(JSON.parse(formatLabels(labels))).toEqual(labels);
  });
});
