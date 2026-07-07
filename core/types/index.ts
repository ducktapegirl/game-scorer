// Generic, game-agnostic shapes. Every game module (games/<id>/) implements
// these contracts; core code is written against them and never against a
// specific game. See planning/harmonies-multigame-architecture.md.

export type CellId = string;
export type TokenId = string;

export interface Cell<T extends TokenId = TokenId> {
  id: CellId;
  stack: T[]; // bottom-to-top; [] = empty cell
}

export interface BoardState<V extends string = string, T extends TokenId = TokenId> {
  boardSide: V; // set manually by the user, never detected from a photo
  cells: Cell<T>[];
}

export interface ScoreCategory {
  id: string;
  label: string;
  points: number;
  cells: CellId[]; // contributing cells — drives the M6 reveal highlighting
}

export interface ScoreBreakdown {
  categories: ScoreCategory[];
  total: number; // always the sum of categories[].points
}

export interface BoardTopology {
  shape: "hex" | "square" | "custom";
  cells: CellId[]; // the fixed set of valid cell ids
  neighbors(id: CellId): CellId[]; // adjacency, filtered to valid cells
  // Abstract layout coordinates, in units of one cell spacing. Also the
  // planar frame for photo calibration: the layout is an exact model of the
  // physical grid up to an affine transform, which the calibration
  // homography absorbs.
  cellCenter(id: CellId): { x: number; y: number };
  // The four cells whose centers the user taps to calibrate a photo, in
  // top-left, top-right, bottom-right, bottom-left order as laid out by
  // cellCenter. Supplied only by games with hasVisualBoard; they must not
  // be collinear in the layout.
  calibrationCells?: readonly [CellId, CellId, CellId, CellId];
}

// A color in CIE Lab (D65) — the perceptual space the vision classifier
// measures swatch distance in.
export interface Lab {
  L: number;
  a: number;
  b: number;
}

export interface TokenDef {
  id: TokenId;
  label: string;
  displayColor?: string; // CSS color for rendering; omitted → white + label text
  // The token's tones as calibrated from reference photos — a list because
  // physical tokens are rarely one flat color (base color + printed pattern).
  referenceSwatches?: Lab[];
}

// Game-supplied data for the vision pipeline (core/vision is the mechanism;
// this is the per-game data it runs on). Present iff hasVisualBoard.
export interface GameVisionSpec<V extends string = string, T extends TokenId = TokenId> {
  // The empty-board appearance(s) for a variant. The printed art is rarely
  // one flat color, so this is a list — any of them winning the nearest-
  // swatch match means "no token here".
  emptySwatches(variant: V): Lab[];
  // Colors of things that may sit ON TOP of tokens without being tokens
  // (Harmonies: translucent animal cubes). Pixels matching these are
  // discarded from the classification vote rather than counted.
  ignoreSwatches: Lab[];
  // The stack the vision layer proposes when it sees `token` on top of a
  // cell (it can never see underneath).
  proposedStack(token: T): T[];
}

// A stack a player may enter for a cell, bottom-to-top, keyed by its top token.
// Games with scoring-relevant stack heights expose one choice per height; games
// without stacking expose a single [token] choice per token.
export interface StackChoice<T extends TokenId = TokenId> {
  label: string;
  stack: T[];
}

// Generic config shapes used across games
export interface CounterEntry {
  id: string;
  count: number;
}

export type ConfigFieldValue = string | CounterEntry[] | boolean;

export type ConfigField =
  | { type: "picker"; id: string; label: string; options: { id: string; label: string }[] }
  | {
      type: "counterList";
      id: string;
      label: string;
      items: { id: string; label: string; max?: number }[];
    }
  | { type: "toggle"; id: string; label: string };

export type ConfigSchema = ConfigField[];

export interface GameModule<
  B extends BoardState = BoardState,
  C extends Record<string, ConfigFieldValue> = Record<string, ConfigFieldValue>,
> {
  id: string;
  name: string;
  hasVisualBoard: boolean;
  board: {
    // The printed board variants the user picks from before anything is
    // entered or scored (Harmonies: side A river / side B islands). A
    // single-variant game lists one entry and core/ui skips the prompt.
    variants: { id: B["boardSide"]; label: string }[];
    // A function of the board variant because some games (Harmonies) have
    // more than one printed board shape; single-board games ignore the arg.
    topology(variant: B["boardSide"]): BoardTopology;
    tokenVocabulary: TokenDef[];
    allowsStacking: boolean;
    maxStackHeight?: number;
    // The stacks a player may enter topped by `token` — game data driving the
    // generic cell editor (and later the M5 depth annotator).
    stackChoices(token: TokenId): StackChoice[];
  };
  score(board: B, config: C): ScoreBreakdown;
  configSchema: ConfigSchema;
  emptyConfig: C;
  // Vision data for photo-based board entry; core/ui offers the photo flow
  // only when this is present (and hasVisualBoard is true).
  vision?: GameVisionSpec<B["boardSide"]>;
  // revealSequence is added in M6
}
