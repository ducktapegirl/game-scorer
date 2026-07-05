// Manual-entry data for the generic core/ui board editor: which board
// variants exist and which stacks a player may enter per top token. This is
// data, not UI — core/ui renders it without knowing any Harmonies rules.

import type { StackChoice, TokenId } from "../../core/types";
import type { TokenColor } from "./tokens";
import type { BoardSide } from "./topology";

export const BOARD_VARIANTS: { id: BoardSide; label: string }[] = [
  { id: "A", label: "Side A (river)" },
  { id: "B", label: "Side B (islands)" },
];

// Stacks are bottom-to-top. Green/gray heights are the manual depth
// annotation from spec §7. A building's physical base may be brown, gray, or
// red, but it is hidden and scoring-irrelevant (only stack height and
// neighbor tops score), so it is recorded as the default [brown, red] —
// "default it and move on".
const STACK_CHOICES: Record<TokenColor, StackChoice<TokenColor>[]> = {
  blue: [{ label: "Water", stack: ["blue"] }],
  yellow: [{ label: "Field", stack: ["yellow"] }],
  green: [
    { label: "Height 1 (lone bush)", stack: ["green"] },
    { label: "Height 2 (green on 1 brown)", stack: ["brown", "green"] },
    { label: "Height 3 (green on 2 brown)", stack: ["brown", "brown", "green"] },
  ],
  gray: [
    { label: "Height 1 (single gray)", stack: ["gray"] },
    { label: "Height 2 (2 gray)", stack: ["gray", "gray"] },
    { label: "Height 3 (3 gray)", stack: ["gray", "gray", "gray"] },
  ],
  brown: [
    { label: "Height 1 (single brown)", stack: ["brown"] },
    { label: "Height 2 (2 brown)", stack: ["brown", "brown"] },
  ],
  red: [
    { label: "On the ground (not a building)", stack: ["red"] },
    { label: "On a base (building)", stack: ["brown", "red"] },
  ],
};

export function stackChoices(token: TokenId): StackChoice<TokenColor>[] {
  return STACK_CHOICES[token as TokenColor] ?? [];
}
