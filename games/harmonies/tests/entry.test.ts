import { describe, expect, it } from "vitest";
import { BOARD_VARIANTS, stackChoices } from "../entry";
import { TOKEN_COLORS } from "../tokens";
import { validateStack } from "../topology";

describe("board variants", () => {
  it("lists exactly side A and side B", () => {
    expect(BOARD_VARIANTS.map((v) => v.id)).toEqual(["A", "B"]);
  });
});

describe("stackChoices", () => {
  it("offers at least one choice for every token color", () => {
    for (const color of TOKEN_COLORS) {
      expect(stackChoices(color).length).toBeGreaterThan(0);
    }
  });

  it("returns no choices for an unknown token", () => {
    expect(stackChoices("purple")).toEqual([]);
  });

  it("only offers stacks that are legal under the stacking rules", () => {
    for (const color of TOKEN_COLORS) {
      for (const choice of stackChoices(color)) {
        expect(validateStack(choice.stack), `${color}: ${choice.stack.join(",")}`).toBe(true);
      }
    }
  });

  it("tops every choice with the token it is keyed by", () => {
    for (const color of TOKEN_COLORS) {
      for (const choice of stackChoices(color)) {
        expect(choice.stack.at(-1)).toBe(color);
      }
    }
  });

  it("offers green and gray at exactly heights 1-3, height 1 first (the default)", () => {
    for (const color of ["green", "gray"] as const) {
      expect(stackChoices(color).map((c) => c.stack.length)).toEqual([1, 2, 3]);
    }
  });

  it("offers blue and yellow as single ground-level choices", () => {
    for (const color of ["blue", "yellow"] as const) {
      expect(stackChoices(color)).toHaveLength(1);
      expect(stackChoices(color)[0]!.stack).toEqual([color]);
    }
  });

  it("distinguishes a lone red (not a building) from a based red (building)", () => {
    const stacks = stackChoices("red").map((c) => c.stack);
    expect(stacks).toContainEqual(["red"]);
    expect(stacks.some((s) => s.length === 2 && s[1] === "red")).toBe(true);
  });
});
