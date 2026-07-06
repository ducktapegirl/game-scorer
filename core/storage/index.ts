// Persistence for the in-progress board and config, keyed by game id. Values
// are stored as raw JSON; semantic validation (topology, legal stacks, known
// card ids) happens in core/ui/entry-state's validateSavedBoard /
// validateSavedConfig so this module stays dumb.

import type { BoardState } from "../types";

// The subset of the DOM Storage interface we use — injectable so Node tests
// don't need a browser.
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const key = (gameId: string, slot: "board" | "config") => `game-scorer:${gameId}:${slot}`;

function save(k: string, value: unknown, storage: StorageLike): void {
  storage.setItem(k, JSON.stringify(value));
}

/** The stored value parsed from JSON, or null if missing or corrupt. */
function load(k: string, storage: StorageLike): unknown {
  const raw = storage.getItem(k);
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveBoard(
  gameId: string,
  board: BoardState,
  storage: StorageLike = globalThis.localStorage,
): void {
  save(key(gameId, "board"), board, storage);
}

export function loadBoard(
  gameId: string,
  storage: StorageLike = globalThis.localStorage,
): unknown {
  return load(key(gameId, "board"), storage);
}

export function clearBoard(
  gameId: string,
  storage: StorageLike = globalThis.localStorage,
): void {
  storage.removeItem(key(gameId, "board"));
}

export function saveConfig(
  gameId: string,
  config: unknown,
  storage: StorageLike = globalThis.localStorage,
): void {
  save(key(gameId, "config"), config, storage);
}

export function loadConfig(
  gameId: string,
  storage: StorageLike = globalThis.localStorage,
): unknown {
  return load(key(gameId, "config"), storage);
}

export function clearConfig(
  gameId: string,
  storage: StorageLike = globalThis.localStorage,
): void {
  storage.removeItem(key(gameId, "config"));
}
