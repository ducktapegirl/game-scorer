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

**IMPORTANT: Spirit data below is still PLACEHOLDER** — real Nature's Spirit values
have not yet been provided. To be replaced when the user supplies them (data-only
update to this file and `games/harmonies/spirits.ts`).

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
| spi_010 | Badger (replace) | replace | trees | 3 pts per tree (green-topped stack), any height | Flat rescore of trees, ignoring height |

**Mode interpretation:**
- **add**: Spirit points are in ADDITION to normal scoring. Base categories unchanged; spirit row gets the bonus.
- **replace**: Spirit REPLACES the named category entirely. That category shows 0 in the breakdown; spirit row shows the replacement score.
