import React from 'react';

/** Text input with label, helper text, and error state. */
export function Input({ label, placeholder, value, onChange, error, helperText, type = 'text', disabled = false, style }) {
  const [focused, setFocused] = React.useState(false);
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontFamily: 'var(--font-body)', width: '100%', ...style }}>
      {label && <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-primary)' }}>{label}</span>}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={e => onChange && onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-base)',
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          border: `var(--border-width) solid ${error ? 'var(--color-danger)' : focused ? 'var(--color-secondary)' : 'var(--color-border-strong)'}`,
          outline: 'none',
          background: disabled ? 'var(--color-bg-subtle)' : 'var(--color-surface)',
          color: 'var(--color-text-primary)',
          boxShadow: focused ? '0 0 0 3px var(--color-secondary-soft)' : 'none',
          transition: 'box-shadow 150ms ease-out, border-color 150ms ease-out',
        }}
      />
      {(error || helperText) && (
        <span style={{ fontSize: 'var(--text-xs)', color: error ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
          {error || helperText}
        </span>
      )}
    </label>
  );
}
