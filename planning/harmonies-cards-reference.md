# Harmonies Cards Reference

Single source of truth for card scoring data. The TypeScript catalogs
(`games/harmonies/animals.ts`, `games/harmonies/spirits.ts`) transcribe this file;
tests spot-check values against it.

## Animal Cards (32 cards)

Transcribed from the user's physical cards (CSV, 2026-07). The `Color` column is the
card's color band — not used for scoring, kept here to match the physical cards.

`Track Values` = points visible in the topmost uncovered cube slot. For a card with
track `[3, 6, 10, 15]`: 0 cubes placed → 0; 1 cube → 3; 2 cubes → 6; 3 cubes → 10;
4 cubes (all placed) → 15. `num_cubes` equals the number of track values.

| Card ID | Name | Color | Cubes | Track Values |
|---------|------|-------|-------|--------------|
| ani_001 | Bat | Gray | 4 | 3, 6, 10, 15 |
| ani_002 | Fennec Fox | Gray | 3 | 4, 9, 16 |
| ani_003 | Vulture | Gray | 2 | 5, 11 |
| ani_004 | Meerkat | Gray | 4 | 2, 5, 9, 14 |
| ani_005 | Macaque | Gray | 2 | 5, 11 |
| ani_006 | Penguin | Gray | 3 | 4, 10, 16 |
| ani_007 | Arctic Fox | Yellow | 3 | 5, 10, 17 |
| ani_008 | Ladybug | Yellow | 5 | 2, 5, 8, 12, 17 |
| ani_009 | Llama | Yellow | 2 | 5, 12 |
| ani_010 | Raccoon | Yellow | 2 | 6, 12 |
| ani_011 | Crow | Yellow | 2 | 4, 9 |
| ani_012 | Panther | Yellow | 2 | 5, 11 |
| ani_013 | Otter | Blue | 3 | 5, 10, 16 |
| ani_014 | Frog | Blue | 5 | 2, 4, 6, 10, 15 |
| ani_015 | Alligator | Blue | 3 | 4, 9, 15 |
| ani_016 | Stingray | Blue | 3 | 4, 10, 16 |
| ani_017 | Fish | Blue | 4 | 3, 6, 10, 16 |
| ani_018 | Flamingo | Blue | 3 | 4, 10, 16 |
| ani_019 | Duck | Blue | 4 | 2, 4, 8, 13 |
| ani_020 | Gecko | Red | 3 | 5, 10, 16 |
| ani_021 | Hedgehog | Red | 2 | 5, 12 |
| ani_022 | Peacock | Red | 3 | 5, 10, 17 |
| ani_023 | Mouse | Red | 3 | 5, 10, 17 |
| ani_024 | Squirrel | Red | 3 | 4, 9, 15 |
| ani_025 | Wolf | Green | 3 | 4, 10, 16 |
| ani_026 | Rabbit | Green | 3 | 5, 10, 17 |
| ani_027 | Warthog | Green | 3 | 4, 8, 13 |
| ani_028 | Koala | Green | 4 | 3, 6, 10, 15 |
| ani_029 | Kookaburra | Green | 3 | 5, 11, 18 |
| ani_030 | Macaw | Green | 3 | 4, 9, 14 |
| ani_031 | Bear | Green | 2 | 5, 11 |
| ani_032 | Bee | Green | 2 | 8, 18 |

## Nature's Spirit Cards (10 cards)

Transcribed from the user's physical cards (CSV, 2026-07). **All Nature's Spirit
cards are purely additive.** None override or replace base terrain scoring; each
layers bonus points on top of normal, unmodified scoring.

### Per-Landscape Spirits (5 cards)

Score individual landscapes, with point values that vary by **height or landscape
type**. Points accumulate for every matching landscape on the board.

| Spirit ID | Name | Scoring Rule |
|-----------|------|--------------|
| spi_001 | Owl | h1 tree: 3 pts \| h2 tree: 3 pts \| h3 tree: 1 pt |
| spi_005 | Deer | h2 tree: 4 pts \| h3 tree: 3 pts |
| spi_006 | Ram | h2 mountain: 4 pts \| h3 mountain: 4 pts |
| spi_009 | Turtle | blue: 2 pts |
| spi_010 | Beaver | h1 building: 3 pts \| h2 building: 3 pts \| h3 building: 1 pt |

Note: a building (red-topped stack) tops out at height 2 under the stacking rules
(§ Stacking rules above) — Beaver's h3 tier can never trigger, but is kept in the
implementation for fidelity to the physical card text. Deer and Ram omit an h1 tier
(h1 trees/mountains earn nothing from those spirits).

**Format:** `<condition>: <points> | <condition>: <points> | ...`  
Conditions: `h1` / `h2` / `h3` (height), or landscape type like `blue`.

### Group-Based Spirits (5 cards)

Score connected groups of a landscape (hex-adjacency, same `connectedComponents`
helper used for fields/mountains/islands), with point values that vary by **group
size**. Points accumulate for every matching group on the board.

| Spirit ID | Name | Scoring Rule |
|-----------|------|--------------|
| spi_002 | Lion | 1-2 yellows: 2 pts per group \| 3+ yellows: 10 pts per group |
| spi_003 | Butterfly | 1+ yellows: 5 pts per group |
| spi_004 | Dragonfly | 2+ blues: 7 pts per group |
| spi_007 | Stork | 2+ buildings: 6 pts per group |
| spi_008 | Cat | 1+ buildings: 4 pts per group |

**Format:** `<group-size-range>: <points> | <group-size-range>: <points> | ...`  
Ranges: `1-2`, `3+`, `1+`, or specific numbers. A group below the threshold (e.g. a
lone blue for Dragonfly, which needs 2+) scores 0 from that spirit.

**Gating mechanic:** A spirit card has exactly **one** cube. The bonus applies only
if that cube was placed on the board during play. If placed, every matching instance
across the board counts (not just the placement-requirement instance). Entry is
manual: which spirit (or none) and whether the cube was placed (yes/no).

**Status**: All values verified against physical cards (2026-07).
