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

  it("Owl: h1 tree +3, h2 tree +3, h3 tree +1; base trees unchanged", () => {
    // h1 bush (base 1), h2 tree (base 3), h3 tree (base 7): base total = 11
    const board = boardWith("A", [
      [0, 0, "green"], // h1
      [1, 0, "brown", "green"], // h2
      [2, 0, "brown", "brown", "green"], // h3
    ]);
    const base = score(board, { spirit: "none", animalCards: [] });
    const { spirit, modifiedBreakdown } = applySpirit("spi_001", board, base.categories);

    expect(modifiedBreakdown.find((c) => c.id === "trees")!.points).toBe(11); // base unchanged
    expect(spirit.points).toBe(7); // 3 (h1) + 3 (h2) + 1 (h3)
  });

  it("Lion: +2 per group of 1-2 yellows, +10 per group of 3+", () => {
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

  it("Butterfly: +5 per group of 1+ yellows, including singles", () => {
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

  it("Dragonfly: +7 per group of 2+ blues; a lone blue scores 0", () => {
    // Group of 2 blues + 1 isolated blue: only the group of 2 qualifies.
    const board = boardWith("A", [
      [0, 0, "blue"],
      [1, 0, "blue"],
      [3, 0, "blue"], // isolated, group size 1
    ]);
    const { spirit } = applySpirit("spi_004", board, score(board, { spirit: "none", animalCards: [] }).categories);
    expect(spirit.points).toBe(7); // one qualifying group of 2
  });

  it("Deer: h2 tree +4, h3 tree +3; h1 bushes earn nothing", () => {
    const board = boardWith("A", [
      [0, 0, "green"], // h1, no bonus
      [1, 0, "brown", "green"], // h2
      [2, 0, "brown", "brown", "green"], // h3
    ]);
    const { spirit } = applySpirit("spi_005", board, score(board, { spirit: "none", animalCards: [] }).categories);
    expect(spirit.points).toBe(7); // 4 (h2) + 3 (h3)
  });

  it("Ram: h2 and h3 mountains both +4; h1 grays earn nothing", () => {
    const board = boardWith("A", [
      [0, 0, "gray"], // h1, no bonus
      [1, 0, "gray", "gray"], // h2
      [2, 0, "gray", "gray", "gray"], // h3
    ]);
    const { spirit } = applySpirit("spi_006", board, score(board, { spirit: "none", animalCards: [] }).categories);
    expect(spirit.points).toBe(8); // 4 (h2) + 4 (h3)
  });

  it("Stork: +6 per group of 2+ buildings; a lone building scores 0", () => {
    const board = boardWith("A", [
      [0, 0, "brown", "red"],
      [1, 0, "brown", "red"], // adjacent to (0,0): group of 2
      [3, 0, "brown", "red"], // isolated
    ]);
    const { spirit } = applySpirit("spi_007", board, score(board, { spirit: "none", animalCards: [] }).categories);
    expect(spirit.points).toBe(6); // one qualifying group of 2
  });

  it("Cat: +4 per group of 1+ buildings, including a lone building", () => {
    const board = boardWith("A", [
      [0, 0, "brown", "red"], // isolated: its own group
      [3, 0, "brown", "red"], // adjacent to (3,1): forms a second group
      [3, 1, "brown", "red"],
    ]);
    const { spirit } = applySpirit("spi_008", board, score(board, { spirit: "none", animalCards: [] }).categories);
    expect(spirit.points).toBe(8); // 2 groups * 4 (isolated cell is its own group)
  });

  it("Turtle: +2 per blue token", () => {
    const board = boardWith("A", [
      [0, 0, "blue"],
      [1, 0, "blue"],
    ]);
    const { spirit } = applySpirit("spi_009", board, score(board, { spirit: "none", animalCards: [] }).categories);
    expect(spirit.points).toBe(4); // 2 blues * 2
  });

  it("Beaver: h1 building +3, h2 building +3; does not touch animal card points", () => {
    // A "building" here is any red-topped stack, not just ones on a base
    // (h1 red-on-ground normally isn't a base-game building, but Beaver
    // counts it, same as Lion counting lone yellows the base rule ignores).
    const board = boardWith("A", [
      [0, 0, "red"], // h1
      [1, 0, "brown", "red"], // h2
    ]);
    const breakdown = score(board, {
      spirit: "spi_010",
      animalCards: [{ id: "ani_001", count: 2 }], // Bat: track[1] = 6 points
    });

    const spirit = breakdown.categories.find((c) => c.id === "spirit")!;
    const animals = breakdown.categories.find((c) => c.id === "animals")!;

    expect(spirit.points).toBe(6); // 3 (h1) + 3 (h2)
    expect(animals.points).toBe(6); // animal cards untouched
  });

  it("spirit unknown id throws", () => {
    const board = boardWith("A", []);
    expect(() => applySpirit("unknown_spirit", board, [])).toThrow(/Unknown spirit card/);
  });

  it("total always equals sum of all category points including spirit", () => {
    const configs = [
      { spirit: "none", animalCards: [] },
      { spirit: "spi_001", animalCards: [] },
      { spirit: "spi_002", animalCards: [] },
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
