/* @ds-bundle: {"format":4,"namespace":"GamesWithFriendsDesignSystem_019dd7","components":[{"name":"Button","sourcePath":"components/buttons/Button.jsx"},{"name":"IconButton","sourcePath":"components/buttons/IconButton.jsx"},{"name":"Badge","sourcePath":"components/data-display/Badge.jsx"},{"name":"Card","sourcePath":"components/data-display/Card.jsx"},{"name":"Tag","sourcePath":"components/data-display/Tag.jsx"},{"name":"Dialog","sourcePath":"components/feedback/Dialog.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Tooltip","sourcePath":"components/feedback/Tooltip.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Radio","sourcePath":"components/forms/Radio.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"Icon","sourcePath":"components/icon/Icon.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"}],"sourceHashes":{"components/buttons/Button.jsx":"c87dcdbf4964","components/buttons/IconButton.jsx":"23a8dffdbd3e","components/data-display/Badge.jsx":"de2a57376415","components/data-display/Card.jsx":"905be8de1b71","components/data-display/Tag.jsx":"04421d670a08","components/feedback/Dialog.jsx":"fc31cdcf5d25","components/feedback/Toast.jsx":"ce9b00d6661e","components/feedback/Tooltip.jsx":"da11cf340e73","components/forms/Checkbox.jsx":"f401f258d97b","components/forms/Input.jsx":"2c0a248ea18e","components/forms/Radio.jsx":"51d7b97dcee5","components/forms/Select.jsx":"fe5db1468c8b","components/forms/Switch.jsx":"570bef35a9ba","components/icon/Icon.jsx":"333fbe9d9b24","components/navigation/Tabs.jsx":"5e4921634cf8","ui_kits/scoring-app/PlayerAvatar.uikit.js":"81653995a5cf","ui_kits/scoring-app/screens.uikit.js":"e4cb1da59c2f"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.GamesWithFriendsDesignSystem_019dd7 = window.GamesWithFriendsDesignSystem_019dd7 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/data-display/Badge.jsx
try { (() => {
const TONES = {
  neutral: {
    bg: 'var(--ink-100)',
    fg: 'var(--ink-700)'
  },
  primary: {
    bg: 'var(--color-primary-soft)',
    fg: 'var(--coral-700)'
  },
  secondary: {
    bg: 'var(--color-secondary-soft)',
    fg: 'var(--teal-700)'
  },
  success: {
    bg: 'var(--color-success-soft)',
    fg: 'var(--olive-700)'
  },
  warning: {
    bg: 'var(--color-warning-soft)',
    fg: 'var(--mustard-700)'
  },
  danger: {
    bg: 'var(--color-danger-soft)',
    fg: 'var(--red-500)'
  }
};

/** Small status pill — e.g. "Winning", "3 players", "In progress". */
function Badge({
  children,
  tone = 'neutral'
}) {
  const t = TONES[tone] || TONES.neutral;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      fontFamily: 'var(--font-body)',
      fontWeight: 'var(--weight-bold)',
      fontSize: 'var(--text-xs)',
      padding: '4px 12px',
      borderRadius: 'var(--radius-pill)',
      background: t.bg,
      color: t.fg
    }
  }, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/Badge.jsx", error: String((e && e.message) || e) }); }

// components/data-display/Card.jsx
try { (() => {
/** Flat surface container — the base for game tiles, player rows, summary panels. */
function Card({
  children,
  padding = 'var(--space-6)',
  interactive = false,
  style,
  onClick
}) {
  const [hovered, setHovered] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    onMouseEnter: () => interactive && setHovered(true),
    onMouseLeave: () => setHovered(false),
    style: {
      background: 'var(--color-surface)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: hovered ? 'var(--shadow-md)' : 'var(--shadow-sm)',
      padding,
      cursor: interactive ? 'pointer' : 'default',
      transition: 'box-shadow 150ms ease-out, transform 150ms ease-out',
      transform: hovered ? 'translateY(-2px)' : 'none',
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/Card.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Tooltip.jsx
try { (() => {
/** Small hover label for icon-only controls. */
function Tooltip({
  label,
  children
}) {
  const [visible, setVisible] = React.useState(false);
  return /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      display: 'inline-flex'
    },
    onMouseEnter: () => setVisible(true),
    onMouseLeave: () => setVisible(false)
  }, children, visible && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      bottom: '125%',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'var(--ink-800)',
      color: 'var(--cream-25)',
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-xs)',
      fontWeight: 'var(--weight-semibold)',
      padding: '6px 10px',
      borderRadius: 'var(--radius-sm)',
      whiteSpace: 'nowrap',
      boxShadow: 'var(--shadow-sm)',
      animation: 'gwf-tooltip-in 150ms ease-out'
    }
  }, label), /*#__PURE__*/React.createElement("style", null, `@keyframes gwf-tooltip-in { from { opacity:0; } to { opacity:1; } }`));
}
Object.assign(__ds_scope, { Tooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Tooltip.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
/** Text input with label, helper text, and error state. */
function Input({
  label,
  placeholder,
  value,
  onChange,
  error,
  helperText,
  type = 'text',
  disabled = false,
  style
}) {
  const [focused, setFocused] = React.useState(false);
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      fontFamily: 'var(--font-body)',
      width: '100%',
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-sm)',
      fontWeight: 'var(--weight-semibold)',
      color: 'var(--color-text-primary)'
    }
  }, label), /*#__PURE__*/React.createElement("input", {
    type: type,
    value: value,
    placeholder: placeholder,
    disabled: disabled,
    onChange: e => onChange && onChange(e.target.value),
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-base)',
      padding: '12px 16px',
      borderRadius: 'var(--radius-md)',
      border: `var(--border-width) solid ${error ? 'var(--color-danger)' : focused ? 'var(--color-secondary)' : 'var(--color-border-strong)'}`,
      outline: 'none',
      background: disabled ? 'var(--color-bg-subtle)' : 'var(--color-surface)',
      color: 'var(--color-text-primary)',
      boxShadow: focused ? '0 0 0 3px var(--color-secondary-soft)' : 'none',
      transition: 'box-shadow 150ms ease-out, border-color 150ms ease-out'
    }
  }), (error || helperText) && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-xs)',
      color: error ? 'var(--color-danger)' : 'var(--color-text-muted)'
    }
  }, error || helperText));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Radio.jsx
try { (() => {
/** Radio button, teal dot when selected. */
function Radio({
  label,
  checked,
  onChange,
  disabled = false,
  name
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      fontFamily: 'var(--font-body)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    onClick: () => !disabled && onChange && onChange(),
    style: {
      width: 22,
      height: 22,
      borderRadius: 'var(--radius-circle)',
      border: `var(--border-width-thick) solid ${checked ? 'var(--color-secondary)' : 'var(--color-border-strong)'}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    }
  }, checked && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 11,
      height: 11,
      borderRadius: '50%',
      background: 'var(--color-secondary)'
    }
  })), label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-base)',
      color: 'var(--color-text-primary)'
    }
  }, label));
}
Object.assign(__ds_scope, { Radio });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Radio.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
/** Toggle switch — pill track, sliding thumb, olive when on. */
function Switch({
  label,
  checked,
  onChange,
  disabled = false
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      fontFamily: 'var(--font-body)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    onClick: () => !disabled && onChange && onChange(!checked),
    style: {
      width: 44,
      height: 26,
      borderRadius: 'var(--radius-pill)',
      background: checked ? 'var(--color-success)' : 'var(--ink-200)',
      position: 'relative',
      flexShrink: 0,
      transition: 'background 150ms ease-out'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 3,
      left: checked ? 21 : 3,
      width: 20,
      height: 20,
      borderRadius: '50%',
      background: 'var(--cream-0)',
      boxShadow: 'var(--shadow-xs)',
      transition: 'left 150ms ease-out'
    }
  })), label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-base)',
      color: 'var(--color-text-primary)'
    }
  }, label));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/icon/Icon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
function Icon({
  name,
  size = 20,
  color = 'currentColor',
  style,
  ...rest
}) {
  const [svg, setSvg] = React.useState(__iconCache[name] || null);
  React.useEffect(() => {
    if (__iconCache[name]) {
      setSvg(__iconCache[name]);
      return;
    }
    let cancelled = false;
    fetch(`${__ICON_BASE}assets/icons/${name}.svg`).then(res => res.text()).then(text => {
      const inlined = text.replace(/width="24"/, 'width="100%"').replace(/height="24"/, 'height="100%"');
      __iconCache[name] = inlined;
      if (!cancelled) setSvg(inlined);
    }).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [name]);
  return /*#__PURE__*/React.createElement("span", _extends({
    role: "img",
    "aria-label": name,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: size,
      height: size,
      color,
      flexShrink: 0,
      ...style
    },
    dangerouslySetInnerHTML: svg ? {
      __html: svg
    } : undefined
  }, rest));
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/icon/Icon.jsx", error: String((e && e.message) || e) }); }

// components/buttons/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Primary UI action component. Pill-shaped, tactile press state. */
function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  disabled = false,
  fullWidth = false,
  onClick,
  style,
  ...rest
}) {
  const [pressed, setPressed] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);
  const sizes = {
    sm: {
      padding: '10px 18px',
      fontSize: 'var(--text-sm)',
      gap: 6
    },
    md: {
      padding: '14px 26px',
      fontSize: 'var(--text-base)',
      gap: 8
    },
    lg: {
      padding: '17px 32px',
      fontSize: 'var(--text-md)',
      gap: 10
    }
  };
  const variants = {
    primary: {
      background: hovered ? 'var(--color-primary-hover)' : 'var(--color-primary)',
      color: 'var(--color-text-on-primary)',
      boxShadow: pressed ? 'var(--shadow-pressed)' : 'var(--shadow-sm)',
      border: 'none'
    },
    secondary: {
      background: hovered ? 'var(--color-secondary-hover)' : 'var(--color-secondary)',
      color: 'var(--color-text-on-primary)',
      boxShadow: pressed ? 'var(--shadow-pressed)' : 'var(--shadow-sm)',
      border: 'none'
    },
    ghost: {
      background: hovered ? 'var(--color-bg-subtle)' : 'transparent',
      color: 'var(--color-text-primary)',
      boxShadow: 'none',
      border: 'none'
    },
    outline: {
      background: hovered ? 'var(--color-bg-subtle)' : 'transparent',
      color: 'var(--color-text-primary)',
      boxShadow: 'none',
      border: 'var(--border-width) solid var(--color-border-strong)'
    }
  };
  const disabledStyle = disabled ? {
    background: 'var(--ink-100)',
    color: 'var(--color-text-muted)',
    boxShadow: 'none',
    border: 'none',
    cursor: 'not-allowed'
  } : {
    cursor: 'pointer'
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => {
      setHovered(false);
      setPressed(false);
    },
    onMouseDown: () => setPressed(true),
    onMouseUp: () => setPressed(false),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-body)',
      fontWeight: 'var(--weight-bold)',
      borderRadius: 'var(--radius-pill)',
      transition: 'transform 150ms ease-out, background 150ms ease-out, box-shadow 150ms ease-out',
      transform: pressed && !disabled ? 'scale(0.97)' : 'scale(1)',
      width: fullWidth ? '100%' : 'auto',
      ...sizes[size],
      ...variants[variant],
      ...disabledStyle,
      ...style
    }
  }, rest), icon && iconPosition === 'left' && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: size === 'lg' ? 22 : 18,
    style: {
      marginRight: sizes[size].gap
    }
  }), children, icon && iconPosition === 'right' && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: size === 'lg' ? 22 : 18,
    style: {
      marginLeft: sizes[size].gap
    }
  }));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/buttons/Button.jsx", error: String((e && e.message) || e) }); }

// components/buttons/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Circular icon-only button — used for compact actions (edit, delete, close). */
function IconButton({
  name,
  size = 'md',
  variant = 'ghost',
  disabled = false,
  onClick,
  style,
  ...rest
}) {
  const [hovered, setHovered] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);
  const dims = {
    sm: 32,
    md: 40,
    lg: 48
  };
  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  };
  const variants = {
    ghost: {
      background: hovered ? 'var(--color-bg-subtle)' : 'transparent',
      color: 'var(--color-text-primary)'
    },
    filled: {
      background: hovered ? 'var(--color-primary-hover)' : 'var(--color-primary)',
      color: 'var(--color-text-on-primary)'
    }
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    "aria-label": name,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => {
      setHovered(false);
      setPressed(false);
    },
    onMouseDown: () => setPressed(true),
    onMouseUp: () => setPressed(false),
    style: {
      width: dims[size],
      height: dims[size],
      borderRadius: 'var(--radius-circle)',
      border: 'none',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'transform 150ms ease-out, background 150ms ease-out',
      transform: pressed && !disabled ? 'scale(0.94)' : 'scale(1)',
      ...(disabled ? {
        background: 'var(--ink-100)',
        color: 'var(--color-text-muted)'
      } : variants[variant]),
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: name,
    size: iconSizes[size]
  }));
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/buttons/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/data-display/Tag.jsx
try { (() => {
/** Removable filter/category chip — e.g. game categories, player tags. */
function Tag({
  children,
  onRemove,
  color = 'var(--teal-500)'
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      fontFamily: 'var(--font-body)',
      fontWeight: 'var(--weight-semibold)',
      fontSize: 'var(--text-sm)',
      padding: '6px 12px 6px 14px',
      borderRadius: 'var(--radius-pill)',
      border: `var(--border-width) solid ${color}`,
      color,
      background: 'transparent'
    }
  }, children, onRemove && /*#__PURE__*/React.createElement("span", {
    onClick: onRemove,
    style: {
      display: 'inline-flex',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "x",
    size: 14,
    color: color
  })));
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/Tag.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Dialog.jsx
try { (() => {
/** Modal dialog — flat scrim, centered card, slide+fade in. */
function Dialog({
  open,
  title,
  children,
  onClose,
  footer
}) {
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(27, 22, 19, 0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    },
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      background: 'var(--color-surface-raised)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-xl)',
      padding: 'var(--space-6)',
      width: 'min(360px, 90vw)',
      fontFamily: 'var(--font-body)',
      animation: 'gwf-dialog-in 200ms ease-out'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 'var(--text-lg)'
    }
  }, title), /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    name: "x",
    size: "sm",
    onClick: onClose
  })), /*#__PURE__*/React.createElement("div", null, children), footer && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      justifyContent: 'flex-end',
      marginTop: 'var(--space-5)'
    }
  }, footer)), /*#__PURE__*/React.createElement("style", null, `@keyframes gwf-dialog-in { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }`));
}
Object.assign(__ds_scope, { Dialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Dialog.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
const TONES = {
  success: {
    bg: 'var(--olive-600)',
    icon: 'check'
  },
  error: {
    bg: 'var(--red-500)',
    icon: 'x'
  },
  info: {
    bg: 'var(--teal-600)',
    icon: 'info'
  }
};

/** Toast notification — bottom-anchored, brief, auto-dismiss. */
function Toast({
  message,
  tone = 'info',
  visible = true
}) {
  const t = TONES[tone] || TONES.info;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: visible ? 'inline-flex' : 'none',
      alignItems: 'center',
      gap: 10,
      background: t.bg,
      color: 'var(--cream-25)',
      fontFamily: 'var(--font-body)',
      fontWeight: 'var(--weight-semibold)',
      fontSize: 'var(--text-sm)',
      padding: '12px 18px',
      borderRadius: 'var(--radius-pill)',
      boxShadow: 'var(--shadow-lg)',
      animation: 'gwf-toast-in 200ms ease-out'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: t.icon,
    size: 16
  }), message, /*#__PURE__*/React.createElement("style", null, `@keyframes gwf-toast-in { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }`));
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
/** Checkbox with tactile checked state (fills coral + check icon). */
function Checkbox({
  label,
  checked,
  onChange,
  disabled = false
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      fontFamily: 'var(--font-body)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    onClick: () => !disabled && onChange && onChange(!checked),
    style: {
      width: 24,
      height: 24,
      borderRadius: 'var(--radius-xs)',
      border: checked ? 'none' : 'var(--border-width-thick) solid var(--color-border-strong)',
      background: checked ? 'var(--color-primary)' : 'var(--color-surface)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background 150ms ease-out',
      flexShrink: 0
    }
  }, checked && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "check",
    size: 16,
    color: "var(--color-text-on-primary)"
  })), label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-base)',
      color: 'var(--color-text-primary)'
    }
  }, label));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
/** Simple styled select dropdown. */
function Select({
  label,
  options = [],
  value,
  onChange,
  placeholder = 'Select…',
  disabled = false,
  style
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      fontFamily: 'var(--font-body)',
      width: '100%',
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-sm)',
      fontWeight: 'var(--weight-semibold)',
      color: 'var(--color-text-primary)'
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("select", {
    value: value,
    disabled: disabled,
    onChange: e => onChange && onChange(e.target.value),
    style: {
      appearance: 'none',
      width: '100%',
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-base)',
      padding: '12px 40px 12px 16px',
      borderRadius: 'var(--radius-md)',
      border: 'var(--border-width) solid var(--color-border-strong)',
      background: disabled ? 'var(--color-bg-subtle)' : 'var(--color-surface)',
      color: 'var(--color-text-primary)',
      outline: 'none'
    }
  }, !value && /*#__PURE__*/React.createElement("option", {
    value: "",
    disabled: true
  }, placeholder), options.map(opt => /*#__PURE__*/React.createElement("option", {
    key: opt.value ?? opt,
    value: opt.value ?? opt
  }, opt.label ?? opt))), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-down",
    size: 18,
    color: "var(--color-text-secondary)",
    style: {
      position: 'absolute',
      right: 14,
      top: '50%',
      transform: 'translateY(-50%)',
      pointerEvents: 'none'
    }
  })));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
/** Segmented tab bar. */
function Tabs({
  tabs,
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      gap: 4,
      padding: 4,
      background: 'var(--color-bg-subtle)',
      borderRadius: 'var(--radius-pill)',
      fontFamily: 'var(--font-body)'
    }
  }, tabs.map(tab => {
    const active = tab.value === value;
    return /*#__PURE__*/React.createElement("button", {
      key: tab.value,
      onClick: () => onChange && onChange(tab.value),
      style: {
        border: 'none',
        cursor: 'pointer',
        padding: '8px 18px',
        borderRadius: 'var(--radius-pill)',
        fontWeight: 'var(--weight-bold)',
        fontSize: 'var(--text-sm)',
        background: active ? 'var(--color-surface)' : 'transparent',
        color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
        boxShadow: active ? 'var(--shadow-xs)' : 'none',
        transition: 'background 150ms ease-out, color 150ms ease-out'
      }
    }, tab.label);
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// ui_kits/scoring-app/PlayerAvatar.uikit.js
try { (() => {
/** Colored initial-circle avatar (no photo uploads in this system). */
function PlayerAvatar({
  name,
  color,
  size = 40
}) {
  const initial = (name || '?').trim()[0]?.toUpperCase() || '?';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: size,
      height: size,
      borderRadius: '50%',
      background: color,
      color: 'var(--cream-25)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: size * 0.42,
      flexShrink: 0
    }
  }, initial);
}
window.PlayerAvatar = PlayerAvatar;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/scoring-app/PlayerAvatar.uikit.js", error: String((e && e.message) || e) }); }

// ui_kits/scoring-app/screens.uikit.js
try { (() => {
const {
  Button,
  IconButton,
  Input,
  Card,
  Badge,
  Tag,
  Tabs,
  Dialog,
  Toast,
  Icon
} = window.GamesWithFriendsDesignSystem_019dd7;
const {
  PlayerAvatar
} = window;
const PLAYER_COLORS = ['var(--coral-500)', 'var(--teal-500)', 'var(--mustard-500)', 'var(--olive-500)'];
const SAMPLE_GAMES = [{
  id: 'tidepool',
  name: 'Tidepool',
  color: 'var(--teal-500)',
  players: '2–4',
  tags: ['Strategy']
}, {
  id: 'lantern-row',
  name: 'Lantern Row',
  color: 'var(--mustard-500)',
  players: '3–5',
  tags: ['Party']
}, {
  id: 'copper-hollow',
  name: 'Copper Hollow',
  color: 'var(--olive-500)',
  players: '2–4',
  tags: ['Card game']
}, {
  id: 'skybound',
  name: 'Skybound',
  color: 'var(--coral-500)',
  players: '2–6',
  tags: ['Party']
}];

/* ---------------- Screen: Game Library ---------------- */
function GameLibrary({
  onStartNewGame,
  recentGames
}) {
  const [tab, setTab] = React.useState('library');
  return /*#__PURE__*/React.createElement(Screen, null, /*#__PURE__*/React.createElement(TopBar, {
    title: "Games with Friends"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 20px 8px'
    }
  }, /*#__PURE__*/React.createElement(Tabs, {
    tabs: [{
      value: 'library',
      label: 'Game library'
    }, {
      value: 'history',
      label: 'History'
    }],
    value: tab,
    onChange: setTab
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: '12px 20px 100px',
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, tab === 'library' ? SAMPLE_GAMES.map(g => /*#__PURE__*/React.createElement(Card, {
    key: g.id,
    interactive: true,
    onClick: () => onStartNewGame(g),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 48,
      height: 48,
      borderRadius: 'var(--radius-md)',
      background: g.color,
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 'var(--text-md)'
    }
  }, g.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-xs)',
      color: 'var(--color-text-secondary)',
      margin: '2px 0 6px'
    }
  }, g.players, " players"), /*#__PURE__*/React.createElement(Tag, {
    color: g.color
  }, g.tags[0])), /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-right",
    size: 20,
    color: "var(--color-text-muted)"
  }))) : recentGames.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    icon: "history",
    text: "No finished games yet. Play one to see it here."
  }) : recentGames.map((g, i) => /*#__PURE__*/React.createElement(Card, {
    key: i,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 48,
      height: 48,
      borderRadius: 'var(--radius-md)',
      background: g.color,
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 'var(--text-md)'
    }
  }, g.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-xs)',
      color: 'var(--color-text-secondary)'
    }
  }, "Won by ", g.winner)), /*#__PURE__*/React.createElement(Badge, {
    tone: "success"
  }, g.winnerScore, " pts")))), /*#__PURE__*/React.createElement(BottomAction, null, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    fullWidth: true,
    icon: "plus",
    onClick: () => onStartNewGame(null)
  }, "Add a game")));
}

/* ---------------- Screen: New Game Setup ---------------- */
function NewGameSetup({
  initialGame,
  onBack,
  onStart
}) {
  const [game, setGame] = React.useState(initialGame || SAMPLE_GAMES[0]);
  const [players, setPlayers] = React.useState(['Priya', 'Sam']);
  const [draft, setDraft] = React.useState('');
  function addPlayer() {
    if (!draft.trim()) return;
    setPlayers([...players, draft.trim()]);
    setDraft('');
  }
  function removePlayer(i) {
    setPlayers(players.filter((_, idx) => idx !== i));
  }
  return /*#__PURE__*/React.createElement(Screen, null, /*#__PURE__*/React.createElement(TopBar, {
    title: "New game",
    onBack: onBack
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: '12px 20px 100px',
      display: 'flex',
      flexDirection: 'column',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(FieldLabel, null, "Game"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      overflowX: 'auto',
      paddingBottom: 4
    }
  }, SAMPLE_GAMES.map(g => /*#__PURE__*/React.createElement("div", {
    key: g.id,
    onClick: () => setGame(g),
    style: {
      cursor: 'pointer',
      flexShrink: 0,
      textAlign: 'center',
      width: 76
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 64,
      height: 64,
      borderRadius: 'var(--radius-lg)',
      background: g.color,
      margin: '0 auto 6px',
      boxShadow: game.id === g.id ? '0 0 0 3px var(--color-surface), 0 0 0 6px ' + g.color : 'var(--shadow-sm)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-xs)',
      fontWeight: 600
    }
  }, g.name))))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(FieldLabel, null, "Players (", players.length, ")"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, players.map((p, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      background: 'var(--color-surface)',
      borderRadius: 'var(--radius-md)',
      padding: '10px 14px',
      boxShadow: 'var(--shadow-xs)'
    }
  }, /*#__PURE__*/React.createElement(PlayerAvatar, {
    name: p,
    color: PLAYER_COLORS[i % PLAYER_COLORS.length],
    size: 32
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      fontWeight: 600
    }
  }, p), /*#__PURE__*/React.createElement(IconButton, {
    name: "x",
    size: "sm",
    onClick: () => removePlayer(i)
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "Add player name",
    value: draft,
    onChange: setDraft
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "outline",
    onClick: addPlayer
  }, "Add")))), /*#__PURE__*/React.createElement(BottomAction, null, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    fullWidth: true,
    disabled: players.length < 1,
    onClick: () => onStart(game, players)
  }, "Start scoring")));
}

/* ---------------- Screen: Live Scoring ---------------- */
function LiveScoring({
  game,
  players,
  onEndGame,
  onBack
}) {
  const [round, setRound] = React.useState(1);
  const [scores, setScores] = React.useState(players.map(() => 0));
  const [showEndDialog, setShowEndDialog] = React.useState(false);
  const [toast, setToast] = React.useState(null);
  function adjust(i, delta) {
    setScores(scores.map((s, idx) => idx === i ? Math.max(0, s + delta) : s));
  }
  function nextRound() {
    setRound(round + 1);
    setToast(`Round ${round} saved.`);
    setTimeout(() => setToast(null), 2000);
  }
  const sorted = players.map((p, i) => ({
    name: p,
    score: scores[i],
    color: PLAYER_COLORS[i % PLAYER_COLORS.length]
  })).sort((a, b) => b.score - a.score);
  return /*#__PURE__*/React.createElement(Screen, null, /*#__PURE__*/React.createElement(TopBar, {
    title: game.name,
    onBack: onBack,
    action: /*#__PURE__*/React.createElement(IconButton, {
      name: "flag",
      onClick: () => setShowEndDialog(true)
    })
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '4px 20px 8px',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-sm)',
      color: 'var(--color-text-secondary)',
      fontWeight: 700
    }
  }, "ROUND ", round), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: '4px 20px 100px',
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, sorted.map((p, i) => /*#__PURE__*/React.createElement(Card, {
    key: p.name,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(PlayerAvatar, {
    name: p.name,
    color: p.color
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 700
    }
  }, p.name), i === 0 && p.score > 0 && /*#__PURE__*/React.createElement(Badge, {
    tone: "success"
  }, "Leading")), /*#__PURE__*/React.createElement(IconButton, {
    name: "minus",
    size: "sm",
    variant: "ghost",
    onClick: () => adjust(players.indexOf(p.name), -1)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontWeight: 700,
      fontSize: 'var(--score-md)',
      width: 56,
      textAlign: 'center',
      color: 'var(--color-primary)'
    }
  }, p.score), /*#__PURE__*/React.createElement(IconButton, {
    name: "plus",
    size: "sm",
    variant: "filled",
    onClick: () => adjust(players.indexOf(p.name), 1)
  })))), /*#__PURE__*/React.createElement(BottomAction, null, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "lg",
    fullWidth: true,
    icon: "chevron-right",
    iconPosition: "right",
    onClick: nextRound
  }, "End round ", round)), toast && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 88,
      left: 0,
      right: 0,
      display: 'flex',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Toast, {
    tone: "success",
    message: toast
  })), /*#__PURE__*/React.createElement(Dialog, {
    open: showEndDialog,
    title: "End game?",
    onClose: () => setShowEndDialog(false),
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      onClick: () => setShowEndDialog(false)
    }, "Cancel"), /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      onClick: () => onEndGame(sorted)
    }, "End game"))
  }, "This saves final scores to history. You can't add more rounds after."));
}

/* ---------------- Screen: Game Summary ---------------- */
function GameSummary({
  game,
  results,
  onDone
}) {
  const winner = results[0];
  return /*#__PURE__*/React.createElement(Screen, null, /*#__PURE__*/React.createElement(TopBar, {
    title: "Final results"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: '12px 20px 100px',
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '20px 0'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "crown",
    size: 40,
    color: "var(--mustard-500)"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 'var(--text-2xl)',
      marginTop: 8
    }
  }, winner.name, " wins!"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--color-text-secondary)',
      marginTop: 4
    }
  }, "with ", winner.score, " points \uD83C\uDF89")), results.map((p, i) => /*#__PURE__*/React.createElement(Card, {
    key: p.name,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontWeight: 700,
      color: 'var(--color-text-muted)',
      width: 20
    }
  }, i + 1), /*#__PURE__*/React.createElement(PlayerAvatar, {
    name: p.name,
    color: p.color
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      fontWeight: 700
    }
  }, p.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontWeight: 700,
      fontSize: 'var(--score-sm)'
    }
  }, p.score)))), /*#__PURE__*/React.createElement(BottomAction, null, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    fullWidth: true,
    onClick: onDone
  }, "Done")));
}

/* ---------------- Shared bits ---------------- */
function Screen({
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: 428,
      height: 860,
      background: 'var(--color-bg)',
      borderRadius: 36,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      fontFamily: 'var(--font-body)',
      color: 'var(--color-text-primary)',
      boxShadow: 'var(--shadow-xl)'
    }
  }, children);
}
function TopBar({
  title,
  onBack,
  action
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '20px 16px 12px'
    }
  }, onBack ? /*#__PURE__*/React.createElement(IconButton, {
    name: "chevron-left",
    onClick: onBack
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      width: 40
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 'var(--text-lg)',
      textAlign: 'center'
    }
  }, title), action || /*#__PURE__*/React.createElement("div", {
    style: {
      width: 40
    }
  }));
}
function BottomAction({
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: '14px 20px 22px',
      background: 'linear-gradient(to top, var(--color-bg) 60%, transparent)'
    }
  }, children);
}
function FieldLabel({
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-sm)',
      fontWeight: 700,
      color: 'var(--color-text-secondary)',
      marginBottom: 8
    }
  }, children);
}
function EmptyState({
  icon,
  text
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '60px 20px',
      color: 'var(--color-text-muted)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: 32,
    color: "var(--color-text-muted)"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      fontSize: 'var(--text-sm)'
    }
  }, text));
}

/* ---------------- App orchestrator ---------------- */
function App() {
  const [screen, setScreen] = React.useState('library');
  const [pendingGame, setPendingGame] = React.useState(null);
  const [activeGame, setActiveGame] = React.useState(null);
  const [activePlayers, setActivePlayers] = React.useState([]);
  const [results, setResults] = React.useState(null);
  const [history, setHistory] = React.useState([{
    name: 'Copper Hollow',
    color: 'var(--olive-500)',
    winner: 'Sam',
    winnerScore: 34
  }]);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'center',
      padding: 24
    }
  }, screen === 'library' && /*#__PURE__*/React.createElement(GameLibrary, {
    recentGames: history,
    onStartNewGame: g => {
      setPendingGame(g);
      setScreen('setup');
    }
  }), screen === 'setup' && /*#__PURE__*/React.createElement(NewGameSetup, {
    initialGame: pendingGame,
    onBack: () => setScreen('library'),
    onStart: (game, players) => {
      setActiveGame(game);
      setActivePlayers(players);
      setScreen('scoring');
    }
  }), screen === 'scoring' && /*#__PURE__*/React.createElement(LiveScoring, {
    game: activeGame,
    players: activePlayers,
    onBack: () => setScreen('setup'),
    onEndGame: sorted => {
      setResults(sorted);
      setHistory([{
        name: activeGame.name,
        color: activeGame.color,
        winner: sorted[0].name,
        winnerScore: sorted[0].score
      }, ...history]);
      setScreen('summary');
    }
  }), screen === 'summary' && /*#__PURE__*/React.createElement(GameSummary, {
    game: activeGame,
    results: results,
    onDone: () => setScreen('library')
  }));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/scoring-app/screens.uikit.js", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.Dialog = __ds_scope.Dialog;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Tooltip = __ds_scope.Tooltip;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Radio = __ds_scope.Radio;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.Tabs = __ds_scope.Tabs;

})();
