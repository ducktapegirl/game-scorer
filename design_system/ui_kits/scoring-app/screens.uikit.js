const { Button, IconButton, Input, Card, Badge, Tag, Tabs, Dialog, Toast, Icon } = window.GamesWithFriendsDesignSystem_019dd7;
const { PlayerAvatar } = window;

const PLAYER_COLORS = ['var(--coral-500)', 'var(--teal-500)', 'var(--mustard-500)', 'var(--olive-500)'];

const SAMPLE_GAMES = [
  { id: 'tidepool', name: 'Tidepool', color: 'var(--teal-500)', players: '2–4', tags: ['Strategy'] },
  { id: 'lantern-row', name: 'Lantern Row', color: 'var(--mustard-500)', players: '3–5', tags: ['Party'] },
  { id: 'copper-hollow', name: 'Copper Hollow', color: 'var(--olive-500)', players: '2–4', tags: ['Card game'] },
  { id: 'skybound', name: 'Skybound', color: 'var(--coral-500)', players: '2–6', tags: ['Party'] },
];

/* ---------------- Screen: Game Library ---------------- */
function GameLibrary({ onStartNewGame, recentGames }) {
  const [tab, setTab] = React.useState('library');
  return (
    <Screen>
      <TopBar title="Games with Friends" />
      <div style={{ padding: '0 20px 8px' }}>
        <Tabs tabs={[{ value: 'library', label: 'Game library' }, { value: 'history', label: 'History' }]} value={tab} onChange={setTab} />
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px 100px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {tab === 'library' ? SAMPLE_GAMES.map(g => (
          <Card key={g.id} interactive onClick={() => onStartNewGame(g)} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: g.color, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-md)' }}>{g.name}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: '2px 0 6px' }}>{g.players} players</div>
              <Tag color={g.color}>{g.tags[0]}</Tag>
            </div>
            <Icon name="chevron-right" size={20} color="var(--color-text-muted)" />
          </Card>
        )) : (
          recentGames.length === 0 ? (
            <EmptyState icon="history" text="No finished games yet. Play one to see it here." />
          ) : recentGames.map((g, i) => (
            <Card key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: g.color, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-md)' }}>{g.name}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Won by {g.winner}</div>
              </div>
              <Badge tone="success">{g.winnerScore} pts</Badge>
            </Card>
          ))
        )}
      </div>
      <BottomAction>
        <Button variant="primary" size="lg" fullWidth icon="plus" onClick={() => onStartNewGame(null)}>Add a game</Button>
      </BottomAction>
    </Screen>
  );
}

/* ---------------- Screen: New Game Setup ---------------- */
function NewGameSetup({ initialGame, onBack, onStart }) {
  const [game, setGame] = React.useState(initialGame || SAMPLE_GAMES[0]);
  const [players, setPlayers] = React.useState(['Priya', 'Sam']);
  const [draft, setDraft] = React.useState('');

  function addPlayer() {
    if (!draft.trim()) return;
    setPlayers([...players, draft.trim()]);
    setDraft('');
  }
  function removePlayer(i) {
    setPlayers(players.filter((_, idx) => idx !== i));
  }

  return (
    <Screen>
      <TopBar title="New game" onBack={onBack} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px 100px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <FieldLabel>Game</FieldLabel>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
            {SAMPLE_GAMES.map(g => (
              <div key={g.id} onClick={() => setGame(g)} style={{
                cursor: 'pointer', flexShrink: 0, textAlign: 'center', width: 76,
              }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 'var(--radius-lg)', background: g.color, margin: '0 auto 6px',
                  boxShadow: game.id === g.id ? '0 0 0 3px var(--color-surface), 0 0 0 6px ' + g.color : 'var(--shadow-sm)',
                }} />
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>{g.name}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <FieldLabel>Players ({players.length})</FieldLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {players.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', padding: '10px 14px', boxShadow: 'var(--shadow-xs)' }}>
                <PlayerAvatar name={p} color={PLAYER_COLORS[i % PLAYER_COLORS.length]} size={32} />
                <div style={{ flex: 1, fontWeight: 600 }}>{p}</div>
                <IconButton name="x" size="sm" onClick={() => removePlayer(i)} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <Input placeholder="Add player name" value={draft} onChange={setDraft} />
            <Button variant="outline" onClick={addPlayer}>Add</Button>
          </div>
        </div>
      </div>
      <BottomAction>
        <Button variant="primary" size="lg" fullWidth disabled={players.length < 1} onClick={() => onStart(game, players)}>Start scoring</Button>
      </BottomAction>
    </Screen>
  );
}

/* ---------------- Screen: Live Scoring ---------------- */
function LiveScoring({ game, players, onEndGame, onBack }) {
  const [round, setRound] = React.useState(1);
  const [scores, setScores] = React.useState(players.map(() => 0));
  const [showEndDialog, setShowEndDialog] = React.useState(false);
  const [toast, setToast] = React.useState(null);

  function adjust(i, delta) {
    setScores(scores.map((s, idx) => idx === i ? Math.max(0, s + delta) : s));
  }
  function nextRound() {
    setRound(round + 1);
    setToast(`Round ${round} saved.`);
    setTimeout(() => setToast(null), 2000);
  }

  const sorted = players.map((p, i) => ({ name: p, score: scores[i], color: PLAYER_COLORS[i % PLAYER_COLORS.length] }))
    .sort((a, b) => b.score - a.score);

  return (
    <Screen>
      <TopBar title={game.name} onBack={onBack} action={<IconButton name="flag" onClick={() => setShowEndDialog(true)} />} />
      <div style={{ padding: '4px 20px 8px', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 700 }}>
        ROUND {round}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 100px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {sorted.map((p, i) => (
          <Card key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <PlayerAvatar name={p.name} color={p.color} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>{p.name}</div>
              {i === 0 && p.score > 0 && <Badge tone="success">Leading</Badge>}
            </div>
            <IconButton name="minus" size="sm" variant="ghost" onClick={() => adjust(players.indexOf(p.name), -1)} />
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 'var(--score-md)', width: 56, textAlign: 'center', color: 'var(--color-primary)' }}>{p.score}</div>
            <IconButton name="plus" size="sm" variant="filled" onClick={() => adjust(players.indexOf(p.name), 1)} />
          </Card>
        ))}
      </div>
      <BottomAction>
        <Button variant="secondary" size="lg" fullWidth icon="chevron-right" iconPosition="right" onClick={nextRound}>End round {round}</Button>
      </BottomAction>
      {toast && <div style={{ position: 'absolute', bottom: 88, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}><Toast tone="success" message={toast} /></div>}
      <Dialog open={showEndDialog} title="End game?" onClose={() => setShowEndDialog(false)} footer={<>
        <Button variant="ghost" onClick={() => setShowEndDialog(false)}>Cancel</Button>
        <Button variant="primary" onClick={() => onEndGame(sorted)}>End game</Button>
      </>}>
        This saves final scores to history. You can't add more rounds after.
      </Dialog>
    </Screen>
  );
}

/* ---------------- Screen: Game Summary ---------------- */
function GameSummary({ game, results, onDone }) {
  const winner = results[0];
  return (
    <Screen>
      <TopBar title="Final results" />
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px 100px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Icon name="crown" size={40} color="var(--mustard-500)" />
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-2xl)', marginTop: 8 }}>
            {winner.name} wins!
          </div>
          <div style={{ color: 'var(--color-text-secondary)', marginTop: 4 }}>with {winner.score} points 🎉</div>
        </div>
        {results.map((p, i) => (
          <Card key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-text-muted)', width: 20 }}>{i + 1}</div>
            <PlayerAvatar name={p.name} color={p.color} />
            <div style={{ flex: 1, fontWeight: 700 }}>{p.name}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 'var(--score-sm)' }}>{p.score}</div>
          </Card>
        ))}
      </div>
      <BottomAction>
        <Button variant="primary" size="lg" fullWidth onClick={onDone}>Done</Button>
      </BottomAction>
    </Screen>
  );
}

/* ---------------- Shared bits ---------------- */
function Screen({ children }) {
  return (
    <div style={{
      width: 428, height: 860, background: 'var(--color-bg)', borderRadius: 36,
      overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative',
      fontFamily: 'var(--font-body)', color: 'var(--color-text-primary)',
      boxShadow: 'var(--shadow-xl)',
    }}>
      {children}
    </div>
  );
}
function TopBar({ title, onBack, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '20px 16px 12px' }}>
      {onBack ? <IconButton name="chevron-left" onClick={onBack} /> : <div style={{ width: 40 }} />}
      <div style={{ flex: 1, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-lg)', textAlign: 'center' }}>{title}</div>
      {action || <div style={{ width: 40 }} />}
    </div>
  );
}
function BottomAction({ children }) {
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px 20px 22px',
      background: 'linear-gradient(to top, var(--color-bg) 60%, transparent)',
    }}>
      {children}
    </div>
  );
}
function FieldLabel({ children }) {
  return <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 8 }}>{children}</div>;
}
function EmptyState({ icon, text }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-muted)' }}>
      <Icon name={icon} size={32} color="var(--color-text-muted)" />
      <div style={{ marginTop: 10, fontSize: 'var(--text-sm)' }}>{text}</div>
    </div>
  );
}

/* ---------------- App orchestrator ---------------- */
function App() {
  const [screen, setScreen] = React.useState('library');
  const [pendingGame, setPendingGame] = React.useState(null);
  const [activeGame, setActiveGame] = React.useState(null);
  const [activePlayers, setActivePlayers] = React.useState([]);
  const [results, setResults] = React.useState(null);
  const [history, setHistory] = React.useState([
    { name: 'Copper Hollow', color: 'var(--olive-500)', winner: 'Sam', winnerScore: 34 },
  ]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
      {screen === 'library' && (
        <GameLibrary recentGames={history} onStartNewGame={(g) => { setPendingGame(g); setScreen('setup'); }} />
      )}
      {screen === 'setup' && (
        <NewGameSetup initialGame={pendingGame} onBack={() => setScreen('library')} onStart={(game, players) => {
          setActiveGame(game); setActivePlayers(players); setScreen('scoring');
        }} />
      )}
      {screen === 'scoring' && (
        <LiveScoring game={activeGame} players={activePlayers} onBack={() => setScreen('setup')}
          onEndGame={(sorted) => {
            setResults(sorted);
            setHistory([{ name: activeGame.name, color: activeGame.color, winner: sorted[0].name, winnerScore: sorted[0].score }, ...history]);
            setScreen('summary');
          }} />
      )}
      {screen === 'summary' && (
        <GameSummary game={activeGame} results={results} onDone={() => setScreen('library')} />
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
