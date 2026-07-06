import { describe, expect, it } from "vitest";
import { ANIMAL_CARDS, scoreAnimals } from "../animals";

describe("Animal Cards", () => {
  it("has exactly 32 unique cards", () => {
    expect(ANIMAL_CARDS).toHaveLength(32);
    const ids = new Set(ANIMAL_CARDS.map((c) => c.id));
    expect(ids.size).toBe(32);
  });

  it("every card has a non-empty, strictly ascending track", () => {
    for (const card of ANIMAL_CARDS) {
      expect(card.track.length).toBeGreaterThan(0);
      for (let i = 1; i < card.track.length; i++) {
        expect(card.track[i]!).toBeGreaterThan(card.track[i - 1]!);
      }
    }
  });

  it("all card names are unique", () => {
    const names = ANIMAL_CARDS.map((c) => c.name);
    expect(new Set(names).size).toBe(32);
  });

  it("scoreAnimals(0 cubes) = 0", () => {
    const result = scoreAnimals([]);
    expect(result.points).toBe(0);
    expect(result.cells).toEqual([]);
  });

  it("scoreAnimals returns empty cells array (animals score from cards, not board)", () => {
    const result = scoreAnimals([
      { id: "ani_001", count: 1 },
      { id: "ani_023", count: 2 },
    ]);
    expect(result.cells).toEqual([]);
  });

  it("scoreAnimals scores cards correctly", () => {
    // Ant (track [1, 3, 5]): 1 cube = 1, 2 cubes = 3, 0 cubes = 0
    // Meerkat (track [1, 4, 6]): 1 cube = 1
    const result = scoreAnimals([
      { id: "ani_001", count: 2 }, // Ant: track[1] = 3
      { id: "ani_023", count: 1 }, // Meerkat: track[0] = 1
    ]);
    expect(result.points).toBe(4); // 3 + 1
  });

  it("scoreAnimals throws on unknown card id", () => {
    expect(() => scoreAnimals([{ id: "unknown", count: 1 }])).toThrow(/Unknown animal card/);
  });

  it("scoreAnimals throws on out-of-range cube count", () => {
    // Butterfly has track length 2, so max cubes = 2
    expect(() => scoreAnimals([{ id: "ani_005", count: 3 }])).toThrow(/out of range/);
    expect(() => scoreAnimals([{ id: "ani_005", count: -1 }])).toThrow(/out of range/);
  });

  it("scoreAnimals throws on duplicate card entries", () => {
    expect(() =>
      scoreAnimals([
        { id: "ani_001", count: 1 },
        { id: "ani_001", count: 2 },
      ]),
    ).toThrow(/Duplicate animal card/);
  });
});
