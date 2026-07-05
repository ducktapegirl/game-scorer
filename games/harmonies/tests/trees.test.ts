import { categoryCells, points, scoreBoard } from "./helpers";

describe("trees", () => {
  it("a lone bush (height 1) scores 1", () => {
    expect(points(scoreBoard("A", [[0, 0, "green"]]), "trees")).toBe(1);
  });

  it("green on 1 brown (height 2) scores 3", () => {
    expect(points(scoreBoard("A", [[0, 0, "brown", "green"]]), "trees")).toBe(3);
  });

  it("green on 2 brown (height 3) scores 7", () => {
    expect(points(scoreBoard("A", [[0, 0, "brown", "brown", "green"]]), "trees")).toBe(7);
  });

  it("brown-only stacks score 0", () => {
    const breakdown = scoreBoard("A", [
      [0, 0, "brown"],
      [0, 2, "brown", "brown"],
    ]);
    expect(points(breakdown, "trees")).toBe(0);
    expect(categoryCells(breakdown, "trees")).toEqual([]);
  });

  it("multiple trees sum and are all listed as contributing cells", () => {
    const breakdown = scoreBoard("A", [
      [0, 0, "green"],
      [2, 1, "brown", "green"],
      [4, 0, "brown", "brown", "green"],
    ]);
    expect(points(breakdown, "trees")).toBe(1 + 3 + 7);
    expect(categoryCells(breakdown, "trees")).toEqual(["0,0", "2,1", "4,0"]);
  });
});
