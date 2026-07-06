import { describe, expect, it } from "vitest";
import type { Lab, TokenDef } from "../types";
import { classifyColor } from "./classify";
import { rgbToLab } from "./color";

const swatch = (r: number, g: number, b: number): Lab => rgbToLab({ r, g, b });

const VOCAB: TokenDef[] = [
  { id: "fire", label: "Fire", referenceSwatch: swatch(200, 40, 30) },
  { id: "sea", label: "Sea", referenceSwatch: swatch(30, 60, 200) },
];
const EMPTY = [swatch(235, 225, 200), swatch(210, 205, 190)]; // two board-art tones

describe("classifyColor", () => {
  it("matches an exact swatch to its token", () => {
    const result = classifyColor(swatch(200, 40, 30), VOCAB, EMPTY);
    expect(result.token).toBe("fire");
    expect(result.distance).toBe(0);
  });

  it("matches a perturbed color to the nearest token", () => {
    expect(classifyColor(swatch(180, 60, 50), VOCAB, EMPTY).token).toBe("fire");
    expect(classifyColor(swatch(50, 80, 180), VOCAB, EMPTY).token).toBe("sea");
  });

  it("returns null when an empty-board swatch wins — from any of the list", () => {
    expect(classifyColor(swatch(233, 226, 202), VOCAB, EMPTY).token).toBeNull();
    expect(classifyColor(swatch(208, 206, 192), VOCAB, EMPTY).token).toBeNull();
  });

  it("reports the nearest differing verdict as runner-up", () => {
    const result = classifyColor(swatch(200, 40, 30), VOCAB, EMPTY);
    expect(result.runnerUp).not.toBeNull();
    expect(result.runnerUp!.token).not.toBe("fire");
    expect(result.runnerUp!.distance).toBeGreaterThan(result.distance);
  });

  it("throws when a token is missing its reference swatch", () => {
    const missing: TokenDef[] = [{ id: "x", label: "X" }];
    expect(() => classifyColor(swatch(0, 0, 0), missing, EMPTY)).toThrow(/reference swatch/);
  });
});
