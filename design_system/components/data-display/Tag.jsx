import React from 'react';
import { Icon } from '../icon/Icon.jsx';

/** Removable filter/category chip — e.g. game categories, player tags. */
export function Tag({ children, onRemove, color = 'var(--teal-500)' }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontFamily: 'var(--font-body)', fontWeight: 'var(--weight-semibold)',
      fontSize: 'var(--text-sm)', padding: '6px 12px 6px 14px',
      borderRadius: 'var(--radius-pill)',
      border: `var(--border-width) solid ${color}`,
      color, background: 'transparent',
    }}>
      {children}
      {onRemove && (
        <span onClick={onRemove} style={{ display: 'inline-flex', cursor: 'pointer' }}>
          <Icon name="x" size={14} color={color} />
        </span>
      )}
    </span>
  );
}
