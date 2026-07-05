import { categoryCells, points, scoreBoard } from "./helpers";
import type { Placement } from "./helpers";

function river(...cells: [number, number][]): Placement[] {
  return cells.map(([q, r]): Placement => [q, r, "blue"]);
}

describe("water on side A (river)", () => {
  it("no water scores 0", () => {
    expect(points(scoreBoard("A", []), "water")).toBe(0);
  });

  it("a single blue token scores 0", () => {
    expect(points(scoreBoard("A", river([0, 0])), "water")).toBe(0);
  });

  it.each([
    [2, 2, river([0, 0], [0, 1])],
    [3, 5, river([0, 0], [0, 1], [0, 2])],
    [4, 8, river([0, 0], [0, 1], [0, 2], [0, 3])],
    [5, 11, river([0, 0], [0, 1], [0, 2], [0, 3], [0, 4])],
    // A geodesic snake: consecutive cells adjacent, no shortcuts between others.
    [6, 15, river([0, 0], [0, 1], [1, 1], [1, 2], [2, 2], [2, 3])],
  ])("a straight river of length %i scores %i", (_length, expected, placements) => {
    expect(points(scoreBoard("A", placements), "water")).toBe(expected);
  });

  it("beyond length 6 each token adds 4: length 8 scores 23", () => {
    const snake = river([0, 0], [0, 1], [0, 2], [1, 2], [2, 1], [3, 1], [4, 0], [4, -1]);
    expect(points(scoreBoard("A", snake), "water")).toBe(15 + 4 * 2);
  });

  it("a branching river is measured end-to-end, not by token count (flagged edge case)", () => {
    // Y shape: center (2,1) with three 2-token arms — 7 tokens total, but the
    // longest end-to-end shortest path is only 5 tokens: 11 points, not the
    // 19 that counting all blue tokens would give.
    const y = river([2, 1], [2, 0], [2, -1], [1, 2], [0, 3], [3, 1], [4, 1]);
    expect(points(scoreBoard("A", y), "water")).toBe(11);
  });

  it("a looping river is measured by shortest paths through the loop", () => {
    // A 6-token ring around (2,1): opposite cells are 4 tokens apart along
    // the ring, so it scores 8, not the 15 a 6-token line would.
    const ring = river([3, 1], [3, 0], [2, 0], [1, 1], [1, 2], [2, 2]);
    expect(points(scoreBoard("A", ring), "water")).toBe(8);
  });

  it("only the single best river scores", () => {
    const breakdown = scoreBoard("A", [
      ...river([0, 0], [0, 1], [0, 2]), // length 3 → 5
      ...river([4, -2], [4, -1], [4, 0], [4, 1], [4, 2]), // length 5 → 11
    ]);
    expect(points(breakdown, "water")).toBe(11);
    expect(categoryCells(breakdown, "water")).toEqual(["4,-1", "4,-2", "4,0", "4,1", "4,2"]);
  });
});
