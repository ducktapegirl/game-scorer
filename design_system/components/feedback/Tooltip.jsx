import React from 'react';

/** Small hover label for icon-only controls. */
export function Tooltip({ label, children }) {
  const [visible, setVisible] = React.useState(false);
  return (
    <span
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span style={{
          position: 'absolute', bottom: '125%', left: '50%', transform: 'translateX(-50%)',
          background: 'var(--ink-800)', color: 'var(--cream-25)',
          fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)',
          padding: '6px 10px', borderRadius: 'var(--radius-sm)', whiteSpace: 'nowrap',
          boxShadow: 'var(--shadow-sm)', animation: 'gwf-tooltip-in 150ms ease-out',
        }}>
          {label}
        </span>
      )}
      <style>{`@keyframes gwf-tooltip-in { from { opacity:0; } to { opacity:1; } }`}</style>
    </span>
  );
}
