# Multi-Game Architecture: Core vs. Game Modules

## 1. Why this doc exists

The MVP spec (`harmonies-scorer-spec.md`) builds a single-game app. This doc proposes
restructuring the same build so Harmonies is the **first plugin**, not a special case
— so a future 2D game (no stacking, different grid, different scoring) drops in as a
new folder without touching shared code. This changes *how the MVP is organized*, not
*what it does*. Adopt this from Milestone 1, not as a later refactor — retrofitting an
interface boundary after the logic already assumes hexes and stacking is much more
expensive than drawing the line now.

## 2. The boundary: `core/` vs `games/<id>/`

```
/core
  /vision     — calibration, grid sampling, classifier interface     (game-agnostic)
  /ui         — generic board renderer, correction UI, reveal engine (game-agnostic)
  /storage    — save/load, high scores, keyed by game id             (game-agnostic)
  /types      — the GameModule contract itself
/games
  /harmonies
    topology.ts   — hex grid, adjacency, stacking rules
    tokens.ts     — the 6-color vocabulary + swatch data
    rules.ts      — score() — the pure scoring engine (as already spec'd)
    config.ts     — GameConfig schema: spirit, animal cards
    reveal.ts      — category order + flavor text for the M6 reveal
    tests/
  /some-future-game
    topology.ts   — e.g. a square grid, or an irregular region map
    tokens.ts     — that game's own vocabulary (colors, icons, whatever)
    rules.ts
    config.ts
    reveal.ts
    tests/
/app
  game-select screen → routes into whichever /games/<id> is chosen
```

**Rule of thumb for reviewing any PR:** if a change to support a new game requires
editing anything under `/core`, the abstraction has a leak. Fixing that leak (by
generalizing the interface) is worth doing immediately, not deferring.

## 3. The `GameModule` contract

This is the interface every game — Harmonies included — implements. Core code is
written once, against this interface, and never against Harmonies specifically.

```
GameModule = {
  id: string,
  name: string,

  board: {
    topology: BoardTopology,      // see §4 — grid shape + adjacency, generalized
    tokenVocabulary: TokenDef[],  // see §5 — colors/icons + how to classify them
    allowsStacking: boolean,      // false for most future 2D games
    maxStackHeight?: number       // Harmonies: 3; most games: 1 (unused if false)
  },

  score: (boardState: BoardState, config: GameConfig) => ScoreBreakdown,
  configSchema: ConfigSchema,     // see §6 — drives a generic config-entry UI
  revealSequence: RevealSpec[]    // see §7 — category order + flavor text
}
```

`BoardState`, `ScoreBreakdown`, `Cell` stay as **generic shapes** (defined once in
`core/types`), parameterized by whatever `TokenId` and category names a given game
uses — not redefined per game.

## 4. Generalizing the board (`BoardTopology`)

Today's spec bakes in axial `(q, r)` hex coordinates and hex adjacency. Generalize to:

```
BoardTopology = {
  shape: "hex" | "square" | "custom",
  cells: CellId[],                       // the fixed, valid set of cell ids
  neighbors: (cellId: CellId) => CellId[], // adjacency — 6 for hex, 4/8 for square,
                                          //   arbitrary graph for "custom"
  cellCenterPx: (cellId, calibration) => {x, y}  // for the vision sampler
}
```

- **Hex** (Harmonies): axial coords, 6-neighbor adjacency — exactly what's already
  spec'd, just moved behind this interface instead of being the only option.
- **Square grid** (likely most future games): `(x, y)` coords, 4- or 8-neighbor
  adjacency — a few lines of code, same interface.
- **Custom** (irregular boards, e.g. a map with named regions): `cells` is a list of
  region ids, `neighbors` is a hand-authored adjacency graph, and `cellCenterPx` comes
  from tapping each region once during a per-game calibration step (same *mechanism*
  as Harmonies' corner-tap, just region-tap instead of corner-tap).

Every `core/ui` component (board renderer, correction UI, reveal highlighter) draws
from `topology.cells` and `topology.neighbors` generically — it never assumes hex.

## 5. Generalizing tokens & classification

Harmonies uses 6 flat colors. A future game might use colors, icons, numbers, or
symbols. Split "what a token *is*" from "how you *classify* it":

```
TokenDef = { id: string, label: string, referenceSwatch: ColorLab | ImagePatch }

TokenClassifier = (sampledPatch: ImageData, vocabulary: TokenDef[]) => TokenId
```

Ship one default classifier — nearest-swatch color distance in Lab space, exactly
what's already spec'd for Harmonies — and use it for any future game whose tokens are
also flat colors (a lot of tile-laying games qualify). If a later game needs shape or
icon recognition instead of color, that's a **new classifier implementation** behind
the same interface; `core/vision`'s calibration and sampling code doesn't change at
all, only which classifier function gets plugged in.

## 6. Generalizing config (cards, tracks, expansions)

Harmonies needs animal cards + a Nature's Spirit picker. A future game will need its
own, different extra state, and hand-building bespoke config UI per game defeats the
point of this doc. Instead, each game supplies a small schema, and `core/ui` renders a
generic form from it:

```
ConfigSchema = ConfigField[]
ConfigField =
  | { type: "picker", id, label, options: string[] }         // e.g. spirit choice
  | { type: "counterList", id, label, items: CatalogEntry[] } // e.g. animal cards + cubes
  | { type: "toggle", id, label }
```

`core/ui` renders whatever field types a game declares; the game module never writes
UI code, only data. This is the same principle as the vision layer: mechanism in
core, specifics in data.

## 7. Generalizing the scoring reveal (ties to Section 14 of the main spec)

`ScoreBreakdown` becomes a generic list, not a fixed Harmonies-shaped object:

```
ScoreBreakdown = {
  categories: {
    id: string, label: string, points: number, cells: CellId[]
  }[],
  total: number
}

RevealSpec = { categoryId: string, flavorText: string[], soundCue: string }
```

`core/ui`'s reveal engine walks `categories` in the order the game module declares via
`revealSequence`, highlighting each category's `cells` on the generic board renderer
and playing whatever `soundCue` is named. None of the drumroll/highlight/sound
sequencing logic is Harmonies-specific — only the category list and flavor text are.

## 8. Non-spatial games (a flag worth adding now)

Not every future game will have a photographable spatial board — some are pure
card/track games with no grid at all. Rather than force everything through the vision
pipeline, add one capability flag:

```
GameModule.hasVisualBoard: boolean
```

If `false`, the app skips calibration/vision/correction entirely and goes straight to
manual entry via `configSchema` (Section 6) for the whole board state, not just extra
cards. This means the same app shell can eventually host a scorer for a game with no
board photo at all, without a separate app.

## 9. What this changes about the MVP build plan

Nothing about *what* gets built changes — same milestones, same rules, same reveal
animation. What changes is **where the lines are drawn** while building it:

- M1's scoring engine is written as `games/harmonies/rules.ts` implementing
  `score(boardState, config) => ScoreBreakdown` against the generic shapes from day
  one, not a Harmonies-only type.
- M4/M5's vision code is written against `BoardTopology` and `TokenClassifier`
  interfaces, with Harmonies' hex/6-color specifics supplied as *data* in
  `games/harmonies/topology.ts` and `tokens.ts` — not inlined into `core/vision`.
- M6's reveal engine is written against `ScoreBreakdown.categories` generically, with
  Harmonies' category order and flavor text living in `games/harmonies/reveal.ts`.

## 10. A deliberate non-goal (avoid over-building)

Don't build a plugin marketplace, dynamic game-loading, or a generic "game builder" UI
— there's no second game yet, and designing for imagined requirements you can't yet
test against is how personal projects stall. The concrete, worthwhile scope is just:
**one clean interface, one real implementation (Harmonies), folder discipline that
keeps `core/` honest.** When you actually pick a second game, the interface will get
exercised for real and you'll find out what it's still missing — which is the point at
which it's worth extending, not before.
