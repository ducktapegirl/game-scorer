# Scoring App UI kit

Click-through recreation of the "Games with Friends" mobile scoring app.

Flow: **Game library** → tap a game (or "Add a game") → **New game setup**
(pick game, add players) → **Live scoring** (tap +/- per player per round,
"End round" to advance, flag icon to end game) → **Final results** (winner
banner + ranked list) → back to library, new entry added to History.

Files:
- `index.html` — mounts the app, loads the DS bundle + styles.
- `screens.jsx` — all four screens + the `App` state-machine orchestrator.
- `PlayerAvatar.jsx` — small colored-initial avatar used across screens.

Composed entirely from `components/` primitives (Button, IconButton, Input,
Card, Badge, Tag, Tabs, Dialog, Toast, Icon) — no one-off styling beyond
layout glue. Game "box art" are flat color blocks (no real cover art
provided) using invented placeholder game names (Tidepool, Lantern Row,
Copper Hollow, Skybound) — not real published games.
