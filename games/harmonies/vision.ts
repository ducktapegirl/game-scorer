// Vision data for Harmonies: what the empty board looks like and which
// stack to propose per detected top token. This is data for core/vision's
// generic pipeline — no image code lives here.

import type { GameVisionSpec, Lab } from "../../core/types";
import { rgbToLab, type Rgb } from "../../core/vision/color";
import type { TokenColor } from "./tokens";
import type { BoardSide } from "./topology";

// PLACEHOLDER empty-board swatches (M4 plan decision 1): the printed art is
// not one flat color — each side lists the tones an empty cell may show
// (base cardboard plus printed water art, which must not be mistaken for a
// blue token). To be extended/recalibrated from real photos via the photo
// screen's debug table; data-only edits.
const PLACEHOLDER_EMPTY_RGB: Record<BoardSide, Rgb[]> = {
  // Side A: cream board + the printed river's pale blue-gray
  A: [
    { r: 222, g: 208, b: 180 },
    { r: 168, g: 190, b: 200 },
  ],
  // Side B: cream board + the printed coastline's pale blue-gray
  B: [
    { r: 222, g: 208, b: 180 },
    { r: 175, g: 195, b: 205 },
  ],
};

const EMPTY_SWATCHES: Record<BoardSide, Lab[]> = {
  A: PLACEHOLDER_EMPTY_RGB.A.map(rgbToLab),
  B: PLACEHOLDER_EMPTY_RGB.B.map(rgbToLab),
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
  proposedStack: (token) => [...PROPOSED_STACKS[token]],
};
