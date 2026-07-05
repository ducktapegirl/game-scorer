import { cellId, topology, validateStack } from "../topology";
import type { TokenColor } from "../tokens";

describe("board topology", () => {
  it("side A has exactly 23 cells (columns 5-4-5-4-5)", () => {
    expect(topology("A").cells).toHaveLength(23);
  });

  it("side B has exactly 25 cells (columns 4-3-4-3-4-3-4)", () => {
    expect(topology("B").cells).toHaveLength(25);
  });

  it.each(["A", "B"] as const)("side %s adjacency is symmetric, valid, and ≤6", (side) => {
    const topo = topology(side);
    const valid = new Set(topo.cells);
    for (const cell of topo.cells) {
      const neighbors = topo.neighbors(cell);
      expect(neighbors.length).toBeLessThanOrEqual(6);
      expect(new Set(neighbors).size).toBe(neighbors.length);
      for (const n of neighbors) {
        expect(valid.has(n)).toBe(true);
        expect(topo.neighbors(n)).toContain(cell);
      }
    }
  });

  it("an interior side-A cell has 6 neighbors", () => {
    expect(new Set(topology("A").neighbors(cellId(2, 1)))).toEqual(
      new Set([cellId(3, 1), cellId(3, 0), cellId(2, 0), cellId(1, 1), cellId(1, 2), cellId(2, 2)]),
    );
  });

  it("corner cells have 2 neighbors", () => {
    expect(new Set(topology("A").neighbors(cellId(0, 0)))).toEqual(
      new Set([cellId(1, 0), cellId(0, 1)]),
    );
    expect(new Set(topology("B").neighbors(cellId(6, 0)))).toEqual(
      new Set([cellId(6, -1), cellId(5, 0)]),
    );
  });

  it("unknown cells have no neighbors", () => {
    expect(topology("A").neighbors("99,99")).toEqual([]);
  });
});

describe("validateStack", () => {
  const valid: TokenColor[][] = [
    [],
    ["blue"],
    ["yellow"],
    ["gray"],
    ["gray", "gray"],
    ["gray", "gray", "gray"],
    ["brown"],
    ["brown", "brown"],
    ["green"],
    ["brown", "green"],
    ["brown", "brown", "green"],
    ["brown", "red"],
    ["gray", "red"],
    ["red", "red"],
    ["red"], // legal placement, but not a "building" — see rules.ts
  ];

  const invalid: TokenColor[][] = [
    ["green", "green"], // green never on green
    ["brown", "brown", "brown"], // max 2 brown
    ["blue", "green"], // nothing on blue
    ["yellow", "red"], // nothing on yellow
    ["brown", "brown", "red"], // red is never the 3rd token
    ["red", "red", "red"],
    ["gray", "gray", "gray", "gray"], // max height 3
    ["gray", "brown"], // brown on brown only
    ["brown", "gray"], // gray on gray only
    ["green", "brown"], // nothing on green
  ];

  it.each(valid)("accepts [%s]", (...stack) => {
    expect(validateStack(stack)).toBe(true);
  });

  it.each(invalid)("rejects [%s]", (...stack) => {
    expect(validateStack(stack)).toBe(false);
  });
});
