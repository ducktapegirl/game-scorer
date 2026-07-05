# Milestone 1 Plan — Harmonies Data Model + Pure Scoring Engine

## Context

Personal web app that scores the board game *Harmonies* from a calibrated photo.
The repo currently contains only planning docs (`planning/harmonies-scorer-spec.md`,
`planning/harmonies-rules-reference.md`, `planning/harmonies-multigame-architecture.md`).
This session builds **Milestone 1 only**: the generic data model and the pure
`score(boardState, config) → ScoreBreakdown` engine, fully unit-tested, no UI, no
camera. It is built against the `core/` vs `games/harmonies/` split from the
architecture doc from day one, so Harmonies is the first plugin, not a special case.
**Both board sides** are implemented from the start: Side A (river, 5-4-5-4-5 = 23
cells) and Side B (islands, 4-3-4-3-4-3-4 = 25 cells).

Work happens on branch `claude/harmonies-m1-data-engine-2yuauo`; ship when
`npm test` and `npm run build` are green, then commit and push.

## Design decisions (reconciling the docs)

1. **Generic `ScoreBreakdown`** (architecture doc §7 wins over spec §3.3): a
   `categories: {id, label, points, cells}[]` list + `total`, defined once in
   `core/types`. Harmonies emits fixed category ids `trees, mountains, fields,
   buildings, water, animals, spirit`. Populating `cells` (which cells contributed)
   from M1 is nearly free — the scoring code is already component-based — and
   pre-solves the M6 reveal schema change the spec warns about.
2. **Topology is per-variant.** The architecture's `GameModule.board.topology` is a
   single object, but Harmonies has two board shapes. Small deliberate extension:
   `topology(variant: string): BoardTopology` — single-board games ignore the arg.
3. **Coordinates:** columns of hexes, column `c` = axial `q`, offset-to-axial
   `r = row - floor(q/2)`. `CellId = "q,r"` string. Side A column heights
   `[5,4,5,4,5]`, Side B `[4,3,4,3,4,3,4]`. The exact axial assignment is an
   internal convention (documented in `topology.ts`); scoring only depends on the
   adjacency graph. Pixel mapping (`cellCenterPx`) is deferred to M4.
4. **Graph algorithms live in `core/graph.ts`** (connected components, BFS
   distances, component token-diameter) written purely against
   `(cells, neighbors)` — game-agnostic mechanism, per the core/games principle
   and the spec's "one shared adjacency helper" note.
5. **M1 stubs:** `GameConfig` (spirit + animal cards) is fully typed and accepted
   by `score()`, but `animals` and `spirit` categories score 0 until M3.
6. **`npm run build` gate:** `tsc --noEmit && vite build` with a trivial plain
   `index.html` stub (black text on white, no CSS) so the build gate exists from M1;
   the real UI is M2.

## 1. File/folder structure to create

```
package.json              — scripts: test (vitest run), build (tsc --noEmit && vite build), dev (vite)
tsconfig.json             — strict TypeScript
vite.config.ts            — Vite + Vitest config (test.include games/**/tests)
index.html                — plain M1 stub page (no styling)
.gitignore                — node_modules, dist
CLAUDE.md                 — commands + conventions (draft below)
core/
  types/index.ts          — CellId, TokenId, Cell, BoardState, ScoreCategory,
                            ScoreBreakdown, BoardTopology, TokenDef,
                            ConfigSchema/ConfigField, GameModule
  graph.ts                — connectedComponents(), shortestPathDistances(),
                            componentTokenDiameter() over (CellId[], neighbors fn)
games/
  harmonies/
    topology.ts           — board shapes A/B from column heights, axial adjacency,
                            cellId helpers, validateStack() (stacking rules)
    tokens.ts             — TokenColor union + TokenDef list (swatch data left as
                            placeholders until M4 calibration)
    config.ts             — HarmoniesConfig: spirit ("none" | SpiritCardId),
                            AnimalCardEntry[]; ConfigSchema stub for M3
    rules.ts              — score(board, config) → ScoreBreakdown (the M1 deliverable)
    index.ts              — assembles the Harmonies GameModule object
    tests/
      helpers.ts          — board-builder utilities (place(q, r, ...stack), board side)
      topology.test.ts
      trees.test.ts
      mountains.test.ts
      fields.test.ts
      buildings.test.ts
      water-side-a.test.ts
      water-side-b.test.ts
      score.test.ts       — integration: full board, breakdown, total
```

Not created in M1 (exist only when their milestone needs them): `core/vision`,
`core/ui`, `core/storage`, `app/`, `games/harmonies/reveal.ts`.

## 2. TypeScript types

```ts
// core/types/index.ts — generic shapes, defined once, never Harmonies-specific
export type CellId = string;
export type TokenId = string;

export interface Cell<T extends TokenId = TokenId> {
  id: CellId;
  stack: T[];                       // bottom-to-top; [] = empty
}

export interface BoardState<V extends string = string, T extends TokenId = TokenId> {
  boardSide: V;                     // Harmonies: "A" | "B" (set manually, per spec §3.1)
  cells: Cell<T>[];
}

export interface ScoreCategory {
  id: string;
  label: string;
  points: number;
  cells: CellId[];                  // contributing cells — drives the M6 reveal
}

export interface ScoreBreakdown {
  categories: ScoreCategory[];
  total: number;                    // always the sum of categories[].points
}

export interface BoardTopology {
  shape: "hex" | "square" | "custom";
  cells: CellId[];                  // the fixed valid cell set
  neighbors(id: CellId): CellId[];  // hex: up to 6, filtered to valid cells
  // cellCenterPx added in M4 (vision) — omitted now to avoid a dead placeholder
}

export interface TokenDef {
  id: TokenId;
  label: string;
  referenceSwatch?: unknown;        // Lab swatch data lands in M4 calibration
}

export type ConfigField =
  | { type: "picker"; id: string; label: string; options: string[] }
  | { type: "counterList"; id: string; label: string; items: { id: string; label: string }[] }
  | { type: "toggle"; id: string; label: string };
export type ConfigSchema = ConfigField[];

export interface GameModule<
  B extends BoardState = BoardState,
  C = unknown,
> {
  id: string;
  name: string;
  hasVisualBoard: boolean;
  board: {
    topology(variant: B["boardSide"]): BoardTopology;
    tokenVocabulary: TokenDef[];
    allowsStacking: boolean;
    maxStackHeight?: number;        // Harmonies: 3
  };
  score(board: B, config: C): ScoreBreakdown;
  configSchema: ConfigSchema;
  // revealSequence added in M6
}
```

```ts
// games/harmonies/tokens.ts
export type TokenColor = "blue" | "gray" | "brown" | "green" | "yellow" | "red";

// games/harmonies/config.ts
export type SpiritCardId = string;          // real catalog lands in M3
export interface AnimalCardEntry { cardId: string; cubesPlaced: number; }
export interface HarmoniesConfig {
  spirit: "none" | SpiritCardId;
  animalCards: AnimalCardEntry[];
}

// games/harmonies — board state
export type BoardSide = "A" | "B";
export type HarmoniesBoardState = BoardState<BoardSide, TokenColor>;

// games/harmonies/rules.ts
export function score(board: HarmoniesBoardState, config: HarmoniesConfig): ScoreBreakdown;
```

`topology.ts` also exports `validateStack(stack: TokenColor[]): boolean` encoding the
stacking rules from the rules reference (gray-on-gray max 3; ≤2 brown; one green on
0–2 brown, never on green; red on exactly one brown/gray/red, never 3rd token; blue and
yellow ground-only). Used by tests to keep hand-authored boards legal, and reused by
the M2/M5 correction UI later.

## 3. Scoring rules to implement (from the rules reference — single source of truth)

- **Trees:** green-topped stack, points by height 1/2/3 → 1/3/7. Brown-only stacks = 0.
- **Mountains:** gray stack scores by height 1/2/3 → 1/3/7 **only if** hex-adjacent to
  ≥1 other gray-topped cell (any height, including lone height-1 gray); else 0.
- **Fields:** each connected component of ≥2 yellow cells = 5 points, any size; lone yellow = 0.
- **Buildings:** red-topped cell = 5 if the **top tokens** of its neighbors show ≥3
  distinct colors (neighboring red counts; empty cells don't); else 0.
- **Water Side A (river):** connected components of blue; each component's length =
  **token-diameter** (max over pairs of the shortest-path token count) — not token count.
  Points by length: 1→0, 2→2, 3→5, 4→8, 5→11, 6→15, 7+→15+4·(len−6). Score **only the
  best-scoring component**.
- **Water Side B (islands):** connected components of non-blue cells (empty cells count
  as land) = islands; 5 per island; minimum 1 island even with no water.
- **Animals / Spirit:** categories present in the breakdown, always 0 in M1 (M3 scope).
- `total` = sum of all category points.

## 4. Test cases (write tests first, then implement)

**topology.test.ts**
- Side A has exactly 23 cells; Side B exactly 25.
- Adjacency is symmetric and every neighbor is a valid cell; no cell has >6 neighbors.
- Spot-checks: an interior cell has 6 neighbors; corner cells have 2–3.
- `validateStack`: accepts `[green]`, `[brown,green]`, `[brown,brown,green]`,
  `[gray,gray,gray]`, `[brown,red]`, `[red,red]`; rejects green-on-green, 3 browns,
  anything on blue/yellow, red as 3rd token, height >3, gray under non-gray.

**trees.test.ts** — h1 bush = 1; green on 1 brown = 3; green on 2 brown = 7;
brown-only (h1 and h2) = 0; several trees sum; `cells` lists the tree cells.

**mountains.test.ts**
- Lone gray h3 = 0 (the no-adjacency case — the spec's "sad trombone").
- Two adjacent h1 grays = 1 + 1.
- **Flagged edge case:** h1 gray adjacent to h3 gray = 1 + 7 — the lone height-1 gray
  both scores and satisfies its neighbor's adjacency requirement.
- Two grays that are *not* adjacent = 0 total.
- Gray adjacent only to non-gray tokens = 0.

**fields.test.ts** — lone yellow = 0; pair = 5; group of 5 = 5 (size-independent);
two separate pairs = 10; the same cells joined by a connecting yellow = 5 (merged,
not double-counted).

**buildings.test.ts** — neighbors showing 3 distinct top colors = 5; exactly 2 = 0;
a neighboring red counts as one of the 3; only the **top** token counts (neighbor
`[brown,green]` reads as green); empty neighbors contribute nothing; edge-of-board
building with few neighbors; two buildings score independently.

**water-side-a.test.ts**
- Single blue = 0; straight rivers of length 2/3/4/5/6 → 2/5/8/11/15; length 8 → 23.
- **Mandated branching test:** a Y-shaped river of 7 tokens whose longest end-to-end
  shortest path is 5 tokens scores 11 — not the 19 a token count would give.
- Looping river: a 6-token ring has token-diameter 4 → 8 points, not 15.
- Two disjoint rivers (lengths 3 and 5) → only the best scores: 11.

**water-side-b.test.ts** — no blue at all → 1 island → 5; a blue line fully dividing
the board → 2 islands → 10; blue enclosing a pocket → 3 islands → 15; empty cells
count as island land.

**score.test.ts** — a full hand-authored Side A board exercising every category at
once, asserting the entire breakdown and `total` = sum; same `cells` on Side A vs
Side B produce different water scores and identical other categories; breakdown always
contains all 7 categories (animals/spirit = 0); config is accepted but inert in M1.

## 5. Tooling

- **Vite + Vitest** (per spec §12), TypeScript `strict`, no runtime dependencies —
  the engine stays pure and DOM-free so Vitest runs it in plain Node.
- Gates: `npm test` = `vitest run`; `npm run build` = `tsc --noEmit && vite build`.
- devDependencies only: `typescript`, `vite`, `vitest`.

## 6. CLAUDE.md draft (to be committed at repo root)

```markdown
# Harmonies Photo Scorer

Personal web app that scores the board game Harmonies from a calibrated photo.
Multi-game architecture: game-agnostic mechanism in `core/`, Harmonies specifics in
`games/harmonies/`. Planning docs in `planning/` — the rules reference is the single
source of truth for scoring values.

## Commands
- `npm test` — Vitest, must pass before any commit
- `npm run build` — typecheck (`tsc --noEmit`) + Vite build, must pass before any commit
- `npm run dev` — Vite dev server (UI milestones only)

## Architecture rules
- `core/` is game-agnostic. If supporting a game requires editing `core/`, the
  abstraction leaks — generalize the interface immediately, don't special-case.
- `games/harmonies/` implements the generic `GameModule` contract from `core/types`.
- The scoring engine (`games/harmonies/rules.ts`) is pure and dependency-free:
  no DOM, no image code, no network. It must stay testable in plain Node.
- Generic shapes (`BoardState`, `Cell`, `ScoreBreakdown`) live in `core/types` only —
  never redefine them per game.
- Scoring values come from `planning/harmonies-rules-reference.md` — never invent or
  "remember" rule values; read the file.

## Board facts
- Side A (river scoring): columns 5-4-5-4-5 = 23 hexes. Side B (islands): 4-3-4-3-4-3-4
  = 25 hexes. Axial `(q, r)`, `CellId = "q,r"`, adjacency in `games/harmonies/topology.ts`.
- `boardSide` is set manually by the user, never detected from the photo.
- Stacks are bottom-to-top arrays; only green/gray tops have scoring-relevant height.

## UI constraint (M2 onward)
**Keep all UI completely plain until explicitly asked otherwise**: black text on a
white background, browser-default everything, no custom CSS, no design system, no
styling pass. Function over form until the app works end to end. Visual polish is
out of scope until the user requests it.

## Milestones
M1 scoring engine (done when tests pass) · M2 manual board entry UI · M3 cards +
spirits · M4 vision · M5 correction/depth UI · M6 scoring reveal. Build only the
current milestone; don't scaffold ahead (e.g. no `core/vision` until M4).

## Workflow
- Work on the designated feature branch; never push to `main`.
- Commit after each green milestone gate.
- Animals/spirit categories exist in the breakdown from M1 but score 0 until M3.
```

## 7. Implementation order

1. Scaffold tooling (`package.json`, `tsconfig.json`, `vite.config.ts`, stub
   `index.html`, `.gitignore`) — verify `npm test` (empty) and `npm run build` run.
2. `core/types/index.ts` + `core/graph.ts`.
3. `games/harmonies/tokens.ts`, `config.ts`, `topology.ts`.
4. **Tests first**: all test files in §4 (they encode the rules reference).
5. `games/harmonies/rules.ts` until all tests pass; then `games/harmonies/index.ts`
   (GameModule assembly).
6. `CLAUDE.md`.
7. Gate: `npm test` && `npm run build` green → commit → push
   `-u origin claude/harmonies-m1-data-engine-2yuauo`.

## Verification

- `npm test` — full Vitest suite green, including the two flagged edge cases
  (lone-h1-gray mountain adjacency; branching-river diameter).
- `npm run build` — strict typecheck + Vite build green.
- Quick sanity: a small Node one-liner scoring a hand-built board via the exported
  `score()` to confirm the public API shape matches the plan.
