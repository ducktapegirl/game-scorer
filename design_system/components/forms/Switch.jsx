import React from 'react';

/** Toggle switch — pill track, sliding thumb, olive when on. */
export function Switch({ label, checked, onChange, disabled = false }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-body)', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}>
      <span
        onClick={() => !disabled && onChange && onChange(!checked)}
        style={{
          width: 44, height: 26, borderRadius: 'var(--radius-pill)',
          background: checked ? 'var(--color-success)' : 'var(--ink-200)',
          position: 'relative', flexShrink: 0,
          transition: 'background 150ms ease-out',
        }}
      >
        <span style={{
          position: 'absolute', top: 3, left: checked ? 21 : 3,
          width: 20, height: 20, borderRadius: '50%', background: 'var(--cream-0)',
          boxShadow: 'var(--shadow-xs)',
          transition: 'left 150ms ease-out',
        }} />
      </span>
      {label && <span style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-primary)' }}>{label}</span>}
    </label>
  );
}
