import { categoryCells, points, scoreBoard } from "./helpers";

// (2,1) is an interior side-A cell whose neighbors are
// (3,1) (3,0) (2,0) (1,1) (1,2) (2,2).
describe("buildings", () => {
  it("scores 5 when neighbor tops show 3 different colors", () => {
    const breakdown = scoreBoard("A", [
      [2, 1, "brown", "red"],
      [3, 1, "blue"],
      [3, 0, "gray"],
      [2, 0, "green"],
    ]);
    expect(points(breakdown, "buildings")).toBe(5);
    expect(categoryCells(breakdown, "buildings")).toEqual(["2,1"]);
  });

  it("scores 0 with exactly 2 neighbor colors", () => {
    expect(
      points(
        scoreBoard("A", [
          [2, 1, "brown", "red"],
          [3, 1, "blue"],
          [3, 0, "blue"],
          [2, 0, "gray"],
        ]),
        "buildings",
      ),
    ).toBe(0);
  });

  it("a neighboring red counts as one of the 3 colors", () => {
    expect(
      points(
        scoreBoard("A", [
          [2, 1, "brown", "red"],
          [3, 1, "gray", "red"],
          [3, 0, "blue"],
          [2, 0, "yellow"],
        ]),
        "buildings",
      ),
    ).toBe(5 + 0); // (3,1) itself is a building with only 2 neighbor colors
  });

  it("only the top token of each neighbor counts", () => {
    // (3,1) and (2,0) hide brown under green; brown must not count as a color.
    expect(
      points(
        scoreBoard("A", [
          [2, 1, "brown", "red"],
          [3, 1, "brown", "green"],
          [3, 0, "blue"],
          [2, 0, "brown", "green"],
        ]),
        "buildings",
      ),
    ).toBe(0);
  });

  it("empty neighbors contribute no color", () => {
    expect(points(scoreBoard("A", [[2, 1, "brown", "red"]]), "buildings")).toBe(0);
  });

  it("a 2-neighbor corner building can never reach 3 colors", () => {
    expect(
      points(
        scoreBoard("A", [
          [0, 0, "gray", "red"],
          [1, 0, "blue"],
          [0, 1, "green"],
        ]),
        "buildings",
      ),
    ).toBe(0);
  });

  it("multiple buildings score independently", () => {
    const breakdown = scoreBoard("A", [
      [2, 1, "brown", "red"],
      [3, 1, "blue"],
      [3, 0, "gray"],
      [2, 0, "green"],
      [0, 0, "gray", "red"], // corner: at most 2 neighbor colors, scores 0
      [1, 0, "yellow"],
      [0, 1, "yellow"],
    ]);
    expect(points(breakdown, "buildings")).toBe(5);
    expect(categoryCells(breakdown, "buildings")).toEqual(["2,1"]);
  });
});
