import React from 'react';

// Resolve the design-system project root at bundle-load time, so icon URLs
// work no matter how deep the consuming page lives (cards, ui kits, etc).
// _ds_bundle.js always lives at the project root, and this module executes
// synchronously while it's the currently-executing <script>.
const __ICON_BASE = (() => {
  try {
    const src = document.currentScript && document.currentScript.src;
    if (src) return src.replace(/_ds_bundle\.js.*$/, '');
  } catch (e) {}
  return './';
})();

// Small in-memory cache so repeated <Icon name="x" /> uses only fetch once.
const __iconCache = {};

/**
 * Icon renders a Lucide icon (self-hosted in assets/icons/, sourced from
 * lucide-static) by name. This is the substitute icon set for Games with
 * Friends — see readme.md "Iconography" for why. The SVG markup is fetched
 * once and inlined directly into the DOM (rather than used as a CSS mask or
 * <img>), so it reliably inherits `color` via the SVG's own
 * `stroke="currentColor"` and renders identically everywhere. Only ever
 * reference by `name` (must exist in assets/icons/); never hand-draw new
 * icons. To add a new icon, copy its .svg from lucide-static into
 * assets/icons/.
 */
export function Icon({ name, size = 20, color = 'currentColor', style, ...rest }) {
  const [svg, setSvg] = React.useState(__iconCache[name] || null);

  React.useEffect(() => {
    if (__iconCache[name]) { setSvg(__iconCache[name]); return; }
    let cancelled = false;
    fetch(`${__ICON_BASE}assets/icons/${name}.svg`)
      .then(res => res.text())
      .then(text => {
        const inlined = text
          .replace(/width="24"/, 'width="100%"')
          .replace(/height="24"/, 'height="100%"');
        __iconCache[name] = inlined;
        if (!cancelled) setSvg(inlined);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [name]);

  return (
    <span
      role="img"
      aria-label={name}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        color,
        flexShrink: 0,
        ...style,
      }}
      dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
      {...rest}
    />
  );
}
