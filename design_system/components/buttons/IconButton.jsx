import React from 'react';
import { Icon } from '../icon/Icon.jsx';

/** Circular icon-only button — used for compact actions (edit, delete, close). */
export function IconButton({ name, size = 'md', variant = 'ghost', disabled = false, onClick, style, ...rest }) {
  const [hovered, setHovered] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);

  const dims = { sm: 32, md: 40, lg: 48 };
  const iconSizes = { sm: 16, md: 20, lg: 24 };

  const variants = {
    ghost: {
      background: hovered ? 'var(--color-bg-subtle)' : 'transparent',
      color: 'var(--color-text-primary)',
    },
    filled: {
      background: hovered ? 'var(--color-primary-hover)' : 'var(--color-primary)',
      color: 'var(--color-text-on-primary)',
    },
  };

  return (
    <button
      aria-label={name}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
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
        ...(disabled ? { background: 'var(--ink-100)', color: 'var(--color-text-muted)' } : variants[variant]),
        ...style,
      }}
      {...rest}
    >
      <Icon name={name} size={iconSizes[size]} />
    </button>
  );
}
