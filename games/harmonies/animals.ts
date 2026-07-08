// Animal card catalog and scoring.
// Card data from planning/harmonies-cards-reference.md.

import type { ScoreCategory } from "../../core/types";
import type { HarmoniesConfig } from "./config";

export interface AnimalCard {
  id: string;
  name: string;
  track: number[]; // track[i] = points if i+1 cubes placed; 0 if 0 cubes
}

export const ANIMAL_CARDS: AnimalCard[] = [
  { id: "ani_001", name: "Bat", track: [3, 6, 10, 15] },
  { id: "ani_002", name: "Fennec Fox", track: [4, 9, 16] },
  { id: "ani_003", name: "Vulture", track: [5, 11] },
  { id: "ani_004", name: "Meerkat", track: [2, 5, 9, 14] },
  { id: "ani_005", name: "Macaque", track: [5, 11] },
  { id: "ani_006", name: "Penguin", track: [4, 10, 16] },
  { id: "ani_007", name: "Arctic Fox", track: [5, 10, 17] },
  { id: "ani_008", name: "Ladybug", track: [2, 5, 8, 12, 17] },
  { id: "ani_009", name: "Llama", track: [5, 12] },
  { id: "ani_010", name: "Raccoon", track: [6, 12] },
  { id: "ani_011", name: "Crow", track: [4, 9] },
  { id: "ani_012", name: "Panther", track: [5, 11] },
  { id: "ani_013", name: "Otter", track: [5, 10, 16] },
  { id: "ani_014", name: "Frog", track: [2, 4, 6, 10, 15] },
  { id: "ani_015", name: "Alligator", track: [4, 9, 15] },
  { id: "ani_016", name: "Stingray", track: [4, 10, 16] },
  { id: "ani_017", name: "Fish", track: [3, 6, 10, 16] },
  { id: "ani_018", name: "Flamingo", track: [4, 10, 16] },
  { id: "ani_019", name: "Duck", track: [2, 4, 8, 13] },
  { id: "ani_020", name: "Gecko", track: [5, 10, 16] },
  { id: "ani_021", name: "Hedgehog", track: [5, 12] },
  { id: "ani_022", name: "Peacock", track: [5, 10, 17] },
  { id: "ani_023", name: "Mouse", track: [5, 10, 17] },
  { id: "ani_024", name: "Squirrel", track: [4, 9, 15] },
  { id: "ani_025", name: "Wolf", track: [4, 10, 16] },
  { id: "ani_026", name: "Rabbit", track: [5, 10, 17] },
  { id: "ani_027", name: "Warthog", track: [4, 8, 13] },
  { id: "ani_028", name: "Koala", track: [3, 6, 10, 15] },
  { id: "ani_029", name: "Kookaburra", track: [5, 11, 18] },
  { id: "ani_030", name: "Macaw", track: [4, 9, 14] },
  { id: "ani_031", name: "Bear", track: [5, 11] },
  { id: "ani_032", name: "Bee", track: [8, 18] },
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
