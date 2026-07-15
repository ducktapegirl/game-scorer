import React from 'react';
import { Icon } from '../icon/Icon.jsx';

/** Primary UI action component. Pill-shaped, tactile press state. */
export function Button({
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
    sm: { padding: '10px 18px', fontSize: 'var(--text-sm)', gap: 6 },
    md: { padding: '14px 26px', fontSize: 'var(--text-base)', gap: 8 },
    lg: { padding: '17px 32px', fontSize: 'var(--text-md)', gap: 10 },
  };

  const variants = {
    primary: {
      background: hovered ? 'var(--color-primary-hover)' : 'var(--color-primary)',
      color: 'var(--color-text-on-primary)',
      boxShadow: pressed ? 'var(--shadow-pressed)' : 'var(--shadow-sm)',
      border: 'none',
    },
    secondary: {
      background: hovered ? 'var(--color-secondary-hover)' : 'var(--color-secondary)',
      color: 'var(--color-text-on-primary)',
      boxShadow: pressed ? 'var(--shadow-pressed)' : 'var(--shadow-sm)',
      border: 'none',
    },
    ghost: {
      background: hovered ? 'var(--color-bg-subtle)' : 'transparent',
      color: 'var(--color-text-primary)',
      boxShadow: 'none',
      border: 'none',
    },
    outline: {
      background: hovered ? 'var(--color-bg-subtle)' : 'transparent',
      color: 'var(--color-text-primary)',
      boxShadow: 'none',
      border: 'var(--border-width) solid var(--color-border-strong)',
    },
  };

  const disabledStyle = disabled
    ? { background: 'var(--ink-100)', color: 'var(--color-text-muted)', boxShadow: 'none', border: 'none', cursor: 'not-allowed' }
    : { cursor: 'pointer' };

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
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
        ...style,
      }}
      {...rest}
    >
      {icon && iconPosition === 'left' && <Icon name={icon} size={size === 'lg' ? 22 : 18} style={{ marginRight: sizes[size].gap }} />}
      {children}
      {icon && iconPosition === 'right' && <Icon name={icon} size={size === 'lg' ? 22 : 18} style={{ marginLeft: sizes[size].gap }} />}
    </button>
  );
}
