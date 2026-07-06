// Pure, DOM-free board-editing state for the manual entry / correction UI.
// A board being edited is just a BoardState: these helpers keep it the single
// source of truth (only non-empty cells are stored) and validate anything
// loaded from persistence against the game module's topology and entry data.

import type {
  BoardState,
  CellId,
  ConfigFieldValue,
  ConfigSchema,
  CounterEntry,
  GameModule,
  TokenId,
} from "../types";

export function emptyBoard<B extends BoardState>(boardSide: B["boardSide"]): B {
  return { boardSide, cells: [] } as BoardState as B;
}

export function stackAt(board: BoardState, id: CellId): TokenId[] {
  return board.cells.find((c) => c.id === id)?.stack ?? [];
}

/**
 * Returns a new board with `id`'s stack replaced. An empty stack removes the
 * cell entirely — empty cells are never serialized.
 */
export function withStack<B extends BoardState>(board: B, id: CellId, stack: TokenId[]): B {
  const cells = board.cells.filter((c) => c.id !== id);
  if (stack.length > 0) cells.push({ id, stack });
  return { ...board, cells };
}

/**
 * Validates a value loaded from persistence into a well-formed BoardState for
 * `module`: known variant, cells on that variant's topology, no duplicate
 * cells, and every stack exactly one of the game's stackChoices for its top
 * token. Returns null on any mismatch — the caller starts fresh.
 */
export function validateSavedBoard<B extends BoardState>(
  raw: unknown,
  gameBoard: GameModule<B, never>["board"],
): B | null {
  if (typeof raw !== "object" || raw === null) return null;
  const { boardSide, cells } = raw as { boardSide?: unknown; cells?: unknown };

  if (!gameBoard.variants.some((v) => v.id === boardSide)) return null;
  const topology = gameBoard.topology(boardSide as B["boardSide"]);
  const validCells = new Set(topology.cells);

  if (!Array.isArray(cells)) return null;
  const seen = new Set<CellId>();
  const board = emptyBoard<B>(boardSide as B["boardSide"]);
  for (const cell of cells) {
    if (typeof cell !== "object" || cell === null) return null;
    const { id, stack } = cell as { id?: unknown; stack?: unknown };
    if (typeof id !== "string" || !validCells.has(id) || seen.has(id)) return null;
    if (!Array.isArray(stack) || stack.length === 0) return null;
    if (!stack.every((t) => typeof t === "string")) return null;
    const choices = gameBoard.stackChoices(stack[stack.length - 1] as TokenId);
    if (!choices.some((c) => c.stack.join(",") === stack.join(","))) return null;
    seen.add(id);
    board.cells.push({ id, stack: [...(stack as TokenId[])] });
  }
  return board;
}

/**
 * Validates a value loaded from persistence against a game's config schema:
 * every schema field present with the right shape (picker value among the
 * options, counterList entries with known ids, no duplicates, counts within
 * 0..max, toggle a boolean), and no keys outside the schema. Returns null on
 * any mismatch — the caller falls back to the module's emptyConfig.
 */
export function validateSavedConfig<C extends Record<string, ConfigFieldValue>>(
  raw: unknown,
  schema: ConfigSchema,
): C | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;
  if (Object.keys(record).length !== schema.length) return null;

  const config: Record<string, ConfigFieldValue> = {};
  for (const field of schema) {
    const value = record[field.id];
    switch (field.type) {
      case "picker": {
        if (typeof value !== "string") return null;
        if (!field.options.some((o) => o.id === value)) return null;
        config[field.id] = value;
        break;
      }
      case "counterList": {
        if (!Array.isArray(value)) return null;
        const items = new Map(field.items.map((i) => [i.id, i]));
        const seen = new Set<string>();
        const entries: CounterEntry[] = [];
        for (const entry of value) {
          if (typeof entry !== "object" || entry === null) return null;
          const { id, count } = entry as { id?: unknown; count?: unknown };
          if (typeof id !== "string" || seen.has(id)) return null;
          const item = items.get(id);
          if (item === undefined) return null;
          if (typeof count !== "number" || !Number.isInteger(count)) return null;
          if (count < 0 || (item.max !== undefined && count > item.max)) return null;
          seen.add(id);
          entries.push({ id, count });
        }
        config[field.id] = entries;
        break;
      }
      case "toggle": {
        if (typeof value !== "boolean") return null;
        config[field.id] = value;
        break;
      }
    }
  }
  return config as C;
}
