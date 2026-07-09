import React from 'react';

/** Radio button, teal dot when selected. */
export function Radio({ label, checked, onChange, disabled = false, name }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-body)', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}>
      <span
        onClick={() => !disabled && onChange && onChange()}
        style={{
          width: 22, height: 22, borderRadius: 'var(--radius-circle)',
          border: `var(--border-width-thick) solid ${checked ? 'var(--color-secondary)' : 'var(--color-border-strong)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {checked && <span style={{ width: 11, height: 11, borderRadius: '50%', background: 'var(--color-secondary)' }} />}
      </span>
      {label && <span style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-primary)' }}>{label}</span>}
    </label>
  );
}
