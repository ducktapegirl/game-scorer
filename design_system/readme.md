# Games with Friends — Design System

## What this is

A from-scratch design system for **Games with Friends**, a mobile app that scores
**any** tabletop/board game — you pick a game (or add your own), track scores per
round, and see who's winning. There is no existing codebase, Figma file, or brand
guide for this product; this system was authored from scratch based on a short
product brief and a general "warm nature tones" visual direction.

**Sources provided:**
- `uploads/test_image1.jpg`, `test_image2.jpg`, `test_image_islands.jpg`,
  `test_image_islands2.jpg`, `pic8026369.webp` — five photos of the board game
  **Harmonies** (Johan Benvenuto, published by Libellud). **These depict a real,
  copyrighted product.** They were used only as loose mood-board input for a
  warm/tactile color palette (mustard, teal, coral, olive tones on a light
  background) — none of Harmonies' artwork, logo, iconography, or layout was
  copied. No files from these uploads are copied into `assets/`.
- No codebase, Figma file, or existing brand materials were provided.

Because there was no existing brand, component library, or codebase to draw
from, this system authors a **standard component set** (Button, Input, Select,
Checkbox/Radio/Switch, Card, Badge/Tag, Tabs, Dialog, Toast/Tooltip) sized for
a mobile scoring app, per the brief.

## Product surfaces

Single surface for now: the **scoring app** (mobile). See `ui_kits/scoring-app/`.

## Index

- `styles.css` — root stylesheet (import-only). Link this one file.
- `tokens/` — colors, typography, spacing, radius, shadow, fonts.
- `base.css` — minimal reset + element defaults.
- `guidelines/` — foundation specimen cards (Design System tab).
- `components/core/` — Button, IconButton, Input, Select, Checkbox, Radio,
  Switch, Card, Badge, Tag, Tabs, Dialog, Toast, Tooltip.
- `ui_kits/scoring-app/` — Game Library, New Game Setup, Live Scoring, Round
  Summary, Leaderboard/Player Profile screens, composed as a click-through.
- `assets/` — icon set license note (no logo/imagery provided — see below).
- `SKILL.md` — portable skill wrapper for this design system.

## Logo / brand mark

**No logo was provided.** Per instructions, none was invented or approximated.
The wordmark is set in `--font-display` (Baloo 2) at brand weight wherever a
mark would normally go. If you have a real logo, drop it in `assets/` and it
can be wired in.

---

## CONTENT FUNDAMENTALS

Since there is no existing copy to mine, this voice was designed to match the
"playful & fun, cozy & warm" brief:

- **Voice:** warm, encouraging, a little silly — like a friend keeping score,
  not a scoreboard. Celebrates the group, not just the winner.
- **Person:** "you" throughout ("Your turn", "You're up 12 points"). Never
  corporate "the user."
- **Casing:** sentence case everywhere — buttons, headers, labels. No ALL CAPS
  except tiny eyebrow labels (e.g. "ROUND 3") used sparingly for structure.
- **Punctuation:** exclamation points allowed but rationed — reserve for real
  wins ("New high score!"), not routine UI ("Game saved!" → "Game saved.").
- **Numbers:** scores/digits always set in mono (`--font-mono`) for a tactile,
  tabulated-scorepad feel, even inline in sentences ("**42** points").
- **Emoji:** not used in UI chrome (buttons, nav, system copy). Fine sparingly
  in user-facing flavor text or empty states (e.g. "No games yet 🎲") — never
  as a stand-in for an icon.
- **Example copy:**
  - Empty state: "No games logged yet. Add your first one to start keeping score."
  - Round prompt: "Round 3 — enter everyone's points."
  - Win state: "Priya wins with 87 points! 🎉"
  - Error: "Couldn't save that score — try again?"
  - Button labels: "Start scoring", "Add player", "End game", not "Submit."

---

## VISUAL FOUNDATIONS

- **Colors:** warm nature palette — deep teal (primary/brand), coral
  (secondary), mustard and olive (accents/status). App background is a light
  teal tint that complements the primary color; cards/surfaces stay warm
  cream so they pop off it. Full ramps in `tokens/colors.css`; see the
  Colors cards in the Design System tab.
- **Type:** Baloo 2 (rounded, friendly display face) for headings and any
  "game-box" moments; Nunito (humanist, rounded-terminal sans) for UI/body
  text; Space Mono for all score digits and counters — gives scores a tactile,
  scorepad-stamped feel distinct from the rest of the UI.
- **Spacing:** 4px base scale (`--space-1`…`--space-32`). Generous padding
  inside cards/tiles — nothing feels cramped or "dense app" — reflecting a
  relaxed game-night pace.
- **Backgrounds:** flat, light teal-tinted surface (complements the teal
  primary) — cards sit on it in warm cream for contrast. No photography, no
  full-bleed imagery, no repeating patterns or textures (none were provided
  to source from — see Iconography/Assets below), no gradients on
  backgrounds or buttons. Flat color + soft shadow is the whole toolkit.
- **Corner radii:** generous and consistent — 10–16px on controls/cards,
  24–32px on hero/feature surfaces, full pill on primary buttons and score
  chips. Rounding reads as "tactile game piece," not "corporate SaaS."
- **Shadows:** soft, warm-tinted (ink-brown, not pure black/blue-gray) —
  `--shadow-sm/md/lg` in `tokens/shadow.css`. No inner shadows, no
  glassmorphism/blur, no colored glow shadows.
- **Borders:** thin (1.5px) warm-neutral borders (`--color-border`) used
  sparingly — mostly to separate flat cream-on-cream surfaces where shadow
  alone isn't enough contrast. Not a "bordered card + shadow" combo by default;
  pick one per surface.
- **Cards:** flat cream/white surface, `--radius-lg` (24px), `--shadow-sm` at
  rest, `--shadow-md` on hover/press for anything tappable. No colored
  left-border accent strips.
- **Buttons — hover:** background steps one shade darker
  (`--color-primary` → `--color-primary-hover`); no opacity fades.
- **Buttons — press:** scale down slightly (`transform: scale(0.97)`) plus
  `--shadow-pressed`; a tactile "push the token down" feel rather than a color
  change alone.
- **Disabled:** background steps to a flat neutral (`--ink-100`), text to
  `--color-text-muted`, no shadow.
- **Animation:** minimal and quick (150–220ms, ease-out). Used only for state
  changes that need it — score count-up ticks, card press, dialog/toast
  enter/exit (fade + 8px slide). No decorative looping animation, no bounce
  physics, no confetti-by-default (reserved for an explicit "game won"
  moment, and even then a single one-shot burst, not continuous).
- **Transparency/blur:** none. Every surface is opaque flat color; no
  frosted-glass panels, no scrim blur behind dialogs (use a flat
  `rgba(ink-900, 0.4)` scrim instead).
- **Imagery color vibe:** n/a — no photography is used in this system (see
  Iconography below for why, and what to do about it).
- **Layout rules:** mobile-first, single-column, `--container-mobile` (428px)
  max width centered on larger viewports. Primary action is always a full-width
  or pill button pinned to the bottom safe area during active scoring.

### Intentional additions
- **Icon** (`components/icon/Icon.jsx`) — a thin wrapper around the Lucide
  glyph set (see Iconography below). Not one of the standard primitives
  explicitly requested, but every other component needs a consistent way to
  render an icon, so it's added as shared infrastructure.

---

## ICONOGRAPHY

No icon font, sprite sheet, or SVG set was provided with the brief. This
system uses **Lucide** as a substitute — chosen for its rounded stroke caps
and medium (1.75–2px) stroke weight, which reads as friendly/tactile rather
than thin-and-corporate, matching the brief's "playful & cozy" direction.
Icons are self-hosted as individual SVGs in `assets/icons/` (copied from
`lucide-static`); `components/icon/Icon.jsx` fetches the markup once and
inlines it directly as SVG DOM (not a CSS mask or `<img>`), so it reliably
tints via the SVG's own `stroke="currentColor"` and the `color` prop, and
renders identically everywhere. This is a **flagged substitution** — if the
product later adopts a custom icon set, drop the new SVGs into
`assets/icons/` (icons are only ever referenced by name, never hand-drawn
inline).

- Icons are used at 20px (inline/UI) and 24px (nav/emphasis) sizes only.
- Emoji: allowed only in flavor/empty-state copy (see Content Fundamentals),
  never as a functional icon replacement in nav, buttons, or system UI.
- Unicode glyphs (e.g. arrows, dots) are not used as icons — always Lucide.
- No PNG icons; SVG (via Lucide) only, always inline `currentColor` strokes so
  they inherit text color / respond to hover-darken states automatically.

## Assets

**No logo, illustrations, background imagery, or product photography were
provided.** `assets/` is intentionally near-empty — do not invent a logo or
illustration style. Game "box art" thumbnails in the UI kit are flat
color-block placeholders labeled with the game's name, clearly marked as
placeholders, until real cover art or photography is supplied.

---

## Open questions / help wanted

See the end-of-turn message for the current ask.
