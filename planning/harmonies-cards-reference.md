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

| Spirit ID | Name | Mode | Replaces | Scoring Rule | Example |
|-----------|------|------|----------|--------------|---------|
| spi_001 | Owl (add) | add | — | +1 point per bush on board | Normal bushes score normally; Owl adds 1 per bush |
| spi_002 | Lion (replace) | replace | fields | 2 pts per field of 1-2 yellows; 10 pts per field of 3+ yellows | Instead of 5 per group, score by group size |
| spi_003 | Butterfly (replace) | replace | fields | 5 pts per field (including singles) | Unlike base (no singles), Butterfly scores all yellows |
| spi_004 | Dragonfly (add) | add | — | +2 points per blue token | Rivers unchanged; spirit adds bonus |
| spi_005 | Frog (add) | add | — | +1 point per tree | Trees unchanged; spirit adds bonus |
| spi_006 | Heron (replace) | replace | mountains | 1 pt per mountain, no adjacency requirement | Mountains score even if isolated |
| spi_007 | Stork (add) | add | — | +1 point per building | Buildings unchanged; spirit adds bonus |
| spi_008 | Cat (replace) | replace | buildings | 10 pts per building with 2+ neighbor colors; 5 pts with 1 color | Easier threshold for buildings |
| spi_009 | Squirrel (add) | add | — | +1 point per tree | Trees unchanged; spirit adds bonus |
| spi_010 | Badger (replace) | replace | animals | +3 points per animal card placed | Animal scoring increases |

**Mode interpretation:**
- **add**: Spirit points are in ADDITION to normal scoring. Base categories unchanged; spirit row gets the bonus.
- **replace**: Spirit REPLACES the named category entirely. That category shows 0 in the breakdown; spirit row shows the replacement score.

**Status**: All values are PLACEHOLDER — to be replaced when user provides real card data.
