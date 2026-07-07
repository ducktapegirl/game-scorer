# UI Upgrades — Color Labels, Photo Canvas Height, Change Side

## Context

The app has been tried out live via GitHub Pages and works. Three small usability
issues surfaced from real use:

1. Board-view cell labels abbreviate a stack's top color by its first letter
   (`cellLabel` in `core/ui/board-view.ts`). Brown and blue both collide on "B" —
   and, found during investigation, gray and green also collide on "G" — making the
   grid labels ambiguous on both the SVG board and the photo-canvas overlay.
2. On desktop, the photo-entry canvas (`core/ui/photo-screen.ts`) renders at its full
   intrinsic buffer size (up to 1600px tall, from `MAX_CANVAS_SIDE`), which can dwarf
   the viewport and make it hard to see the photo and the SVG grid together.
3. Once a photo is loaded in the photo-entry flow, there's no way to change the board
   side without cancelling out to the main board screen first, even though the main
   screen already has a "Change side" control (`entry-screen.ts` `renderControls`).

This plan makes all three changes to the existing files; no new milestone or
architecture change is involved (still M2/M4/M5 surfaces already built).

## 1. Disambiguate all six color abbreviations (Br/Bl and Gy/Gn too)

Root cause: `cellLabel(stack)` in `core/ui/board-view.ts:112-116` derives the label by
`stack[last].charAt(0).toUpperCase()` — purely mechanical, with no knowledge of the
game's token vocabulary, so any two colors sharing a first letter collide.

Per CLAUDE.md's core/ rule ("if supporting a game requires editing core/, generalize
the interface"), the fix threads the already-generic `TokenDef` through instead of
hardcoding Harmonies color words into `core/`:

- **`core/types/index.ts`**: add an optional field to `TokenDef` (after `label`):
  `abbr?: string` — "Short code for board-view cell labels; defaults to the
  uppercased first letter of `id` if omitted." Fully backward compatible — no other
  game/caller is affected if left unset.
- **`core/ui/board-view.ts`**: change `cellLabel` to accept the token vocabulary and
  look up the top token's `abbr`, falling back to today's first-letter behavior:
  ```ts
  export function cellLabel(stack: readonly string[], tokens: TokenDef[]): string {
    if (stack.length === 0) return "";
    const topId = stack[stack.length - 1]!;
    const abbr = tokens.find((t) => t.id === topId)?.abbr ?? topId.charAt(0).toUpperCase();
    return stack.length > 1 ? `${abbr}${stack.length}` : abbr;
  }
  ```
  Update the one internal call site (`renderBoard`, line ~103) to pass its existing
  `tokens` param.
- **`core/ui/photo-screen.ts`**: update the other call site (`redrawCanvas`, line
  ~243) to pass `module.board.tokenVocabulary`.
- **`games/harmonies/tokens.ts`**: add two-letter `abbr` to every entry in
  `TOKEN_DEFS` for a consistent look and to fix both collisions:
  `blue: "Bl"`, `gray: "Gy"`, `brown: "Br"`, `green: "Gn"`, `yellow: "Ye"`, `red: "Rd"`.
- **Test**: add `core/ui/board-view.test.ts` (none exists yet; `cellLabel` is pure and
  DOM-free) covering the fallback (no `abbr` → first letter, current behavior) and the
  Harmonies vocabulary (Br vs Bl, Gy vs Gn stay distinct; height suffix still appends,
  e.g. `"Gy3"`).

## 2. Shrink the photo canvas on desktop (~60% of current height)

The canvas (`core/ui/photo-screen.ts`) has no CSS today (repo-wide, per the plain-UI
milestone rule) — its displayed size is just its drawing-buffer size set in
`paintPhoto()` (`photo-screen.ts:178-192`), capped at `MAX_CANVAS_SIDE = 1600`. Don't
touch that cap — it also drives `getImageData` sampling resolution for the vision
pipeline, and shrinking it would quietly reduce classification accuracy, which is
unrelated to this display-only ask.

Instead, add a narrow, JS-only inline style (no stylesheet, keeping the "no custom
CSS" convention) applied only above a desktop-width breakpoint:

- In `core/ui/photo-screen.ts`, at the end of `paintPhoto()` (right after
  `canvas!.width`/`canvas!.height` are set), add:
  ```ts
  const isDesktop = window.matchMedia("(min-width: 900px)").matches;
  canvas!.style.maxHeight = isDesktop ? `${Math.round(canvas!.height * 0.6)}px` : "";
  canvas!.style.width = isDesktop ? "auto" : "";
  ```
  This recomputes on every repaint (including after rotation, which changes
  `canvas.height`), caps the *displayed* height to 60% of the buffer height on wide
  viewports, and leaves the intrinsic aspect ratio intact (browser scales width to
  match since only height is constrained). Mobile (`matches` false) gets the inline
  styles cleared, so nothing changes there.
- No change needed to the SVG board (`board-view.ts`) — it's already sized
  independently from the photo canvas.

## 3. Add "Change side" to the photo-entry screen (after a photo is loaded)

Today, `core/ui/entry-screen.ts`'s `renderControls` already has this exact pattern for
the main board screen (lines 79-88):
```ts
button("Change side", () => {
  if (!confirm("Changing the side clears the entered board. Continue?")) return;
  clearBoard(module.id);
  board = null;
  selected = null;
  render();
}),
```
`core/ui/photo-screen.ts` doesn't own `boardSide`/`board` — it receives `variant` as a
read-only prop and only talks back via `onAccept`/`onCancel` callbacks. Follow that
same shape:

- **`core/ui/photo-screen.ts`**: add `onChangeSide(): void` to `PhotoScreenOptions<B>`.
  In `render()`, right after the `if (!canvas) return;` guard (i.e. only once a photo
  is actually loaded — matches "the screen after the photo has been added"), append a
  paragraph with a "Change side" button, guarded the same way the main screen guards
  it (`module.board.variants.length > 1`):
  ```ts
  if (!canvas) return;

  if (module.board.variants.length > 1) {
    const sideControls = document.createElement("p");
    sideControls.append(button("Change side", onChangeSide));
    root.append(sideControls);
  }

  if (proposal && workingBoard) { ... } else { ... }
  ```
- **`core/ui/entry-screen.ts`**: in `renderPhotoMode`, pass the new callback, mirroring
  the main screen's behavior exactly (confirm → clear → back to variant prompt), and
  also exit photo mode:
  ```ts
  onChangeSide: () => {
    if (!confirm("Changing the side clears the entered board. Continue?")) return;
    clearBoard(module.id);
    board = null;
    selected = null;
    photoMode = false;
    render();
  },
  ```

## Verification

- `npm test` and `npm run build` must both pass (repo gate).
- New `board-view.test.ts` covers the abbreviation logic directly.
- Manual check via `npm run dev`: confirm Br/Bl/Gy/Gn/Ye/Rd all render distinctly on
  both the SVG board and the photo-canvas overlay; confirm the photo canvas visibly
  shrinks to ~60% height at a desktop-sized window and is unaffected at a narrow/mobile
  width (resize the browser or use dev-tools device emulation); confirm "Change side"
  appears only once a photo is picked, and that clicking it (after confirming) clears
  the board and returns to the side-picker.
