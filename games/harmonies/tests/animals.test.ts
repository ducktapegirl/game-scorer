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

  it("every card has a valid color", () => {
    const colors = new Set(["Gray", "Yellow", "Blue", "Red", "Green"]);
    for (const card of ANIMAL_CARDS) {
      expect(colors.has(card.color)).toBe(true);
    }
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
    // Bat (track [3, 6, 10, 15]): 2 cubes = track[1] = 6
    // Mouse (track [5, 10, 17]): 1 cube = track[0] = 5
    const result = scoreAnimals([
      { id: "ani_001", count: 2 }, // Bat: track[1] = 6
      { id: "ani_023", count: 1 }, // Mouse: track[0] = 5
    ]);
    expect(result.points).toBe(11); // 6 + 5
  });

  it("scoreAnimals spot-checks transcribed track values", () => {
    // Ladybug (ani_008) is the only 5-cube card: track [2, 5, 8, 12, 17]
    expect(scoreAnimals([{ id: "ani_008", count: 5 }]).points).toBe(17);
    expect(scoreAnimals([{ id: "ani_008", count: 3 }]).points).toBe(8);
    // Bee (ani_032): track [8, 18]
    expect(scoreAnimals([{ id: "ani_032", count: 2 }]).points).toBe(18);
    // Kookaburra (ani_029): track [5, 11, 18]
    expect(scoreAnimals([{ id: "ani_029", count: 3 }]).points).toBe(18);
  });

  it("scoreAnimals throws on unknown card id", () => {
    expect(() => scoreAnimals([{ id: "unknown", count: 1 }])).toThrow(/Unknown animal card/);
  });

  it("scoreAnimals throws on out-of-range cube count", () => {
    // Macaque (ani_005) has track length 2, so max cubes = 2
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
