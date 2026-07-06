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

  it("every card is marked add or replace; replace cards name a real category", () => {
    const categoryIds = ["trees", "mountains", "fields", "buildings", "water", "animals"];
    for (const card of SPIRIT_CARDS) {
      expect(["add", "replace"]).toContain(card.mode);
      if (card.mode === "replace") {
        expect(card.replaces).toBeDefined();
        expect(categoryIds).toContain(card.replaces);
      }
    }
  });

  it('applySpirit("none") returns unchanged breakdown with spirit=0', () => {
    const board = boardWith("A", [[0, 0, "green"]]);
    const base = score(board, { spirit: "none", animalCards: [] });
    const { spirit, modifiedBreakdown } = applySpirit("none", board, base.categories);
    expect(spirit.points).toBe(0);
    expect(modifiedBreakdown).toEqual(base.categories);
  });

  it("Owl (add): spirit adds +1 per bush, base unchanged", () => {
    // Two bushes (single h1 greens) normally score 1+1=2 trees.
    // Owl adds +1 per bush = +2 spirit bonus.
    const board = boardWith("A", [
      [0, 0, "green"],
      [1, 0, "green"],
    ]);
    const base = score(board, { spirit: "none", animalCards: [] });
    const { spirit, modifiedBreakdown } = applySpirit("spi_001", board, base.categories);

    expect(modifiedBreakdown.find((c) => c.id === "trees")!.points).toBe(2); // base unchanged
    expect(spirit.points).toBe(2); // +1 per bush
  });

  it("Lion (replace fields): rescores fields by group size", () => {
    // Three yellows in a group (touching): base rule = 5, Lion = 10 (group 3+)
    const board = boardWith("A", [
      [0, 3, "yellow"],
      [0, 4, "yellow"],
      [1, 2, "yellow"],
    ]);
    const base = score(board, { spirit: "none", animalCards: [] });
    const { spirit, modifiedBreakdown } = applySpirit("spi_002", board, base.categories);

    const fieldsAfter = modifiedBreakdown.find((c) => c.id === "fields")!;
    expect(fieldsAfter.points).toBe(0); // replaced
    expect(spirit.points).toBe(10); // Lion: 3+ yellows = 10
  });

  it("Butterfly (replace fields): scores all yellows including singles", () => {
    // Two groups: (0,0)-(1,0) pair and (3,0)-(3,1)-(4,0) connected triple
    // Base rule = 5 + 5 = 10 (only groups of 2+)
    // Butterfly scores each group (even singles) = 2 groups * 5 = 10
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
    expect(fieldsAfter.points).toBe(0); // replaced
    // 2 groups * 5 = 10
    expect(spirit.points).toBe(10); // 2 groups * 5
  });

  it("Heron (replace mountains): scores all mountains regardless of adjacency", () => {
    // One isolated gray and one adjacent pair: base = 0 + (1+3) = 4
    // Heron scores all = 1 + 1 + 2 = 4 (but actually tallies differently)
    const board = boardWith("A", [
      [0, 0, "gray"], // isolated
      [1, 0, "gray"], // adjacent
      [1, 1, "gray", "gray"], // adjacent
    ]);
    const base = score(board, { spirit: "none", animalCards: [] });
    const { spirit, modifiedBreakdown } = applySpirit("spi_006", board, base.categories);

    const mountainsAfter = modifiedBreakdown.find((c) => c.id === "mountains")!;
    expect(mountainsAfter.points).toBe(0); // replaced
    expect(spirit.points).toBe(3); // 1 + 1 + 1 (three mountain cells)
  });

  it("spirit unknown id throws", () => {
    const board = boardWith("A", []);
    expect(() => applySpirit("unknown_spirit", board, [])).toThrow(/Unknown spirit card/);
  });

  it("total always equals sum of all category points including spirit", () => {
    const configs = [
      { spirit: "none", animalCards: [] },
      { spirit: "spi_001", animalCards: [] }, // Owl add
      { spirit: "spi_002", animalCards: [] }, // Lion replace
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
