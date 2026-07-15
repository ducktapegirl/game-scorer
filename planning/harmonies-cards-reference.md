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

**All Nature's Spirit cards are purely additive.** None override or replace base terrain scoring; each layers bonus points on top of normal, unmodified scoring.

### Per-Landscape Spirits (5 cards)

Score individual landscapes, with point values that vary by **height or landscape type**. Points accumulate for every matching landscape on the board.

| Spirit ID | Name | Scoring Rule |
|-----------|------|--------------|
| spi_001 | Owl | h1 tree: 3 pts \| h2 tree: 3 pts \| h3 tree: 1 pt |
| spi_004 | Dragonfly | blue token: 2 pts |
| spi_005 | Frog | h1 tree: X pts \| h2 tree: X pts \| h3 tree: X pts |
| spi_009 | Squirrel | h1 tree: X pts \| h2 tree: X pts \| h3 tree: X pts |
| spi_010 | Badger | h1 tree: X pts \| h2 tree: X pts \| h3 tree: X pts |

**Format:** `<condition>: <points> | <condition>: <points> | ...`  
Conditions: `h1` / `h2` / `h3` (height), or landscape type like `blue token`, `red token`.

### Group-Based Spirits (5 cards)

Score connected groups of a landscape, with point values that vary by **group size**. Points accumulate for every matching group on the board.

| Spirit ID | Name | Scoring Rule |
|-----------|------|--------------|
| spi_002 | Lion | 1-2 yellows: 2 pts each \| 3+ yellows: 10 pts per group |
| spi_003 | Butterfly | 1+ yellows: 5 pts per group |
| spi_006 | Heron | 1+ mountains: 1 pt per group |
| spi_007 | Stork | 1+ buildings: X pts per group |
| spi_008 | Cat | 1+ buildings with 2+ neighbor colors: 10 pts \| 1+ buildings with 1 neighbor color: 5 pts |

**Format:** `<group-size-range>: <points> | <group-size-range>: <points> | ...`  
Ranges: `1-2`, `3+`, `1+`, or specific numbers.

**Gating mechanic:** A spirit card has exactly **one** cube. The bonus applies only if that cube was placed on the board during play. If placed, every matching instance across the board counts (not just the placement-requirement instance). Entry is manual: which spirit (or none) and whether the cube was placed (yes/no).

**Status**: All values are PLACEHOLDER except Owl (verified) — to be replaced when user provides real card data from rulebook/physical cards.
