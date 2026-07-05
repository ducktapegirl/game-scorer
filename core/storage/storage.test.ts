import { describe, expect, it } from "vitest";
import type { BoardState } from "../types";
import { clearBoard, loadBoard, saveBoard, type StorageLike } from "./index";

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
