// Assembles Harmonies as a GameModule — the first implementation of the
// generic contract in core/types. Core code consumes this object; it never
// imports Harmonies specifics directly.

import type { GameModule } from "../../core/types";
import { harmoniesConfigSchema, type HarmoniesConfig } from "./config";
import { score, type HarmoniesBoardState } from "./rules";
import { TOKEN_DEFS } from "./tokens";
import { topology } from "./topology";

export type { HarmoniesBoardState } from "./rules";
export type { HarmoniesConfig, AnimalCardEntry, SpiritCardId } from "./config";
export type { BoardSide } from "./topology";
export type { TokenColor } from "./tokens";
export { score } from "./rules";

export const harmonies: GameModule<HarmoniesBoardState, HarmoniesConfig> = {
  id: "harmonies",
  name: "Harmonies",
  hasVisualBoard: true,
  board: {
    topology,
    tokenVocabulary: TOKEN_DEFS,
    allowsStacking: true,
    maxStackHeight: 3,
  },
  score,
  configSchema: harmoniesConfigSchema,
};
