// Shared button factory for the entry surfaces. Previously copy-pasted, byte
// for byte, into entry-screen / cell-editor / photo-screen; consolidated here so
// every button picks up the design-system look (see app/app.css `.btn`) from one
// place. Variant maps to a `.btn--*` class: ghost is the default for the many
// secondary controls, primary for the one lead action on a surface.

export type ButtonVariant = "primary" | "secondary" | "ghost";

export function button(
  label: string,
  onClick: () => void,
  variant: ButtonVariant = "ghost",
): HTMLButtonElement {
  const b = document.createElement("button");
  b.type = "button";
  b.className = `btn btn--${variant}`;
  b.textContent = label;
  b.addEventListener("click", onClick);
  return b;
}
