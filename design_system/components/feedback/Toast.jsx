import React from 'react';
import { Icon } from '../icon/Icon.jsx';

const TONES = {
  success: { bg: 'var(--olive-600)', icon: 'check' },
  error: { bg: 'var(--red-500)', icon: 'x' },
  info: { bg: 'var(--teal-600)', icon: 'info' },
};

/** Toast notification — bottom-anchored, brief, auto-dismiss. */
export function Toast({ message, tone = 'info', visible = true }) {
  const t = TONES[tone] || TONES.info;
  return (
    <div style={{
      display: visible ? 'inline-flex' : 'none',
      alignItems: 'center', gap: 10,
      background: t.bg, color: 'var(--cream-25)',
      fontFamily: 'var(--font-body)', fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)',
      padding: '12px 18px', borderRadius: 'var(--radius-pill)',
      boxShadow: 'var(--shadow-lg)',
      animation: 'gwf-toast-in 200ms ease-out',
    }}>
      <Icon name={t.icon} size={16} />
      {message}
      <style>{`@keyframes gwf-toast-in { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}
