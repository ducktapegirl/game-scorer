import React from 'react';

const TONES = {
  neutral: { bg: 'var(--ink-100)', fg: 'var(--ink-700)' },
  primary: { bg: 'var(--color-primary-soft)', fg: 'var(--coral-700)' },
  secondary: { bg: 'var(--color-secondary-soft)', fg: 'var(--teal-700)' },
  success: { bg: 'var(--color-success-soft)', fg: 'var(--olive-700)' },
  warning: { bg: 'var(--color-warning-soft)', fg: 'var(--mustard-700)' },
  danger: { bg: 'var(--color-danger-soft)', fg: 'var(--red-500)' },
};

/** Small status pill — e.g. "Winning", "3 players", "In progress". */
export function Badge({ children, tone = 'neutral' }) {
  const t = TONES[tone] || TONES.neutral;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      fontFamily: 'var(--font-body)', fontWeight: 'var(--weight-bold)',
      fontSize: 'var(--text-xs)', padding: '4px 12px',
      borderRadius: 'var(--radius-pill)',
      background: t.bg, color: t.fg,
    }}>
      {children}
    </span>
  );
}
