import { score } from "../rules";
import { boardWith, categoryCells, points, scoreBoard } from "./helpers";
import type { Placement } from "./helpers";

const CATEGORY_IDS = ["trees", "mountains", "fields", "buildings", "water", "animals", "spirit"];

describe("score() integration", () => {
  it("scores a full side-A board across every category", () => {
    const breakdown = scoreBoard("A", [
      // Trees: 1 + 7 + 1 = 9
      [0, 0, "green"],
      [1, 0, "brown", "brown", "green"],
      [1, 1, "green"],
      // Mountains: adjacent pair, heights 1 + 2 = 1 + 3 = 4
      [4, -2, "gray"],
      [4, -1, "gray", "gray"],
      // Fields: one group of 3 ((1,2) touches (0,3)) = 5
      [0, 3, "yellow"],
      [0, 4, "yellow"],
      [1, 2, "yellow"],
      // Building at (2,1): neighbor tops blue/blue/blue/green/yellow = 3 colors = 5
      [2, 1, "brown", "red"],
      // River of 3 = 5
      [2, 0, "blue"],
      [3, 0, "blue"],
      [3, 1, "blue"],
    ]);

    expect(points(breakdown, "trees")).toBe(9);
    expect(points(breakdown, "mountains")).toBe(4);
    expect(points(breakdown, "fields")).toBe(5);
    expect(points(breakdown, "buildings")).toBe(5);
    expect(points(breakdown, "water")).toBe(5);
    expect(points(breakdown, "animals")).toBe(0);
    expect(points(breakdown, "spirit")).toBe(0);
    expect(breakdown.total).toBe(28);

    expect(categoryCells(breakdown, "fields")).toEqual(["0,3", "0,4", "1,2"]);
    expect(categoryCells(breakdown, "water")).toEqual(["2,0", "3,0", "3,1"]);
  });

  it("boardSide selects the water rule; other categories are unaffected", () => {
    // These cells are valid on both sides. The two blues are adjacent (a
    // length-2 river) and together they cut off the (0,0) corner on side B.
    const placements: Placement[] = [
      [0, 1, "blue"],
      [1, 0, "blue"],
      [2, 0, "brown", "green"],
    ];
    const sideA = scoreBoard("A", placements);
    const sideB = scoreBoard("B", placements);

    expect(points(sideA, "water")).toBe(2); // river of 2
    expect(points(sideB, "water")).toBe(10); // 2 islands
    expect(points(sideA, "trees")).toBe(3);
    expect(points(sideB, "trees")).toBe(3);
    for (const id of ["mountains", "fields", "buildings"]) {
      expect(points(sideA, id)).toBe(0);
      expect(points(sideB, id)).toBe(0);
    }
  });

  it("always returns all 7 categories and total = sum of points", () => {
    for (const breakdown of [
      scoreBoard("A", []),
      scoreBoard("B", [[0, 0, "gray"]]),
      scoreBoard("A", [
        [0, 0, "yellow"],
        [0, 1, "yellow"],
      ]),
    ]) {
      expect(breakdown.categories.map((c) => c.id)).toEqual(CATEGORY_IDS);
      const sum = breakdown.categories.reduce((acc, c) => acc + c.points, 0);
      expect(breakdown.total).toBe(sum);
    }
  });

  it("accepts a config but scores animals and spirit as 0 until M3", () => {
    const breakdown = score(boardWith("A", [[0, 0, "green"]]), {
      spirit: "some-spirit",
      animalCards: [{ cardId: "some-card", cubesPlaced: 2 }],
    });
    expect(points(breakdown, "animals")).toBe(0);
    expect(points(breakdown, "spirit")).toBe(0);
    expect(breakdown.total).toBe(1);
  });

  it("rejects cells that are not on the chosen board side", () => {
    // (0,4) exists on side A (column of 5) but not on side B (column of 4).
    expect(() =>
      score(
        { boardSide: "B", cells: [{ id: "0,4", stack: ["green"] }] },
        { spirit: "none", animalCards: [] },
      ),
    ).toThrow(/0,4/);
  });
});
