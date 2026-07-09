/** Colored initial-circle avatar (no photo uploads in this system). */
function PlayerAvatar({ name, color, size = 40 }) {
  const initial = (name || '?').trim()[0]?.toUpperCase() || '?';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color, color: 'var(--cream-25)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: size * 0.42,
      flexShrink: 0,
    }}>
      {initial}
    </div>
  );
}

window.PlayerAvatar = PlayerAvatar;
