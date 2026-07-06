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
  { id: "ani_001", name: "Ant", track: [1, 3, 5] },
  { id: "ani_002", name: "Antelope", track: [1, 2, 4, 6] },
  { id: "ani_003", name: "Bear", track: [2, 4, 6, 8] },
  { id: "ani_004", name: "Bird", track: [1, 2, 4] },
  { id: "ani_005", name: "Butterfly", track: [3, 5] },
  { id: "ani_006", name: "Cat", track: [2, 4, 6] },
  { id: "ani_007", name: "Crab", track: [1, 3, 4] },
  { id: "ani_008", name: "Crow", track: [2, 4] },
  { id: "ani_009", name: "Deer", track: [1, 3, 5, 7] },
  { id: "ani_010", name: "Dolphin", track: [2, 5, 7] },
  { id: "ani_011", name: "Eagle", track: [3, 5, 7] },
  { id: "ani_012", name: "Elephant", track: [2, 4, 6, 8] },
  { id: "ani_013", name: "Fennec Fox", track: [1, 3] },
  { id: "ani_014", name: "Flamingo", track: [1, 3, 5] },
  { id: "ani_015", name: "Frog", track: [1, 2, 4] },
  { id: "ani_016", name: "Giraffe", track: [1, 4, 7, 10] },
  { id: "ani_017", name: "Gorilla", track: [2, 5, 8] },
  { id: "ani_018", name: "Hedgehog", track: [1, 3] },
  { id: "ani_019", name: "Hippo", track: [3, 5, 7, 10] },
  { id: "ani_020", name: "Hummingbird", track: [2, 3] },
  { id: "ani_021", name: "Lemur", track: [1, 2, 3] },
  { id: "ani_022", name: "Lion", track: [2, 5, 8, 11] },
  { id: "ani_023", name: "Meerkat", track: [1, 4, 6] },
  { id: "ani_024", name: "Mouse", track: [1, 2, 3] },
  { id: "ani_025", name: "Otter", track: [2, 4, 6] },
  { id: "ani_026", name: "Owl", track: [1, 4, 7] },
  { id: "ani_027", name: "Peacock", track: [2, 5, 8, 10] },
  { id: "ani_028", name: "Penguin", track: [2, 4, 6] },
  { id: "ani_029", name: "Rabbit", track: [1, 2] },
  { id: "ani_030", name: "Raccoon", track: [1, 3, 5] },
  { id: "ani_031", name: "Squirrel", track: [1, 2, 4] },
  { id: "ani_032", name: "Turtle", track: [1, 3, 5] },
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
