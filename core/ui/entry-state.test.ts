import { describe, expect, it } from "vitest";
import type { BoardTopology, GameModule } from "../types";
import { emptyBoard, stackAt, validateSavedBoard, withStack } from "./entry-state";

// A minimal fake game so these tests exercise core mechanism only, never a
// real game's rules: 3 cells in a row, tokens "x" (stackable 1-2) and "y".
const cells = ["a", "b", "c"];
const topology: BoardTopology = {
  shape: "custom",
  cells,
  neighbors: (id) => cells.filter((c) => Math.abs(cells.indexOf(c) - cells.indexOf(id)) === 1),
  cellCenter: (id) => ({ x: cells.indexOf(id), y: 0 }),
};

const fakeBoard: GameModule["board"] = {
  variants: [{ id: "V", label: "Variant V" }],
  topology: () => topology,
  tokenVocabulary: [
    { id: "x", label: "X" },
    { id: "y", label: "Y" },
  ],
  allowsStacking: true,
  maxStackHeight: 2,
  stackChoices: (token) =>
    token === "x"
      ? [
          { label: "1", stack: ["x"] },
          { label: "2", stack: ["x", "x"] },
        ]
      : token === "y"
        ? [{ label: "1", stack: ["y"] }]
        : [],
};

describe("board editing", () => {
  it("creates an empty board with no serialized cells", () => {
    expect(emptyBoard("V")).toEqual({ boardSide: "V", cells: [] });
  });

  it("sets, replaces, and reads a cell's stack", () => {
    let board = emptyBoard("V");
    board = withStack(board, "a", ["x"]);
    expect(stackAt(board, "a")).toEqual(["x"]);
    board = withStack(board, "a", ["x", "x"]);
    expect(stackAt(board, "a")).toEqual(["x", "x"]);
    expect(board.cells).toHaveLength(1);
  });

  it("removes a cell when set to an empty stack", () => {
    let board = withStack(emptyBoard("V"), "a", ["y"]);
    board = withStack(board, "a", []);
    expect(board.cells).toEqual([]);
    expect(stackAt(board, "a")).toEqual([]);
  });

  it("does not mutate the input board", () => {
    const before = withStack(emptyBoard("V"), "a", ["y"]);
    withStack(before, "b", ["y"]);
    expect(before.cells).toHaveLength(1);
  });
});

describe("validateSavedBoard", () => {
  const saved = {
    boardSide: "V",
    cells: [
      { id: "a", stack: ["x", "x"] },
      { id: "b", stack: ["y"] },
    ],
  };

  it("accepts a well-formed saved board", () => {
    expect(validateSavedBoard(saved, fakeBoard)).toEqual(saved);
  });

  it("round-trips a board built with the editing helpers through JSON", () => {
    const board = withStack(withStack(emptyBoard("V"), "c", ["y"]), "a", ["x"]);
    expect(validateSavedBoard(JSON.parse(JSON.stringify(board)), fakeBoard)).toEqual(board);
  });

  it.each([
    ["null", null],
    ["a string", "board"],
    ["missing cells", { boardSide: "V" }],
    ["an unknown variant", { ...saved, boardSide: "W" }],
    ["an off-board cell", { boardSide: "V", cells: [{ id: "z", stack: ["y"] }] }],
    ["a duplicate cell", { boardSide: "V", cells: [saved.cells[1], saved.cells[1]] }],
    ["an empty stack", { boardSide: "V", cells: [{ id: "a", stack: [] }] }],
    ["a non-string token", { boardSide: "V", cells: [{ id: "a", stack: [1] }] }],
    ["an unknown token", { boardSide: "V", cells: [{ id: "a", stack: ["z"] }] }],
    ["an illegal stack", { boardSide: "V", cells: [{ id: "a", stack: ["y", "y"] }] }],
    ["a stack not among the choices", { boardSide: "V", cells: [{ id: "a", stack: ["y", "x"] }] }],
  ])("rejects %s", (_name, raw) => {
    expect(validateSavedBoard(raw, fakeBoard)).toBeNull();
  });
});
