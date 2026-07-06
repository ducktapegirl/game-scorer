import type { TokenDef } from "../../core/types";
import { rgbToLab, type Rgb } from "../../core/vision/color";

export type TokenColor = "blue" | "gray" | "brown" | "green" | "yellow" | "red";

export const TOKEN_COLORS: readonly TokenColor[] = [
  "blue",
  "gray",
  "brown",
  "green",
  "yellow",
  "red",
];

// PLACEHOLDER swatches (M4 plan decision 1): estimated sRGB appearance of
// each physical token under typical photo lighting, converted to Lab for the
// classifier. To be recalibrated against real reference photos using the
// photo screen's per-cell debug table — a data-only edit, kept in RGB here
// because that is what the debug table reports.
export const PLACEHOLDER_TOKEN_RGB: Record<TokenColor, Rgb> = {
  blue: { r: 80, g: 140, b: 195 },
  gray: { r: 150, g: 150, b: 150 },
  brown: { r: 140, g: 90, b: 55 },
  green: { r: 90, g: 150, b: 70 },
  yellow: { r: 230, g: 190, b: 60 },
  red: { r: 190, g: 70, b: 60 },
};

// displayColor identifies the physical token on screen (function, not
// styling); referenceSwatch is what the vision classifier matches against.
export const TOKEN_DEFS: TokenDef[] = [
  { id: "blue", label: "Water", displayColor: "royalblue" },
  { id: "gray", label: "Mountain", displayColor: "silver" },
  { id: "brown", label: "Tree trunk", displayColor: "peru" },
  { id: "green", label: "Tree foliage / bush", displayColor: "mediumseagreen" },
  { id: "yellow", label: "Field", displayColor: "gold" },
  { id: "red", label: "Building", displayColor: "indianred" },
].map((def) => ({
  ...def,
  referenceSwatch: rgbToLab(PLACEHOLDER_TOKEN_RGB[def.id as TokenColor]),
}));
