# Milestone 3 Plan — Cards + Spirits

## Context

M1 (pure scoring engine, both board sides) and M2 (manual board entry UI) are merged
to `main`. This session builds **M3 only**: the animal card catalog, the Nature's
Spirit catalog, manual card entry UI, and extending `score()` so the `animals` and
`spirit` categories stop hardcoding 0 (`games/harmonies/rules.ts:86-87`). No vision
(M4), no photo correction (M5), no reveal (M6).

The one thing M3 needs that no planning doc contains is the **card data**: the rules
reference deliberately says "confirm each card's exact numbers and add/replace
behavior from the cards themselves," and CLAUDE.md forbids inventing values. Decisions
confirmed with the user:

1. **Card data**: Claude researches the published values (rulebook PDF, BGG, guides)
   and writes them to a new `planning/harmonies-cards-reference.md`; the user verifies
   against physical cards afterwards. Cross-check every value against ≥2 independent
   sources; anything conflicting or single-sourced gets a `NEEDS-CHECK` flag in the doc.
2. **Scope**: full catalog — all 32 animal cards and all 10 spirit cards.
3. **Replacing spirits** (e.g. lion rescoring fields): the replaced base category
   shows **0** and the **Spirit row shows the full replacement score**. Additive
   spirits leave base categories untouched and add their bonus to the Spirit row.

Work happens on branch `claude/planning-folder-list-q0rt4q`. Gate: `npm test` +
`npm run build` green, UI verified end-to-end in the browser, then commit and push.

Per CLAUDE.md, **step 0 of execution is copying this plan to
`planning/harmonies-m3-plan.md`**.

## Design decisions

1. **Card values live in a planning reference doc first, code second.**
   `planning/harmonies-cards-reference.md` becomes the single source of truth for
   card data (the sibling of `harmonies-rules-reference.md` for terrain). The
   TypeScript catalogs transcribe it; tests spot-check values against it. User
   corrections after verifying physical cards are then data-only edits in two places
   that a test keeps in sync by count/shape.
2. **Animal card model.** A card is `{ id, name, track: number[] }` where
   `track[i]` = the score visible after `i + 1` cubes have been placed on the board
   (rules reference: "topmost uncovered cube slot"; all cubes still on card = 0).
   Score for an entry = `cubesPlaced === 0 ? 0 : track[cubesPlaced - 1]`. Animal
   points come from cards, not cells, so the category's `cells` stays `[]`.
3. **Spirit model.** A spirit is
   `{ id, name, mode: "add" | "replace", replaces?: categoryId, score(board, topo) → { points, cells } }`
   in `games/harmonies/spirits.ts` — pure functions reusing `core/graph` helpers,
   exactly the spec's `SpiritModifier` idea. `rules.ts` applies it after base
   scoring: `add` → spirit row gets the bonus; `replace` → the named base category
   is zeroed (points and cells) and the spirit row carries the replacement points
   and contributing cells (per confirmed decision 3, and it gives M6 a clean
   "bonus round"). `spirit: "none"` short-circuits to 0 — no special-casing
   elsewhere.
4. **Strict engine validation, consistent with M1's invalid-cell throw:** unknown
   `cardId`/spirit id, `cubesPlaced` outside `[0, track.length]`, or duplicate card
   entries throw. The UI can't produce these; storage corruption is filtered before
   `score()` by validation (below).
5. **Config becomes generically editable, same pattern as the board.** Core renders
   a form from `ConfigSchema` (architecture doc §6 — game supplies data, core
   supplies mechanism) and reads/writes the game's config object directly through
   field ids. Contract refinements in `core/types` (all currently-unused stubs, so
   this is cleanup not breakage):
   - `picker` options become `{ id, label }[]` (was `string[]`) with an implicit
     game-supplied default; value type `string`.
   - `counterList` items gain `max: number` (an animal card's cube-slot count);
     value type `CounterEntry[]` where `CounterEntry = { id: string; count: number }`
     is a new generic shape in `core/types`.
   - `GameModule` gains `emptyConfig: C`, and `C` is constrained to
     `Record<string, ConfigFieldValue>` so `core/ui` can read `config[field.id]`
     without game knowledge. `app/main.ts` stops importing `EMPTY_CONFIG` directly.
   - `HarmoniesConfig.animalCards` is retyped from `{ cardId, cubesPlaced }[]` to
     `CounterEntry[]` so the generic contract holds (`spirit: "none" | SpiritCardId`
     already fits `string`).
6. **counterList UI is add-from-catalog, not 32 counters.** Rendered as: a
   `<select>` of not-yet-added catalog entries + an "Add" button; each added entry
   shows its label, count with −/+ buttons (clamped to `0..max`), and a "Remove"
   button. Spirit picker is a plain `<select>` with "None (base game)" first. All
   browser-default HTML, no CSS, per the plain-UI constraint.
7. **Persistence mirrors the board.** `core/storage` generalizes its key helper and
   adds `saveConfig/loadConfig/clearConfig` under `game-scorer:<gameId>:config`.
   A pure `validateSavedConfig(raw, module)` (alongside `validateSavedBoard` in
   `core/ui/entry-state.ts`) checks every field against the schema — known ids,
   counts in range, correct shapes — and returns `module.emptyConfig` on anything
   invalid. Cards survive "Change side" and "Clear board" (they're not
   side-dependent); a "Clear cards" button resets config alone.

## Files

**New:**
- `planning/harmonies-cards-reference.md` — researched card data: 32 animal cards
  (name, cube count, track values in reveal order) + 10 spirit cards (name,
  add-vs-replace, exact scoring text and numbers), each row with a source-confidence
  marker (`ok` / `NEEDS-CHECK`), plus a short "how to verify against your cards"
  note for the user.
- `games/harmonies/animals.ts` — `ANIMAL_CARDS` catalog + `scoreAnimals(entries) →
  ScoreCategory`.
- `games/harmonies/spirits.ts` — `SPIRIT_CARDS` catalog with per-spirit pure scoring
  functions + `applySpirit(...)` used by `rules.ts`.
- `core/ui/config-view.ts` — generic stateless form renderer:
  `renderConfig(schema, config, onChange)` → element; one section per field type.
- Tests: `games/harmonies/tests/animals.test.ts`,
  `games/harmonies/tests/spirits.test.ts`, plus new cases in
  `core/ui/entry-state.test.ts` (validateSavedConfig) and
  `core/storage/storage.test.ts` (config round-trip).

**Modified:**
- `core/types/index.ts` — `CounterEntry`, `ConfigFieldValue`, picker/counterList
  refinements, `GameModule.emptyConfig`, `C` constraint (decision 5).
- `games/harmonies/config.ts` — retyped `HarmoniesConfig`; `harmoniesConfigSchema`
  built from the two catalogs (spirit picker incl. "none"; animals counterList with
  per-card `max = track.length`).
- `games/harmonies/rules.ts` — fill `animals` via `scoreAnimals`, apply spirit via
  `applySpirit`; base terrain code untouched.
- `games/harmonies/index.ts` — wire `emptyConfig`, export catalogs/types.
- `core/storage/index.ts` — config save/load/clear.
- `core/ui/entry-state.ts` — `validateSavedConfig`.
- `core/ui/entry-screen.ts` — config as live state: load+validate on mount, render
  `config-view` between the editor and the score table, persist and re-score on
  every change, "Clear cards" control.
- `app/main.ts` — use `module.emptyConfig`.

**Untouched:** `core/graph.ts`, `games/harmonies/topology.ts`, all M1 terrain
scoring logic and tests (must stay green unmodified).

## Tests (written against the cards reference doc, before implementation)

- **animals.test.ts** — catalog integrity: exactly 32 unique ids, every track
  non-empty with strictly ascending values, names unique; scoring: 0 cubes → 0,
  `track[n-1]` for n cubes, several cards sum, `cells` is empty; throws on unknown
  id, duplicate entries, out-of-range cubes; 3–4 spot-checks of exact track values
  transcribed from the reference doc.
- **spirits.test.ts** — catalog integrity: exactly 10 unique ids, every card marked
  add or replace (replace cards name a real category id); `spirit: "none"` → spirit
  row 0 and breakdown identical to base; per-spirit hand-authored board tests
  covering every spirit's rule; for each **additive** spirit: base categories
  unchanged, spirit row = documented bonus; for each **replacing** spirit: replaced
  category is 0 with empty cells, spirit row = documented replacement (e.g.
  lion-type counts even single yellows, unlike the base field rule); total always
  equals the category sum.
- **entry-state / storage tests** — `validateSavedConfig` accepts a good config,
  returns `emptyConfig` on unknown spirit, unknown card id, count > max, malformed
  shapes; config save/load round-trip and corrupt-JSON → null.
- DOM glue (`config-view`) stays thin and is verified in the browser, matching M2's
  choice to avoid a jsdom dependency.

## Execution order

0. Copy this plan to `planning/harmonies-m3-plan.md`.
1. **Research pass**: gather the 32 animal tracks + 10 spirit behaviors, write
   `planning/harmonies-cards-reference.md` with confidence markers.
2. `core/types` refinements; `games/harmonies/animals.ts` + `spirits.ts` catalogs
   transcribed from the reference doc.
3. Tests first: `animals.test.ts`, `spirits.test.ts`, entry-state/storage additions.
4. `rules.ts` animals + spirit wiring until green; `config.ts` schema;
   `index.ts`.
5. `core/storage` config functions, `validateSavedConfig`, `config-view.ts`,
   `entry-screen.ts` integration, `app/main.ts`.
6. Verification (below); fix until green; commit and push
   `-u origin claude/planning-folder-list-q0rt4q`.

## Verification

1. `npm test` — all M1/M2 tests still green plus the new suites.
2. `npm run build` — strict typecheck + Vite build green.
3. End-to-end in the real app: `npm run dev`, drive with Playwright
   (`/opt/pw-browsers/chromium`): enter a small board → add two animal cards with
   known cube counts → assert the Animals row and total match hand-computed values →
   pick an additive spirit → assert Spirit row adds and base rows hold → switch to a
   replacing spirit → assert the replaced category shows 0 and Spirit shows the
   replacement → reload → board *and* cards persist → "Clear cards" resets config
   but not the board. Screenshot for sanity.
4. Remind the user to verify `planning/harmonies-cards-reference.md` (especially any
   `NEEDS-CHECK` rows) against the physical cards; corrections are data edits in the
   reference doc + catalogs with tests keeping them consistent.
