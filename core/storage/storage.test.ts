import { describe, expect, it } from "vitest";
import type { BoardState } from "../types";
import {
  clearBoard,
  clearConfig,
  loadBoard,
  loadConfig,
  saveBoard,
  saveConfig,
  type StorageLike,
} from "./index";

function fakeStorage(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

const board: BoardState = { boardSide: "A", cells: [{ id: "0,0", stack: ["green"] }] };

describe("board persistence", () => {
  it("round-trips a saved board", () => {
    const storage = fakeStorage();
    saveBoard("harmonies", board, storage);
    expect(loadBoard("harmonies", storage)).toEqual(board);
  });

  it("keys by game id", () => {
    const storage = fakeStorage();
    saveBoard("harmonies", board, storage);
    expect([...storage.data.keys()]).toEqual(["game-scorer:harmonies:board"]);
    expect(loadBoard("other-game", storage)).toBeNull();
  });

  it("returns null when nothing is saved", () => {
    expect(loadBoard("harmonies", fakeStorage())).toBeNull();
  });

  it("returns null on corrupt JSON instead of throwing", () => {
    const storage = fakeStorage();
    storage.data.set("game-scorer:harmonies:board", "{not json");
    expect(loadBoard("harmonies", storage)).toBeNull();
  });

  it("clears the saved board", () => {
    const storage = fakeStorage();
    saveBoard("harmonies", board, storage);
    clearBoard("harmonies", storage);
    expect(loadBoard("harmonies", storage)).toBeNull();
  });
});

describe("config persistence", () => {
  const config = { spirit: "spi_001", animalCards: [{ id: "ani_001", count: 2 }] };

  it("round-trips a saved config under its own key", () => {
    const storage = fakeStorage();
    saveConfig("harmonies", config, storage);
    expect(loadConfig("harmonies", storage)).toEqual(config);
    expect([...storage.data.keys()]).toEqual(["game-scorer:harmonies:config"]);
  });

  it("board and config keys do not collide", () => {
    const storage = fakeStorage();
    saveBoard("harmonies", board, storage);
    saveConfig("harmonies", config, storage);
    clearBoard("harmonies", storage);
    expect(loadConfig("harmonies", storage)).toEqual(config);
    expect(loadBoard("harmonies", storage)).toBeNull();
  });

  it("returns null when nothing is saved or JSON is corrupt", () => {
    const storage = fakeStorage();
    expect(loadConfig("harmonies", storage)).toBeNull();
    storage.data.set("game-scorer:harmonies:config", "{not json");
    expect(loadConfig("harmonies", storage)).toBeNull();
  });

  it("clears the saved config", () => {
    const storage = fakeStorage();
    saveConfig("harmonies", config, storage);
    clearConfig("harmonies", storage);
    expect(loadConfig("harmonies", storage)).toBeNull();
  });
});
