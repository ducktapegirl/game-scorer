import React from 'react';

/** Segmented tab bar. */
export function Tabs({ tabs, value, onChange }) {
  return (
    <div style={{
      display: 'inline-flex', gap: 4, padding: 4,
      background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-pill)',
      fontFamily: 'var(--font-body)',
    }}>
      {tabs.map(tab => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            onClick={() => onChange && onChange(tab.value)}
            style={{
              border: 'none', cursor: 'pointer',
              padding: '8px 18px', borderRadius: 'var(--radius-pill)',
              fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)',
              background: active ? 'var(--color-surface)' : 'transparent',
              color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              boxShadow: active ? 'var(--shadow-xs)' : 'none',
              transition: 'background 150ms ease-out, color 150ms ease-out',
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
