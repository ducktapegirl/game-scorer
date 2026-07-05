import type { ConfigSchema } from "../../core/types";

export type SpiritCardId = string; // real catalog of the 10 spirit cards lands in M3

export interface AnimalCardEntry {
  cardId: string; // chosen from the fixed 32-card catalog (M3)
  cubesPlaced: number;
}

export interface HarmoniesConfig {
  spirit: "none" | SpiritCardId; // "none" = base game, no special-casing
  animalCards: AnimalCardEntry[];
}

export const EMPTY_CONFIG: HarmoniesConfig = { spirit: "none", animalCards: [] };

// M3 fills this with a spirit picker and an animal-card counterList so
// core/ui can render the config form generically.
export const harmoniesConfigSchema: ConfigSchema = [];
