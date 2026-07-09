import React from 'react';
import { Icon } from '../icon/Icon.jsx';

/** Checkbox with tactile checked state (fills coral + check icon). */
export function Checkbox({ label, checked, onChange, disabled = false }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-body)', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}>
      <span
        onClick={() => !disabled && onChange && onChange(!checked)}
        style={{
          width: 24, height: 24, borderRadius: 'var(--radius-xs)',
          border: checked ? 'none' : 'var(--border-width-thick) solid var(--color-border-strong)',
          background: checked ? 'var(--color-primary)' : 'var(--color-surface)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 150ms ease-out',
          flexShrink: 0,
        }}
      >
        {checked && <Icon name="check" size={16} color="var(--color-text-on-primary)" />}
      </span>
      {label && <span style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-primary)' }}>{label}</span>}
    </label>
  );
}
