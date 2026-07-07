// Assembles Harmonies as a GameModule — the first implementation of the
// generic contract in core/types. Core code consumes this object; it never
// imports Harmonies specifics directly.

import type { GameModule } from "../../core/types";
import { EMPTY_CONFIG, harmoniesConfigSchema, type HarmoniesConfig } from "./config";
import { BOARD_VARIANTS, stackChoices } from "./entry";
import { score, type HarmoniesBoardState } from "./rules";
import { TOKEN_DEFS } from "./tokens";
import { topology } from "./topology";
import { harmoniesVision } from "./vision";

export type { HarmoniesBoardState } from "./rules";
export type { HarmoniesConfig } from "./config";
export type { AnimalCard } from "./animals";
export type { SpiritCard } from "./spirits";
export type { BoardSide } from "./topology";
export type { TokenColor } from "./tokens";
export { ANIMAL_CARDS, scoreAnimals } from "./animals";
export { SPIRIT_CARDS, applySpirit } from "./spirits";
export { score } from "./rules";

export const harmonies: GameModule<HarmoniesBoardState, HarmoniesConfig> = {
  id: "harmonies",
  name: "Harmonies",
  hasVisualBoard: true,
  board: {
    variants: BOARD_VARIANTS,
    topology,
    tokenVocabulary: TOKEN_DEFS,
    allowsStacking: true,
    maxStackHeight: 3,
    stackChoices,
  },
  score,
  configSchema: harmoniesConfigSchema,
  emptyConfig: EMPTY_CONFIG,
  vision: harmoniesVision,
};
