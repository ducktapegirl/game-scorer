# Harmonies Cards Reference (M3 Placeholder Data)

**IMPORTANT: This is temporary placeholder data to unblock M3 implementation.**
Real card values will be provided by the user and transcribed here (data-only update).

## Animal Cards (32 cards)

| Card ID | Name | Cubes | Track Values | Source |
|---------|------|-------|--------------|--------|
| ani_001 | Ant | 3 | 1, 3, 5 | PLACEHOLDER |
| ani_002 | Antelope | 4 | 1, 2, 4, 6 | PLACEHOLDER |
| ani_003 | Bear | 4 | 2, 4, 6, 8 | PLACEHOLDER |
| ani_004 | Bird | 3 | 1, 2, 4 | PLACEHOLDER |
| ani_005 | Butterfly | 2 | 3, 5 | PLACEHOLDER |
| ani_006 | Cat | 3 | 2, 4, 6 | PLACEHOLDER |
| ani_007 | Crab | 3 | 1, 3, 4 | PLACEHOLDER |
| ani_008 | Crow | 2 | 2, 4 | PLACEHOLDER |
| ani_009 | Deer | 4 | 1, 3, 5, 7 | PLACEHOLDER |
| ani_010 | Dolphin | 3 | 2, 5, 7 | PLACEHOLDER |
| ani_011 | Eagle | 3 | 3, 5, 7 | PLACEHOLDER |
| ani_012 | Elephant | 4 | 2, 4, 6, 8 | PLACEHOLDER |
| ani_013 | Fennec Fox | 2 | 1, 3 | PLACEHOLDER |
| ani_014 | Flamingo | 3 | 1, 3, 5 | PLACEHOLDER |
| ani_015 | Frog | 3 | 1, 2, 4 | PLACEHOLDER |
| ani_016 | Giraffe | 4 | 1, 4, 7, 10 | PLACEHOLDER |
| ani_017 | Gorilla | 3 | 2, 5, 8 | PLACEHOLDER |
| ani_018 | Hedgehog | 2 | 1, 3 | PLACEHOLDER |
| ani_019 | Hippo | 4 | 3, 5, 7, 10 | PLACEHOLDER |
| ani_020 | Hummingbird | 2 | 2, 3 | PLACEHOLDER |
| ani_021 | Lemur | 3 | 1, 2, 3 | PLACEHOLDER |
| ani_022 | Lion | 4 | 2, 5, 8, 11 | PLACEHOLDER |
| ani_023 | Meerkat | 3 | 1, 4, 6 | PLACEHOLDER |
| ani_024 | Mouse | 3 | 1, 2, 3 | PLACEHOLDER |
| ani_025 | Otter | 3 | 2, 4, 6 | PLACEHOLDER |
| ani_026 | Owl | 3 | 1, 4, 7 | PLACEHOLDER |
| ani_027 | Peacock | 4 | 2, 5, 8, 10 | PLACEHOLDER |
| ani_028 | Penguin | 3 | 2, 4, 6 | PLACEHOLDER |
| ani_029 | Rabbit | 2 | 1, 2 | PLACEHOLDER |
| ani_030 | Raccoon | 3 | 1, 3, 5 | PLACEHOLDER |
| ani_031 | Squirrel | 3 | 1, 2, 4 | PLACEHOLDER |
| ani_032 | Turtle | 3 | 1, 3, 5 | PLACEHOLDER |

**Track interpretation:** `Track Values` = points visible in the topmost uncovered cube slot.
For a card with track `[1, 3, 5]`:
- 0 cubes placed → score 0
- 1 cube placed → score 1 (first slot uncovered)
- 2 cubes placed → score 3 (second slot uncovered)
- 3 cubes placed → score 5 (third slot uncovered, all cubes placed → no more uncovered slots, score is last value)

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
