import React from 'react';
import { IconButton } from '../buttons/IconButton.jsx';

/** Modal dialog — flat scrim, centered card, slide+fade in. */
export function Dialog({ open, title, children, onClose, footer }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(27, 22, 19, 0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--color-surface-raised)', borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)', padding: 'var(--space-6)',
          width: 'min(360px, 90vw)', fontFamily: 'var(--font-body)',
          animation: 'gwf-dialog-in 200ms ease-out',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-lg)' }}>{title}</div>
          <IconButton name="x" size="sm" onClick={onClose} />
        </div>
        <div>{children}</div>
        {footer && <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 'var(--space-5)' }}>{footer}</div>}
      </div>
      <style>{`@keyframes gwf-dialog-in { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}
