import { describe, expect, it } from "vitest";
import { ANIMAL_CARDS } from "../animals";
import { harmoniesConfigSchema } from "../config";

describe("harmoniesConfigSchema", () => {
  const animalField = harmoniesConfigSchema.find((f) => f.id === "animalCards");

  it("lists animal cards alphabetically by name with the color in parentheses", () => {
    expect(animalField?.type).toBe("counterList");
    const items = (animalField as Extract<typeof animalField, { type: "counterList" }>).items;

    // Same cards, no drops or dupes.
    expect(items).toHaveLength(ANIMAL_CARDS.length);
    expect(new Set(items.map((i) => i.id)).size).toBe(ANIMAL_CARDS.length);

    // Alphabetical by animal name.
    const names = [...ANIMAL_CARDS].map((c) => c.name).sort((a, b) => a.localeCompare(b));
    const byId = new Map(ANIMAL_CARDS.map((c) => [c.id, c]));
    const labels = items.map((i) => i.label);
    expect(items.map((i) => byId.get(i.id)!.name)).toEqual(names);

    // Label is "Name (Color)"; first alphabetically is Alligator (Blue).
    expect(labels[0]).toBe("Alligator (Blue)");
    for (const item of items) {
      const card = byId.get(item.id)!;
      expect(item.label).toBe(`${card.name} (${card.color})`);
      expect(item.max).toBe(card.track.length);
    }
  });
});
