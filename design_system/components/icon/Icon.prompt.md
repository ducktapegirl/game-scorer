Renders a single Lucide icon by name via a CSS mask (so it inherits `currentColor`), used everywhere the system needs an icon.

```jsx
<Icon name="dice-5" size={24} color="var(--color-primary)" />
```

Notes:
- Icon set is Lucide, self-hosted from `assets/icons/*.svg` (sourced from `lucide-static`), fetched once and inlined as real SVG DOM (not a CSS mask or `<img>`) — see readme.md "Iconography" for why this is a flagged substitution.
- Uses a CSS `mask-image`, not `<img>`, so `color` works like text color and hover-darken states apply automatically.
- Common names used across this system: `dice-5`, `plus`, `trophy`, `users`, `chevron-right`, `chevron-left`, `x`, `check`, `settings`, `pencil`, `trash-2`, `share-2`, `flag`, `crown`, `undo-2`.
