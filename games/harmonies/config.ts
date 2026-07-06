import type { ConfigFieldValue, ConfigSchema, CounterEntry } from "../../core/types";
import { ANIMAL_CARDS } from "./animals";
import { SPIRIT_CARDS } from "./spirits";

export type SpiritCardId = string;

export interface HarmoniesConfig extends Record<string, ConfigFieldValue> {
  spirit: "none" | SpiritCardId; // "none" = base game, no special-casing
  animalCards: CounterEntry[]; // { id: animalCardId, count: numCubesPlaced }
}

export const EMPTY_CONFIG: HarmoniesConfig = { spirit: "none", animalCards: [] };

// Generic config schema built from the catalogs
export const harmoniesConfigSchema: ConfigSchema = [
  {
    type: "picker",
    id: "spirit",
    label: "Nature's Spirit Card",
    options: [
      { id: "none", label: "None (base game)" },
      ...SPIRIT_CARDS.map((c) => ({ id: c.id, label: c.name })),
    ],
  },
  {
    type: "counterList",
    id: "animalCards",
    label: "Animal Cards",
    items: ANIMAL_CARDS.map((c) => ({ id: c.id, label: c.name, max: c.track.length })),
  },
];
