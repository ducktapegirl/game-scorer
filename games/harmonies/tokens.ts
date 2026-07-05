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

// referenceSwatch (Lab values) is calibrated from reference photos in M4;
// until then the vocabulary is just ids + labels.
export const TOKEN_DEFS: TokenDef[] = [
  { id: "blue", label: "Water" },
  { id: "gray", label: "Mountain" },
  { id: "brown", label: "Tree trunk" },
  { id: "green", label: "Tree foliage / bush" },
  { id: "yellow", label: "Field" },
  { id: "red", label: "Building" },
];
