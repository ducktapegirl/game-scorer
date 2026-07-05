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

- Side A (river scoring): columns 5-4-5-4-5 = 23 hexes. Side B (islands):
  4-3-4-3-4-3-4 = 25 hexes. Axial `(q, r)`, `CellId = "q,r"`, adjacency in
  `games/harmonies/topology.ts`.
- `boardSide` is set manually by the user, never detected from the photo.
- Stacks are bottom-to-top arrays; only green/gray tops have scoring-relevant height.

## UI constraint (M2 onward)

**Keep all UI completely plain until explicitly asked otherwise**: black text on a
white background, browser-default everything, no custom CSS, no design system, no
styling pass. Function over form until the app works end to end. Visual polish is
out of scope until the user requests it.

## Milestones

M1 scoring engine (done) · M2 manual board entry UI · M3 cards + spirits · M4 vision ·
M5 correction/depth UI · M6 scoring reveal. Build only the current milestone; don't
scaffold ahead (e.g. no `core/vision` until M4).

## Workflow

- Work on the designated feature branch; never push to `main`.
- Commit after each green milestone gate.
- Animals/spirit categories exist in the breakdown from M1 but score 0 until M3.
