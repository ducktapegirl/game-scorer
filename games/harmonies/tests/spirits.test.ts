import { describe, expect, it } from "vitest";
import { SPIRIT_CARDS, applySpirit } from "../spirits";
import { boardWith } from "./helpers";
import { score } from "../rules";

describe("Spirit Cards", () => {
  it("has exactly 10 unique spirits", () => {
    expect(SPIRIT_CARDS).toHaveLength(10);
    const ids = new Set(SPIRIT_CARDS.map((c) => c.id));
    expect(ids.size).toBe(10);
  });

  it('applySpirit("none") returns unchanged breakdown with spirit=0', () => {
    const board = boardWith("A", [[0, 0, "green"]]);
    const base = score(board, { spirit: "none", animalCards: [] });
    const { spirit, modifiedBreakdown } = applySpirit("none", board, base.categories);
    expect(spirit.points).toBe(0);
    expect(modifiedBreakdown).toEqual(base.categories);
  });

  it("Owl (additive): spirit adds +3 per bush, base trees unchanged", () => {
    // Two bushes (single h1 greens) normally score 1+1=2 trees.
    // Owl adds +3 per bush = +6 spirit bonus (on top of base 2).
    const board = boardWith("A", [
      [0, 0, "green"],
      [1, 0, "green"],
    ]);
    const base = score(board, { spirit: "none", animalCards: [] });
    const { spirit, modifiedBreakdown } = applySpirit("spi_001", board, base.categories);

    expect(modifiedBreakdown.find((c) => c.id === "trees")!.points).toBe(2); // base unchanged
    expect(spirit.points).toBe(6); // +3 per bush
  });

  it("Lion (additive): adds +2 per 1-2 yellows, +10 per 3+ per group", () => {
    // Three yellows in a group (touching): base rule = 5
    // Lion adds +10 (group of 3+) on top of the base 5.
    const board = boardWith("A", [
      [0, 3, "yellow"],
      [0, 4, "yellow"],
      [1, 2, "yellow"],
    ]);
    const base = score(board, { spirit: "none", animalCards: [] });
    const { spirit, modifiedBreakdown } = applySpirit("spi_002", board, base.categories);

    const fieldsAfter = modifiedBreakdown.find((c) => c.id === "fields")!;
    expect(fieldsAfter.points).toBe(5); // base unchanged
    expect(spirit.points).toBe(10); // Lion: 3+ yellows = +10
  });

  it("Butterfly (additive): adds +5 per field including singles", () => {
    // Two groups: (0,0)-(1,0) pair and (3,0)-(3,1)-(4,0) connected triple
    // Base rule = 5 + 5 = 10 (only groups of 2+)
    // Butterfly adds 5 per group (even singles) = 2 groups * 5 = +10
    const board = boardWith("A", [
      [0, 0, "yellow"],
      [1, 0, "yellow"],
      [3, 0, "yellow"],
      [3, 1, "yellow"],
      [4, 0, "yellow"],
    ]);
    const base = score(board, { spirit: "none", animalCards: [] });
    const { spirit, modifiedBreakdown } = applySpirit("spi_003", board, base.categories);

    const fieldsAfter = modifiedBreakdown.find((c) => c.id === "fields")!;
    expect(fieldsAfter.points).toBe(10); // base unchanged: 5 + 5
    expect(spirit.points).toBe(10); // +5 per group (2 groups)
  });

  it("Heron (additive): adds +1 per mountain, no adjacency required", () => {
    // Three grays, all adjacent: base = 1 + 1 + 3 = 5
    // Heron adds +1 per gray (no adjacency check) = +3 on top of base 5.
    const board = boardWith("A", [
      [0, 0, "gray"],
      [1, 0, "gray"],
      [1, 1, "gray", "gray"], // h2
    ]);
    const base = score(board, { spirit: "none", animalCards: [] });
    const { spirit, modifiedBreakdown } = applySpirit("spi_006", board, base.categories);

    const mountainsAfter = modifiedBreakdown.find((c) => c.id === "mountains")!;
    expect(mountainsAfter.points).toBe(5); // base unchanged
    expect(spirit.points).toBe(3); // +1 per mountain cell (3 cells)
  });

  it("Badger (additive): adds +3 per tree, and does not touch animal card points", () => {
    // Two trees of different heights: base = 1 (bush) + 7 (h3) = 8.
    // Badger adds +3 per tree = +6 on top of base 8.
    // Animal card points must survive (regression guard).
    const board = boardWith("A", [
      [0, 0, "green"], // bush, base 1
      [1, 0, "brown", "brown", "green"], // h3 tree, base 7
    ]);
    const breakdown = score(board, {
      spirit: "spi_010",
      animalCards: [{ id: "ani_001", count: 2 }], // Bat: track[1] = 6 points
    });

    const trees = breakdown.categories.find((c) => c.id === "trees")!;
    const spirit = breakdown.categories.find((c) => c.id === "spirit")!;
    const animals = breakdown.categories.find((c) => c.id === "animals")!;

    expect(trees.points).toBe(8); // base unchanged: 1 + 7
    expect(spirit.points).toBe(6); // +3 per tree (2 trees)
    expect(animals.points).toBe(3); // animal cards untouched
    expect(breakdown.total).toBe(17); // 8 + 6 + 3
  });

  it("spirit unknown id throws", () => {
    const board = boardWith("A", []);
    expect(() => applySpirit("unknown_spirit", board, [])).toThrow(/Unknown spirit card/);
  });

  it("total always equals sum of all category points including spirit", () => {
    const configs = [
      { spirit: "none", animalCards: [] },
      { spirit: "spi_001", animalCards: [] }, // Owl additive
      { spirit: "spi_002", animalCards: [] }, // Lion additive
    ];
    const board = boardWith("A", [
      [0, 0, "green"],
      [0, 3, "yellow"],
      [0, 4, "yellow"],
    ]);
    for (const config of configs) {
      const breakdown = score(board, config);
      const sum = breakdown.categories.reduce((acc, c) => acc + c.points, 0);
      expect(breakdown.total).toBe(sum);
    }
  });
});
