// Animal card catalog and scoring.
// Card data from planning/harmonies-cards-reference.md.

import type { ScoreCategory } from "../../core/types";
import type { HarmoniesConfig } from "./config";

// The color band on the physical card. Not used for scoring; carried for the UI
// (shown in the card picker) and to match the physical cards.
export type AnimalColor = "Gray" | "Yellow" | "Blue" | "Red" | "Green";

export interface AnimalCard {
  id: string;
  name: string;
  color: AnimalColor;
  track: number[]; // track[i] = points if i+1 cubes placed; 0 if 0 cubes
}

export const ANIMAL_CARDS: AnimalCard[] = [
  { id: "ani_001", name: "Bat", color: "Gray", track: [3, 6, 10, 15] },
  { id: "ani_002", name: "Fennec Fox", color: "Gray", track: [4, 9, 16] },
  { id: "ani_003", name: "Vulture", color: "Gray", track: [5, 11] },
  { id: "ani_004", name: "Meerkat", color: "Gray", track: [2, 5, 9, 14] },
  { id: "ani_005", name: "Macaque", color: "Gray", track: [5, 11] },
  { id: "ani_006", name: "Penguin", color: "Gray", track: [4, 10, 16] },
  { id: "ani_007", name: "Arctic Fox", color: "Yellow", track: [5, 10, 17] },
  { id: "ani_008", name: "Ladybug", color: "Yellow", track: [2, 5, 8, 12, 17] },
  { id: "ani_009", name: "Llama", color: "Yellow", track: [5, 12] },
  { id: "ani_010", name: "Raccoon", color: "Yellow", track: [6, 12] },
  { id: "ani_011", name: "Crow", color: "Yellow", track: [4, 9] },
  { id: "ani_012", name: "Panther", color: "Yellow", track: [5, 11] },
  { id: "ani_013", name: "Otter", color: "Blue", track: [5, 10, 16] },
  { id: "ani_014", name: "Frog", color: "Blue", track: [2, 4, 6, 10, 15] },
  { id: "ani_015", name: "Alligator", color: "Blue", track: [4, 9, 15] },
  { id: "ani_016", name: "Stingray", color: "Blue", track: [4, 10, 16] },
  { id: "ani_017", name: "Fish", color: "Blue", track: [3, 6, 10, 16] },
  { id: "ani_018", name: "Flamingo", color: "Blue", track: [4, 10, 16] },
  { id: "ani_019", name: "Duck", color: "Blue", track: [2, 4, 8, 13] },
  { id: "ani_020", name: "Gecko", color: "Red", track: [5, 10, 16] },
  { id: "ani_021", name: "Hedgehog", color: "Red", track: [5, 12] },
  { id: "ani_022", name: "Peacock", color: "Red", track: [5, 10, 17] },
  { id: "ani_023", name: "Mouse", color: "Red", track: [5, 10, 17] },
  { id: "ani_024", name: "Squirrel", color: "Red", track: [4, 9, 15] },
  { id: "ani_025", name: "Wolf", color: "Green", track: [4, 10, 16] },
  { id: "ani_026", name: "Rabbit", color: "Green", track: [5, 10, 17] },
  { id: "ani_027", name: "Warthog", color: "Green", track: [4, 8, 13] },
  { id: "ani_028", name: "Koala", color: "Green", track: [3, 6, 10, 15] },
  { id: "ani_029", name: "Kookaburra", color: "Green", track: [5, 11, 18] },
  { id: "ani_030", name: "Macaw", color: "Green", track: [4, 9, 14] },
  { id: "ani_031", name: "Bear", color: "Green", track: [5, 11] },
  { id: "ani_032", name: "Bee", color: "Green", track: [8, 18] },
];

export function scoreAnimals(entries: HarmoniesConfig["animalCards"]): ScoreCategory {
  const catalog = new Map(ANIMAL_CARDS.map((c) => [c.id, c]));
  const seen = new Set<string>();
  let points = 0;

  for (const entry of entries) {
    const card = catalog.get(entry.id);
    if (!card) throw new Error(`Unknown animal card: ${entry.id}`);
    if (seen.has(entry.id)) {
      throw new Error(`Duplicate animal card entry: ${entry.id}`);
    }
    seen.add(entry.id);
    if (entry.count < 0 || entry.count > card.track.length) {
      throw new Error(`Animal card ${entry.id}: cubes out of range [0, ${card.track.length}]`);
    }
    if (entry.count > 0) {
      points += card.track[entry.count - 1]!;
    }
  }

  return {
    id: "animals",
    label: "Animals",
    points,
    cells: [], // animals score from cards, not board cells
  };
}
