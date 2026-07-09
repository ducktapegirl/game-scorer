import React from 'react';
import { Icon } from '../icon/Icon.jsx';

/** Simple styled select dropdown. */
export function Select({ label, options = [], value, onChange, placeholder = 'Select…', disabled = false, style }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontFamily: 'var(--font-body)', width: '100%', ...style }}>
      {label && <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-primary)' }}>{label}</span>}
      <div style={{ position: 'relative' }}>
        <select
          value={value}
          disabled={disabled}
          onChange={e => onChange && onChange(e.target.value)}
          style={{
            appearance: 'none',
            width: '100%',
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-base)',
            padding: '12px 40px 12px 16px',
            borderRadius: 'var(--radius-md)',
            border: 'var(--border-width) solid var(--color-border-strong)',
            background: disabled ? 'var(--color-bg-subtle)' : 'var(--color-surface)',
            color: 'var(--color-text-primary)',
            outline: 'none',
          }}
        >
          {!value && <option value="" disabled>{placeholder}</option>}
          {options.map(opt => (
            <option key={opt.value ?? opt} value={opt.value ?? opt}>{opt.label ?? opt}</option>
          ))}
        </select>
        <Icon name="chevron-down" size={18} color="var(--color-text-secondary)" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
      </div>
    </label>
  );
}
