import type { TokenDef } from "../../core/types";

export type TokenColor = "blue" | "gray" | "brown" | "green" | "yellow" | "red";

export const TOKEN_COLORS: readonly TokenColor[] = [
  "blue",
  "gray",
  "brown",
  "green",
  "yellow",
  "red",
];

// displayColor identifies the physical token on screen (function, not
// styling). referenceSwatch (Lab values) is calibrated from reference photos
// in M4; until then the vocabulary is ids + labels + display colors.
export const TOKEN_DEFS: TokenDef[] = [
  { id: "blue", label: "Water", displayColor: "royalblue" },
  { id: "gray", label: "Mountain", displayColor: "silver" },
  { id: "brown", label: "Tree trunk", displayColor: "peru" },
  { id: "green", label: "Tree foliage / bush", displayColor: "mediumseagreen" },
  { id: "yellow", label: "Field", displayColor: "gold" },
  { id: "red", label: "Building", displayColor: "indianred" },
];
