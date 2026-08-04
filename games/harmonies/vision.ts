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
// cream); retune when a side-A photo with genuinely empty cells exists.
// Side B values are measured from real empty hexes in the island photos
// (resources/test_image_islands*.jpg — 5 empty cells across both).
//
// Side B shipped a second "shadowed cream hex" tone {141,129,118} that had to
// go: a desaturated mid-neutral sits in the middle of every other token color,
// so it won pixels off blue, gray and brown tokens alike and voted whole
// occupied cells empty. Removing it is worth two cells across the fixtures
// (95/98 → 97/98). Side A keeps both of its tones only because no side-A photo
// with genuinely empty cells exists to re-validate against; the same magnet
// effect is likely there too.
export const EMPTY_TONES_RGB: Record<BoardSide, Rgb[]> = {
  A: [
    { r: 178, g: 146, b: 114 }, // pedestal cream (shadowed)
    { r: 158, g: 148, b: 135 }, // pedestal cream (cooler shade)
  ],
  B: [
    { r: 182, g: 169, b: 158 }, // lit cream hex
  ],
};

// Things that sit ON TOP of tokens without being tokens: translucent animal
// cubes. Pixels matching these are discarded from the vote. The amber cube
// is translucent, so its tone depends on what's underneath and how the light
// hits it: two tones measured from resources/test_image1.jpg, two more from
// the island photos (cubes over gray/brown/green). A measured near-black
// shadow cluster is deliberately NOT included — it matches every deep shadow
// on the board and discards good token pixels.
//
// An "amber over blue tokens" tone {39,87,100} was dropped for the same
// reason: it sat within a few ΔE of blue's own base tone {12,71,89}, so every
// pixel of a plain blue token was thrown away as cube instead of voting, and
// blue cells lost to whatever won the scraps.
//
// The near-white tone is NOT a placeholder any more — the clear cube in
// resources/test_image_islands3.jpg confirmed it, and it also mops up blown
// specular highlights on glossy tokens. Removing it costs nine cells across
// the fixtures, so it stays.
export const CUBE_TONES_RGB: Rgb[] = [
  { r: 113, g: 59, b: 28 }, // amber over warm tokens
  { r: 206, g: 133, b: 15 }, // amber lit face
  { r: 148, g: 123, b: 101 }, // milky amber over gray/brown
  { r: 240, g: 240, b: 235 }, // clear cube / blown highlight
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

// Green and gray are the only tokens whose height is hidden from a top-down
// photo and scores differently by height (spec §7), so they alone tap-cycle
// their depth in the M5 correction UI. Red is deliberately excluded: its
// base is scoring-irrelevant, so the [brown, red] default stands.
const DEPTH_TOKENS: TokenColor[] = ["green", "gray"];

export const harmoniesVision: GameVisionSpec<BoardSide, TokenColor> = {
  emptySwatches: (side) => EMPTY_SWATCHES[side],
  ignoreSwatches: CUBE_TONES_RGB.map(rgbToLab),
  proposedStack: (token) => [...PROPOSED_STACKS[token]],
  depthTokens: [...DEPTH_TOKENS],
};
