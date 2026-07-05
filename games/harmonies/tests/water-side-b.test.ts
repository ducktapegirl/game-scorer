import { points, scoreBoard } from "./helpers";
import type { Placement } from "./helpers";

function water(...cells: [number, number][]): Placement[] {
  return cells.map(([q, r]): Placement => [q, r, "blue"]);
}

describe("water on side B (islands)", () => {
  it("with no water the whole board is 1 island: 5 points", () => {
    expect(points(scoreBoard("B", [[0, 0, "green"]]), "water")).toBe(5);
  });

  it("an entirely empty board is still 1 island", () => {
    expect(points(scoreBoard("B", []), "water")).toBe(5);
  });

  it("a blue line dividing the board makes 2 islands: 10 points", () => {
    // Column q=3 is only 3 cells on side B; filling it with water separates
    // columns 0-2 from columns 4-6.
    expect(points(scoreBoard("B", water([3, -1], [3, 0], [3, 1])), "water")).toBe(10);
  });

  it("empty cells count as island land", () => {
    // Corner (0,0) has exactly two neighbors; both blue isolates it even
    // though it holds no token.
    expect(points(scoreBoard("B", water([0, 1], [1, 0])), "water")).toBe(10);
  });

  it("an enclosed pocket plus a divider makes 3 islands: 15 points", () => {
    const breakdown = scoreBoard("B", [
      // Ring enclosing (2,1)
      ...water([3, 1], [3, 0], [2, 0], [1, 1], [1, 2], [2, 2]),
      // Full column q=5 cutting off column 6
      ...water([5, -2], [5, -1], [5, 0]),
    ]);
    expect(points(breakdown, "water")).toBe(15);
  });
});
