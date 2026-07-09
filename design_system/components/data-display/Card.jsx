import React from 'react';

/** Flat surface container — the base for game tiles, player rows, summary panels. */
export function Card({ children, padding = 'var(--space-6)', interactive = false, style, onClick }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => interactive && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: hovered ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        padding,
        cursor: interactive ? 'pointer' : 'default',
        transition: 'box-shadow 150ms ease-out, transform 150ms ease-out',
        transform: hovered ? 'translateY(-2px)' : 'none',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
