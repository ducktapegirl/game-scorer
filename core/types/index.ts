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
  // Abstract layout coordinates for on-screen rendering, in units of one cell
  // spacing. Distinct from M4's cellCenterPx, which maps into photo space.
  cellCenter(id: CellId): { x: number; y: number };
}

export interface TokenDef {
  id: TokenId;
  label: string;
  displayColor?: string; // CSS color for rendering; omitted → white + label text
  referenceSwatch?: unknown; // Lab swatch data lands in M4 calibration
}

// A stack a player may enter for a cell, bottom-to-top, keyed by its top token.
// Games with scoring-relevant stack heights expose one choice per height; games
// without stacking expose a single [token] choice per token.
export interface StackChoice<T extends TokenId = TokenId> {
  label: string;
  stack: T[];
}

export type ConfigField =
  | { type: "picker"; id: string; label: string; options: string[] }
  | {
      type: "counterList";
      id: string;
      label: string;
      items: { id: string; label: string }[];
    }
  | { type: "toggle"; id: string; label: string };

export type ConfigSchema = ConfigField[];

export interface GameModule<B extends BoardState = BoardState, C = unknown> {
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
  // revealSequence is added in M6
}
