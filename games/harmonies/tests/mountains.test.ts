import { categoryCells, points, scoreBoard } from "./helpers";

describe("mountains", () => {
  it("a lone gray stack scores 0 regardless of height", () => {
    expect(points(scoreBoard("A", [[2, 1, "gray", "gray", "gray"]]), "mountains")).toBe(0);
  });

  it("two adjacent height-1 grays score 1 each", () => {
    const breakdown = scoreBoard("A", [
      [0, 0, "gray"],
      [0, 1, "gray"],
    ]);
    expect(points(breakdown, "mountains")).toBe(2);
    expect(categoryCells(breakdown, "mountains")).toEqual(["0,0", "0,1"]);
  });

  it("a lone height-1 gray both scores and satisfies its neighbor's adjacency (flagged edge case)", () => {
    const breakdown = scoreBoard("A", [
      [0, 0, "gray"],
      [0, 1, "gray", "gray", "gray"],
    ]);
    expect(points(breakdown, "mountains")).toBe(1 + 7);
  });

  it("two grays that are not adjacent both score 0", () => {
    expect(
      points(
        scoreBoard("A", [
          [0, 0, "gray"],
          [2, 1, "gray"],
        ]),
        "mountains",
      ),
    ).toBe(0);
  });

  it("a gray adjacent only to non-gray tokens scores 0", () => {
    expect(
      points(
        scoreBoard("A", [
          [0, 0, "gray"],
          [0, 1, "brown", "green"],
          [1, 0, "blue"],
        ]),
        "mountains",
      ),
    ).toBe(0);
  });

  it("height 2 scores 3 when adjacent to a mountain", () => {
    expect(
      points(
        scoreBoard("A", [
          [0, 0, "gray", "gray"],
          [0, 1, "gray"],
        ]),
        "mountains",
      ),
    ).toBe(3 + 1);
  });
});
