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

// Each token's tones (base color + printed pattern) in sRGB, kept in RGB
// because that is what the photo screen's debug table reports for
// recalibration. Measured from resources/test_image1.jpg (M4.5 calibration,
// 23/23 cells verified) — except brown, measured from the side-B island
// photos (resources/test_image_islands*.jpg), the first photos with
// brown-topped stacks. Brown ships its dark tone only: the measured light
// cluster is a specular highlight within a few ΔE of empty-hex cream and
// steals votes from genuinely empty cells.
export const TOKEN_TONES_RGB: Record<TokenColor, Rgb[]> = {
  blue: [
    { r: 12, g: 71, b: 89 }, // deep teal base
    { r: 94, g: 146, b: 162 }, // light wave print
  ],
  gray: [
    { r: 111, g: 96, b: 90 }, // warm shaded face
    { r: 116, g: 115, b: 115 }, // neutral face
  ],
  brown: [{ r: 128, g: 86, b: 77 }], // dark tone only (see note above)
  green: [
    { r: 110, g: 95, b: 18 }, // olive base
    { r: 168, g: 153, b: 93 }, // light leaf print
  ],
  yellow: [
    { r: 211, g: 152, b: 90 }, // flower-print blend
    { r: 217, g: 141, b: 8 }, // saturated base
  ],
  red: [{ r: 182, g: 59, b: 58 }], // reads pink in daylight; one tone sufficed
};

// displayColor identifies the physical token on screen (function, not
// styling); referenceSwatches are what the vision classifier votes against.
export const TOKEN_DEFS: TokenDef[] = [
  { id: "blue", label: "Water", abbr: "Bl", displayColor: "royalblue" },
  { id: "gray", label: "Mountain", abbr: "Gy", displayColor: "silver" },
  { id: "brown", label: "Tree trunk", abbr: "Br", displayColor: "peru" },
  { id: "green", label: "Tree foliage / bush", abbr: "Gn", displayColor: "mediumseagreen" },
  { id: "yellow", label: "Field", abbr: "Ye", displayColor: "gold" },
  { id: "red", label: "Building", abbr: "Rd", displayColor: "indianred" },
].map((def) => ({
  ...def,
  referenceSwatches: TOKEN_TONES_RGB[def.id as TokenColor].map(rgbToLab),
}));
