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

| Spirit ID | Name | Type | Scoring Rule | Example |
|-----------|------|------|--------------|---------|
| spi_001 | Owl | Per-feature bonus | +3 points per bush (height-1 tree) on board | Normal bushes score 1 each; Owl adds 3 per bush |
| spi_002 | Lion | Group-size bonus | +2 pts per group of 1–2 yellows; +10 pts per group of 3+ yellows | Groups scored by size, base 5-per-group still applies |
| spi_003 | Butterfly | Group-size bonus | +5 points per field (including lone yellows) | Even singles count toward spirit bonus |
| spi_004 | Dragonfly | Per-feature bonus | +2 points per blue token | River unchanged; spirit adds on top |
| spi_005 | Frog | Per-feature bonus | +1 point per tree (green-topped stack, any height) | Trees unchanged; spirit adds on top |
| spi_006 | Heron | Per-feature bonus | +1 point per mountain (gray-topped stack, any height), no adjacency requirement | All mountains count; base adjacency rule still applies |
| spi_007 | Stork | Per-feature bonus | +1 point per building (red-topped stack) | Buildings unchanged; spirit adds on top |
| spi_008 | Cat | Threshold bonus | +10 pts per building with 2+ neighbor colors; +5 pts with 1 color | Easier threshold than base (3 colors); both rules apply |
| spi_009 | Squirrel | Per-feature bonus | +1 point per tree (green-topped stack, any height) | Trees unchanged; spirit adds on top |
| spi_010 | Badger | Per-feature bonus | +3 points per tree (green-topped stack), any height | All tree heights count equally; base 1/3/7 still applies |

**Gating mechanic:** A spirit card has exactly **one** cube. The bonus applies only if that cube was placed on the board during play. If placed, every matching instance across the board counts (not just the placement-requirement instance). Entry is manual: which spirit (or none) and whether the cube was placed (yes/no).

**Status**: All values are PLACEHOLDER — to be replaced when user provides real card data.
