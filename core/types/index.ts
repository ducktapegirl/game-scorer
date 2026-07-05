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
  // cellCenterPx(cellId, calibration) is added in M4 for the vision sampler
}

export interface TokenDef {
  id: TokenId;
  label: string;
  referenceSwatch?: unknown; // Lab swatch data lands in M4 calibration
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
    // A function of the board variant because some games (Harmonies) have
    // more than one printed board shape; single-board games ignore the arg.
    topology(variant: B["boardSide"]): BoardTopology;
    tokenVocabulary: TokenDef[];
    allowsStacking: boolean;
    maxStackHeight?: number;
  };
  score(board: B, config: C): ScoreBreakdown;
  configSchema: ConfigSchema;
  // revealSequence is added in M6
}
