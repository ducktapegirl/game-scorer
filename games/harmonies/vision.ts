// Vision data for Harmonies: what the empty board looks like, what may sit
// on top of tokens (animal cubes), and which stack to propose per detected
// top token. This is data for core/vision's generic pipeline — no image
// code lives here. All colors kept in sRGB (what the debug table reports)
// and converted to Lab at module init.

import type { GameVisionSpec, Lab } from "../../core/types";
import { rgbToLab, type Rgb } from "../../core/vision/color";
import type { TokenColor } from "./tokens";
import type { BoardSide } from "./topology";

// Empty-cell tones per side: what an empty hex space shows. Side A values
// are measured from resources/test_image1.jpg — but that board was FULL, so
// they come from the pedestal slivers visible between tokens (shadowed
// cream). Validate/retune with a photo that has genuinely empty cells. Side
// B is a PLACEHOLDER until a side-B photo exists.
export const EMPTY_TONES_RGB: Record<BoardSide, Rgb[]> = {
  A: [
    { r: 178, g: 146, b: 114 }, // pedestal cream (shadowed)
    { r: 158, g: 148, b: 135 }, // pedestal cream (cooler shade)
  ],
  // PLACEHOLDER — no side-B photo yet
  B: [
    { r: 222, g: 208, b: 180 },
    { r: 175, g: 195, b: 205 },
  ],
};

// Things that sit ON TOP of tokens without being tokens: translucent animal
// cubes. Pixels matching these are discarded from the vote. The amber cube
// is translucent, so it shows two tones depending on what's underneath —
// both measured from resources/test_image1.jpg. The white cube is a
// PLACEHOLDER until one appears in a photo.
export const CUBE_TONES_RGB: Rgb[] = [
  { r: 113, g: 59, b: 28 }, // amber over warm tokens
  { r: 39, g: 87, b: 100 }, // amber over blue tokens
  { r: 240, g: 240, b: 235 }, // PLACEHOLDER white cube
];

const EMPTY_SWATCHES: Record<BoardSide, Lab[]> = {
  A: EMPTY_TONES_RGB.A.map(rgbToLab),
  B: EMPTY_TONES_RGB.B.map(rgbToLab),
};

// The stack proposed when the classifier sees `token` on top. Everything is
// proposed at height 1 (depth annotation is M5's job) except red: a red top
// is almost always a completed building at game end, and the hidden base is
// scoring-irrelevant (spec §7 — "default it and move on"), so propose the
// default [brown, red]. The rare lone red is a one-tap fix in the editor.
// Note this only affects the red cell's own building points — neighbor
// color-diversity checks read the top token, identical either way.
const PROPOSED_STACKS: Record<TokenColor, TokenColor[]> = {
  blue: ["blue"],
  gray: ["gray"],
  brown: ["brown"],
  green: ["green"],
  yellow: ["yellow"],
  red: ["brown", "red"],
};

export const harmoniesVision: GameVisionSpec<BoardSide, TokenColor> = {
  emptySwatches: (side) => EMPTY_SWATCHES[side],
  ignoreSwatches: CUBE_TONES_RGB.map(rgbToLab),
  proposedStack: (token) => [...PROPOSED_STACKS[token]],
};
