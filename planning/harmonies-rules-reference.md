# Harmonies — Scoring Rules Reference

This file is the **single source of truth** for scoring logic. It captures the game's
scoring *facts* (values, adjacency conditions, stacking constraints) as data, in our
own words — it is **not** a copy of the rulebook. Keep the official Libellud rulebook
on hand as the authoritative reference and confirm the one flagged edge case below
against your copy.

Values below are cross-checked against the published rules and multiple guides and
are believed correct, but the physical rulebook wins any disagreement.

## Token colors

| Color  | Terrain role        |
|--------|---------------------|
| blue   | water / river       |
| gray   | mountain            |
| brown  | tree trunk / base   |
| green  | tree foliage / bush |
| yellow | field               |
| red    | building            |

## Stacking rules (constrain how a stack can be composed)

- **gray** on gray only; max height 3.
- **brown** on brown only; max 2 brown in a stack.
- **green** sits on 0, 1, or 2 brown (never on green; at most one green per stack).
- **red** sits on exactly 1 brown / gray / red; red is never the 3rd token in a stack
  (so a building tops out at height 2 on a single base).
- **blue** and **yellow** are ground-level only; nothing may be placed on them.
- Nothing is ever placed *under* an existing token, or under/over an animal cube.

These constraints are what let the app reconstruct a full stack from the **top color +
height** (see the spec's depth-annotation section).

## Terrain scoring

### Trees (green-topped stacks)
| Height | Composition          | Points |
|-------:|----------------------|-------:|
| 1      | green only (bush)    | 1      |
| 2      | green on 1 brown     | 3      |
| 3      | green on 2 brown     | 7      |

Brown-only stacks with no green on top score 0.

### Mountains (gray stacks)

**Is the mountain hex-adjacent to at least one other mountain (any height counts,
including a lone height-1 gray)?**

- **No:** it scores **0**, regardless of height.
- **Yes:** it scores by its own height:

| Height | Points |
|-------:|-------:|
| 1      | 1      |
| 2      | 3      |
| 3      | 7      |

This resolves the earlier open question: a lone height-1 gray **does** count as a
mountain for adjacency purposes on both sides of the check — it can both qualify for
points itself and satisfy a neighbor's adjacency requirement.

### Fields (yellow)
Each group of **2+ contiguous** yellow tokens scores **5**, regardless of group size.
Many small separate groups beat one big group. A lone yellow scores 0.

### Buildings (red-topped stacks)
Each building scores **5** if the top tokens of its hex-adjacent neighbors show **3+
different colors** (a neighboring red counts as a color). Otherwise 0. Only the top
token of each neighbor counts.

### Water — Side A (river)
Only the single best (longest) river is scored. Its score is a function of length,
where length = number of tokens along the shortest path between the river's two far
ends.

| Length | Points |
|-------:|-------:|
| 1      | 0      |
| 2      | 2      |
| 3      | 5      |
| 4      | 8      |
| 5      | 11     |
| 6      | 15     |
| 7+     | 15 + 4 per token beyond the 6th |

> **IMPLEMENTATION NOTE (confirmed):** treat connected blue tokens as a graph. For
> each connected component, the relevant length is the longest shortest-path between
> any two tokens (the component's token-diameter) — **not** a total token count. This
> is the correct rule for branching or looping rivers, confirmed. Score only the
> highest-scoring component. Write a test for a branching/looping river to lock this
> in, since it's the one case where "count all the blue tokens" would give a wrong
> answer.

### Water — Side B (islands)
Each island (a space or group of spaces separated from others by blue tokens) scores
**5**. There is always at least 1 island, even with no water. (Side A and Side B are
mutually exclusive — a game uses one board side.)

## Animal cards
Score the number shown in the **topmost uncovered** cube slot. A card with all cubes
still on it scores 0. This is entered manually (card id + cubes placed); the app reads
the value off the card's stored track.

## Nature's Spirit modifiers (examples)
Each of the 10 cards adds an end-game scoring condition. Encode per card whether it
**adds to** or **replaces** the base rule:

- **Additive (owl-type):** bushes still score their normal 1 point each; the spirit
  adds extra points per bush on top.
- **Replacing (lion-type):** fields are rescored by group size instead of the flat
  5-per-group — e.g. 2 points per group of 1–2 yellow and 10 points per group of 3+
  yellow. Note this even counts single yellow tokens, unlike the base field rule.

Confirm each card's exact numbers and add/replace behavior from the cards themselves.
