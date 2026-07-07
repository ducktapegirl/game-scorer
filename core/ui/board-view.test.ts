import { describe, expect, it } from "vitest";
import type { TokenDef } from "../types";
import { cellLabel } from "./board-view";

const HARMONIES_TOKENS: TokenDef[] = [
  { id: "blue", label: "Water", abbr: "Bl" },
  { id: "gray", label: "Mountain", abbr: "Gy" },
  { id: "brown", label: "Tree trunk", abbr: "Br" },
  { id: "green", label: "Tree foliage / bush", abbr: "Gn" },
  { id: "yellow", label: "Field", abbr: "Ye" },
  { id: "red", label: "Building", abbr: "Rd" },
];

describe("cellLabel", () => {
  it("returns an empty string for an empty stack", () => {
    expect(cellLabel([], HARMONIES_TOKENS)).toBe("");
  });

  it("disambiguates brown vs blue", () => {
    expect(cellLabel(["brown"], HARMONIES_TOKENS)).toBe("Br");
    expect(cellLabel(["blue"], HARMONIES_TOKENS)).toBe("Bl");
  });

  it("disambiguates gray vs green", () => {
    expect(cellLabel(["gray"], HARMONIES_TOKENS)).toBe("Gy");
    expect(cellLabel(["green"], HARMONIES_TOKENS)).toBe("Gn");
  });

  it("appends the stack height only when taller than one token", () => {
    expect(cellLabel(["green", "green", "green"], HARMONIES_TOKENS)).toBe("Gn3");
    expect(cellLabel(["red"], HARMONIES_TOKENS)).toBe("Rd");
  });

  it("falls back to the uppercased first letter when a token has no abbr", () => {
    const tokens: TokenDef[] = [{ id: "purple", label: "Purple" }];
    expect(cellLabel(["purple"], tokens)).toBe("P");
  });
});
