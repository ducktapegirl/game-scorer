// Persistence for the in-progress board, keyed by game id. Values are stored
// as raw JSON; semantic validation (topology, legal stacks) happens in
// core/ui/entry-state's validateSavedBoard so this module stays dumb.

import type { BoardState } from "../types";

// The subset of the DOM Storage interface we use — injectable so Node tests
// don't need a browser.
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const key = (gameId: string) => `game-scorer:${gameId}:board`;

export function saveBoard(
  gameId: string,
  board: BoardState,
  storage: StorageLike = globalThis.localStorage,
): void {
  storage.setItem(key(gameId), JSON.stringify(board));
}

/** The stored value parsed from JSON, or null if missing or corrupt. */
export function loadBoard(
  gameId: string,
  storage: StorageLike = globalThis.localStorage,
): unknown {
  const raw = storage.getItem(key(gameId));
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearBoard(
  gameId: string,
  storage: StorageLike = globalThis.localStorage,
): void {
  storage.removeItem(key(gameId));
}
