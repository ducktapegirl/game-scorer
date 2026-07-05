# Harmonies Photo Scorer — Build Spec

## 1. Goal

Build an app that scores a game of *Harmonies* from a photo of a personal board. I
take a picture, the app reads the board, I correct any mistakes, and it produces a
scored breakdown. It must support the base game and the optional Nature's Spirit
module.

## 2. Core design principle (read this first)

This is **two independent systems** joined by one data structure. Do not blur them.

1. A **pure scoring engine**: `boardState + gameConfig → scoreBreakdown`. No image
   code. Fully unit-tested against known board→score examples.
2. A **vision + correction layer** that turns a photo into a `boardState`, which I
   then fix by hand before scoring.

The `boardState` object is the contract between them. Build the scoring engine and
its tests **first**, before any camera code exists.

### The occlusion constraint

Harmonies boards are 3D. A top-down photo shows the **top token** of each stack but
not what is underneath. Height affects scoring for trees and mountains. The design
resolves this with **manual depth annotation** (Section 7) rather than trying to
infer hidden tokens from the image.

### Future-proofing for other games

This app is designed to eventually host more than one game. The companion doc
**`harmonies-multigame-architecture.md`** defines a `core/` (game-agnostic: photo
calibration, board rendering, correction UI, scoring reveal, storage) vs.
`games/harmonies/` (this game's grid, tokens, and rules) split, with Harmonies as the
first implementation of a shared interface. **Build against that structure from M1
on** — the data model, scoring engine, and vision layer below are written as the
Harmonies *implementation* of generic contracts, not as Harmonies-only types. See
that doc before starting M1.

## 3. Data model

### 3.1 BoardState

The personal board is a fixed hex grid. Use **axial coordinates** `(q, r)` per cell.
Each cell holds an ordered stack of token colors, **bottom-to-top**.

```
TokenColor = "blue" | "gray" | "brown" | "green" | "yellow" | "red"

Cell = {
  q: int,
  r: int,
  stack: TokenColor[]   // bottom-to-top; empty [] = no token
}

BoardState = {
  boardSide: "A" | "B",   // A = river scoring, B = islands
  cells: Cell[]
}
```

Because the rules constrain composition, the vision layer only needs to detect the
**top** color per cell; the `stack` below it is reconstructed from the top color plus
a height (Section 7). Keep `stack` as the single source of truth — the height picker
just writes into it.

**`boardSide` is set manually, not detected.** Side A and side B boards differ in
printed art (river vs. coastline), not in color palette, so the vision classifier has
no basis to distinguish them — this is a one-time manual toggle, not a CV problem.
Ask it as a single "Side A / Side B" selector at the start of game setup, alongside
calibration — the same category of input as picking the spirit or entering cards.
Once set, it determines which branch of the water-scoring rule (Section 4) runs;
nothing else in `score()` depends on it.

### 3.2 GameConfig

```
AnimalCardEntry = {
  cardId: string,        // chosen from a fixed catalog
  cubesPlaced: int       // how many cubes I moved onto the board
}

GameConfig = {
  spirit: "none" | SpiritCardId,   // "none" == base game, no special-casing
  animalCards: AnimalCardEntry[]
}
```

Cards are **entered manually** (Section 6), not read from the photo.

### 3.3 ScoreBreakdown

Return a per-category breakdown, never just a total. This is what makes each rule
verifiable in isolation.

```
ScoreBreakdown = {
  trees: int,
  mountains: int,
  fields: int,
  buildings: int,
  water: int,
  animals: int,
  spirit: int,
  total: int
}
```

Scoring function signature:

```
score(boardState: BoardState, config: GameConfig) => ScoreBreakdown
```

## 4. Terrain scoring rules

The authoritative scoring values, stacking constraints, and edge cases live in the
companion file **`harmonies-rules-reference.md`**. Claude Code should read that file
and encode it; treat it as the single source of truth. The values there are confirmed
against the published rules — no `VERIFY` guesswork and no open edge cases remain;
all values, including the mountain-adjacency and branching-river rules, are confirmed.

Quick summary of what the engine computes (see the reference file for exact tables):

| Terrain | Scoring in brief |
|--------|------------------|
| **Trees** | green-topped stack by height: 1 / 3 / 7 for h1 / h2 / h3; brown-only = 0 |
| **Mountains** | gray stack by height: 1 / 3 / 7; but **0 unless hex-adjacent to another mountain** |
| **Fields** | 5 per group of 2+ contiguous yellow, any size; lone yellow = 0 |
| **Buildings** | 5 if the top tokens of hex neighbors show 3+ different colors; else 0 |
| **Water A (river)** | best river only, by shortest-path length: 2→2, 3→5, 4→8, 5→11, 6→15, +4 each beyond 6 |
| **Water B (islands)** | 5 per island; always ≥ 1 |

Implementation notes:
- "Contiguous" / "adjacent" use hex adjacency (6 neighbors) on `(q, r)`.
- Fields, mountain-adjacency, islands, and rivers are all **connected-component /
  graph** problems on the hex grid — write one shared adjacency helper.
- Building color check reads the **top** of each of the 6 neighbors.
- The river is a **graph-diameter** problem, not a token count — see the reference
  file's implementation note and write a branching-river test.

## 5. Nature's Spirit — pluggable scoring modifiers

Do **not** write two scoring engines. Base terrain scoring always runs. A spirit is
an **optional modifier** plugged in via `config.spirit`. Base game is simply
`spirit: "none"`.

Model each of the 10 spirit cards as an independent modifier:

```
SpiritModifier = (boardState, baseBreakdown) => spiritPoints: int
```

Critical distinction to encode per card, straight from the rulebook: does the spirit
**add to** the base rule or **replace** it?
- *Additive example (owl):* normal bush scoring stays; add extra points per bush.
- *Replacing example (lion):* fields are rescored by group size instead of the base
  rule.

Encode each card's exact behavior and mark which mode it is. Getting add-vs-replace
wrong is the most likely scoring bug.

## 6. Animal & Spirit cards — manual entry

There are 32 animal cards and 10 spirit cards with unique patterns and scoring
tracks; recognizing them from a photo is high-effort, low-payoff. Instead:

- Let me pick which spirit (or none) and which animal cards I hold from a catalog.
- For each animal card, I enter **cubes placed**; the app scores it from the card's
  track (highest uncovered number). Store the catalog (id, name, track values) as
  data — `VERIFY` values from the cards.

## 7. Manual depth annotation

The rules make this cheap: only **green-topped** and **gray-topped** cells have
scoring-relevant hidden depth.

- **Green top:** h1 = lone bush; h2 = green on 1 brown; h3 = green on 2 brown.
- **Gray top:** h1 = single gray; h2/h3 = mountain.
- **Yellow / blue:** always ground level, height 1.
- **Red (building):** sits on one covered token, but its points depend only on
  neighbors, so the covered token is scoring-irrelevant — default it and move on.

UX: after color detection, prompt for a height (1–3) **only** on green and gray
cells. Default to 1, tap to raise. The picker writes the full `stack` array. If an
angled photo is added later, pre-fill the guessed height and I only fix the misses.

## 8. Vision pipeline — calibrated computer vision, no API calls

No LLM, no external API, no network call, no API key. This works because the problem
is much narrower than general image recognition: a fixed hex grid, six known colors,
and a photo of an object I control the lighting and angle of. Classical CV solves this
reliably and runs entirely client-side.

**Pipeline:**

1. **Corner calibration (manual, once per photo).** I tap the four corners of the
   board in the photo. Compute a **homography** (perspective-transform matrix) from
   those four points to a flat rectangular target. This is the load-bearing step:
   once warped, every hex cell's center lands at a fixed, predictable pixel location,
   because the physical board's geometry never changes.
2. **Warp the photo** into that flat top-down view using the homography.
3. **Sample each cell.** For each of the board's fixed `(q, r)` cells, compute its
   known pixel center in the warped image and average the color over a small patch
   there (median of a small window is more robust to noise/glare than a single pixel).
4. **Classify by nearest reference color.** Compare each sampled patch (in a
   perceptual color space, e.g. Lab, not raw RGB) against 7 reference swatches: the 6
   token colors plus "empty board." Nearest-swatch match wins. Calibrate the swatches
   from a couple of reference photos taken in typical lighting, rather than hardcoding
   arbitrary RGB values.
5. **Emit a proposed `BoardState`** with height-1 stacks for every non-empty cell.
   Depths get filled in by manual annotation (Section 7), colors get fixed via
   correction (Section 9).

**Implementation:** do this with the HTML Canvas API directly, optionally backed by
OpenCV.js for the homography math (`cv.getPerspectiveTransform` /
`cv.warpPerspective`) if hand-rolling the linear algebra is more friction than it's
worth. Both run fully in-browser with no server component.

**Why this beats an LLM call for this project:** it's free forever (no per-scan
cost), deterministic (a misclassified cell can be debugged by inspecting its actual
sampled color against the swatches, rather than guessing at an opaque model's
reasoning), works offline, and it removes the API-key-on-a-static-site problem
entirely — there's no secret to protect because nothing calls out over the network.

**Known limitation to design around:** classification quality depends on consistent,
even lighting and a clean calibration tap. Build the correction UI (Section 9) as a
first-class part of the app, not an afterthought — it's the safety net for the color
misreads this approach will occasionally produce, and it's needed anyway for depth.

## 9. Human-in-the-loop correction

This is what makes the app usable rather than a CV research project. After the vision
step, show the proposed board overlaid on the photo. Let me tap any cell to fix its
color, set green/gray heights, or mark empty. **Then** score. Reuse the manual board
entry UI from Milestone 2 as this correction surface.

## 10. Build plan (milestones)

**Folder structure from the start:** organize as `core/` + `games/harmonies/` per
`harmonies-multigame-architecture.md`, not a flat structure. Each milestone below
lands in the file it names in that doc's layout (e.g. M1 → `games/harmonies/rules.ts`
implementing the generic `score()` contract).

**M1 — Scoring engine + data model.** Implement Section 3 types and the pure
`score()` function for all base terrain. Unit tests from known board→score examples.
No UI, no camera. Ship when tests pass.

**M2 — Manual board entry UI.** Enter a board by hand into a `BoardState` and score
it. This doubles as the correction surface later. Include a **required Side A / Side
B prompt** before scoring — a simple two-option selector shown once per game, blocking
score calculation until answered, since `score()` can't run the correct water rule
without it (see Section 3.1).

**M3 — Cards + Spirit.** Card catalog, manual card entry, spirit modifiers. Extend
`score()` to fill `animals` and `spirit`.

**M4 — Vision layer.** Photo → proposed `BoardState` (top colors only).

**M5 — Correction + depth annotation.** Overlay, tap-to-fix, green/gray height
picker, then score.

Each milestone is a separate, shippable deliverable.

## 11. Testing

- The scoring engine must have unit tests with hand-authored boards and expected
  breakdowns, including edge cases: lone gray mountain scoring 1 point when adjacent
  to another mountain, mountains with/without adjacency,
  separate vs merged yellow groups, a building with exactly 2 vs 3 neighbor colors,
  base game vs each spirit, add-vs-replace spirits.
- Keep vision accuracy out of these tests — the engine is deterministic and must be
  provably correct independent of the camera.

## 12. Tech stack & hosting

This is a **static website**, not a native app — a mobile-friendly single-page app
that runs entirely in the phone browser and accepts a camera photo via a file input
(`<input type="file" accept="image/*" capture="environment">`). No backend.

**Host on GitHub Pages** (preferred). No server-held secrets are needed at all — the
vision pipeline is pure client-side computer vision (Section 8), so this is a purely
static site with zero backend dependencies. Setup details to bake into the plan:

- A project site is served from `https://<user>.github.io/<repo>/`, so the app runs
  under a sub-path. Set the build **base path** accordingly (e.g. Vite
  `base: '/<repo>/'`) or assets 404. A `<user>.github.io` user/org repo serves at root
  and avoids this.
- For client-side routing, add a `404.html` fallback (copy of `index.html`) or use
  hash routing, since Pages has no server rewrites.
- Deploy via a **GitHub Actions workflow** (build → upload → deploy to Pages) rather
  than committing build output.
- Camera capture requires HTTPS; Pages serves HTTPS by default, so this is fine.

Netlify isn't needed for this project — there's no server-held secret to justify it,
since the whole pipeline (scoring engine and vision) runs in the browser.

Other:

- Scoring engine as a standalone, pure, dependency-free module so it can be tested in
  isolation (Node, no DOM) and reused.
- Persist saved games as serialized `BoardState + GameConfig` in `localStorage`.
- Pick a build tool with a fast test runner (e.g. Vite + Vitest) so Milestone gates
  are a single `npm test` / `npm run build` — this matters for Auto mode (Section 13).

## 13. Running this build with Claude Code (Auto mode + model)

Auto mode is a permission mode: a background classifier auto-approves low-risk actions
(file edits, reads, running tests and builds) and blocks risky ones (deploys,
force-push, `curl | bash`, mass deletion), and it nudges Claude to keep working instead
of stopping to ask. It works best when following a **thoroughly checked plan** in a
repo it can safely touch — which is exactly what this spec is for. This project is a
good Auto-mode fit because the risky-action surface is tiny (a static site, no deploys,
no infra). Structure the work so Auto mode runs well:

1. **Automated gate per milestone.** Each milestone must end in an objective check
   Claude can run itself without asking: `npm test` and `npm run build` pass. State the
   exact commands here and in `CLAUDE.md`. Auto mode's value collapses without a green
   check to converge on.
2. **Test-first.** Have it write the M1 scoring tests from `harmonies-rules-reference.md`
   *before* the implementation, including the flagged edge cases. Tests are the spec
   Auto mode executes against.
3. **Remove ambiguity up front.** Auto mode won't stop to ask, so anything vague gets
   guessed. The rules-reference file and the resolved decisions below exist to prevent
   invented values. Pin the board shape before starting M4/M5.
4. **Commit + branch discipline.** Tell it to commit after each green milestone and to
   work on a dedicated branch. Auto mode won't force-push or touch protected branches,
   so `main` stays safe and you can review or `/rewind`.
5. **Plan first, then Auto.** Recommended loop: run the spec through **Plan mode**
   (read-only) first, review the plan, then switch to Auto mode to execute. Add a
   `CLAUDE.md` with build/test commands, conventions, and forbidden actions.

**Model — where Fable helps.** Claude Fable 5 is the most capable Claude Code model and
is aimed at long-horizon, high-complexity tasks "larger than a single sitting." Sensible
split for this project:

- **Opus 4.8 (or opusplan)** for M1–M3: a pure rules engine, data model, and UI are
  well within its range and cheaper.
- **Fable 5** for the long autonomous pushes — handing it the whole spec to build the
  engine + full test suite in one Auto-mode run, or the trickier M4/M5 vision and hex
  geometry. Set it with `/model claude-fable-5` (or `--model claude-fable-5`); note it
  costs roughly 2× Opus 4.8, so reserve it for the heavy stretches.
- A benign board-game scorer won't trip Fable's safety routing (which only diverts a
  small share of sensitive-topic sessions to Opus 4.8), so expect Fable throughout.

## 14. Next steps (post-MVP): the scoring reveal experience

Once the MVP (M1–M5) scores correctly, the natural next project is making the *reveal*
fun to watch — turning a flat number into a little game-show moment. This is
explicitly **out of MVP scope**: build it only after the scoring engine is trustworthy,
since a beautifully animated wrong number is worse than a plain correct one.

**The core idea:** don't show the total immediately. Reveal it category by category,
in ascending order of typical stakes, with the board itself as the stage — each
category's contributing cells light up on the board while that category's points tick
upward, before cutting to the next category. Save the grand total for last.

**Suggested sequence:**
1. **Animals** reveal first (usually modest, gets the ball rolling) — cards flip over
   one at a time with a soft chime.
2. **Fields, Buildings** — each qualifying group/building pulses on the board as its 5
   points get added; a building that fails the 3-color check gets a quick, deflating
   "buzz" and stays gray (the tongue-in-cheek beat: nearly a building, never a building).
3. **Trees, Mountains** — height-based, so bigger stacks get a proportionally bigger
   flourish. A 3-high mountain not adjacent to another mountain is the joke moment:
   dramatic wind-up, then a sad trombone as it resolves to 0.
4. **Water** — the river traces itself along the board cell-by-cell before its score
   lands; islands pop like bubbles.
5. **Spirit** (if in play) — a distinct "bonus round" visual treatment since it's
   already a special rule.
6. **Drumroll → total.** A brief suspense pause (the tongue-in-cheek part: maybe a
   fake-out tick past the real number before settling), then the big reveal with a
   fanfare. Compare against a stored personal-best (Section 12's `localStorage`) for a
   "NEW HIGH SCORE" fanfare when earned — genuinely the most satisfying beat to add.

**Tone notes:** lean into a mock-dramatic game-show voice in the copy (flavor text
like "Will the mountain earn its adjacency bonus...?"), but keep it self-aware and
brief — the joke is that a board game score reveal is being treated like a title
fight, not that the jokes themselves are elaborate. A few short stock lines per
category, randomly chosen, go a long way and are far less effort than bespoke lines
per outcome.

**Implementation notes:**
- Sound via the **Web Audio API** with small local sound files (ticks, chimes,
  trombone, fanfare) bundled into the static site — no network dependency, consistent
  with the rest of the app.
- Animation via CSS transitions/keyframes on the existing board UI, or a lightweight
  canvas overlay; no need for a heavy animation library for this.
- **This requires extending `ScoreBreakdown`** (Section 3.3): each category needs to
  carry *which cells contributed*, not just a number (e.g. `trees: { points: int,
  cells: CellRef[] }` per scoring group), so the animation has something concrete to
  highlight. Plan this as a schema change, not a bolt-on.
- **Make it skippable.** A "Skip" tap and a persistent mute toggle from the first
  version — the novelty is real the first few times and actively annoying by the
  tenth. Respect `prefers-reduced-motion`.
- Treat this as its own milestone (**M6**) with its own lightweight tests (the reveal
  sequencing logic, high-score comparison) separate from the scoring engine's tests.

## 15. Open decisions for the builder to confirm with me

- Fixed board shape / valid `(q, r)` set for sides A and B (needed before M4/M5).
- The animal card catalog and each card's scoring track (32 cards).
- Whether to support side B (islands) in v1 or defer it.
- Reference lighting/photo conditions to calibrate the 7 color swatches against
  (Section 8) — plan to take a couple of test photos of the empty and loaded board
  early, before relying on classification accuracy.
