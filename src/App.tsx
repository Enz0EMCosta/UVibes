import { useCallback, useEffect, useRef, useState } from 'react';
import InkFlowField from './components/InkFlowField';
import { Loader } from './components/Loader';
import { SocialFloatingMenu } from './components/SocialFloatingMenu';
import { SpotifyConnectCard } from './components/SpotifyConnectCard';
import { SpotifyMusicCard } from './components/SpotifyMusicCard';
import { useSpotifyPlayer } from './hooks/useSpotifyPlayer';
import type { SpotifyTrack } from './types/spotify';
import './App.css';

const KEY_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const CAMELOT_MAJOR = ['8B', '3B', '10B', '5B', '12B', '7B', '2B', '9B', '4B', '11B', '6B', '1B'];
const CAMELOT_MINOR = ['5A', '12A', '7A', '2A', '9A', '4A', '11A', '6A', '1A', '8A', '3A', '10A'];

const getKeyDetails = (key: number | undefined, mode: number | undefined) => {
  if (key === undefined || key < 0 || key > 11 || mode === undefined) {
    return { name: '--', camelot: '--' };
  }

  const isMajor = mode === 1;
  return {
    name: `${KEY_NAMES[key]} ${isMajor ? 'maior' : 'menor'}`,
    camelot: (isMajor ? CAMELOT_MAJOR : CAMELOT_MINOR)[key],
  };
};

/* ── Search Results Panel ───────────────────────────────────────────────── */
function SearchResults({
  results,
  onSelect,
  onClose,
}: {
  results: SpotifyTrack[];
  onSelect: (t: SpotifyTrack) => void;
  onClose: () => void;
}) {
  if (!results.length) return null;
  return (
    <div className="results-panel">
      <div className="results-header">
        <span>Resultados Encontrados</span>
        <button className="results-close" onClick={onClose} aria-label="Fechar">
          ✕
        </button>
      </div>
      <div className="results-list">
        {results.map((t) => (
          <button key={t.id} className="result-row" onClick={() => onSelect(t)}>
            {t.album?.images?.[2]?.url ? (
              <img src={t.album.images[2].url} alt={t.name} className="result-img" />
            ) : (
              <div className="result-img result-img--placeholder" />
            )}
            <div className="result-text">
              <span className="result-title">{t.name}</span>
              <span className="result-sub">{t.artists?.[0]?.name}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Recommendations Grid ───────────────────────────────────────────────── */
function Recommendations({
  tracks,
  onSelect,
}: {
  tracks: SpotifyTrack[];
  onSelect: (t: SpotifyTrack) => void;
}) {
  if (!tracks.length) return null;
  return (
    <section className="recs-section">
      <div className="recs-header">
        <div className="recs-line" />
        <span className="recs-label">BPMs Similares & Recomendações</span>
        <div className="recs-line" />
      </div>
      <div className="recs-grid">
        {tracks.slice(0, 6).map((t, i) => (
          <button
            key={t.id}
            className="rec-card"
            onClick={() => onSelect(t)}
            style={{ '--i': i } as React.CSSProperties}
          >
            <div className="rec-disc-wrap">
              {t.album?.images?.[2]?.url ? (
                <img src={t.album.images[2].url} alt={t.name} className="rec-disc-art" />
              ) : (
                <div className="rec-disc-art rec-disc-art--empty" />
              )}
              <div className="rec-disc-hole" />
            </div>
            <span className="rec-title">{t.name}</span>
            <span className="rec-artist">{t.artists?.[0]?.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════
   Main App
══════════════════════════════════════════════ */
export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const searchPanelRef = useRef<HTMLDivElement>(null);

  const {
    currentTrack,
    audioFeatures,
    recommendations,
    searchResults,
    activeDemo,
    demoTracks,
    isLoading,
    isSearching,
    isAuthenticated,
    error,
    searchTracks,
    selectTrack,
    clearSearchResults,
    login,
    logout,
  } = useSpotifyPlayer();

  const keyDetails = getKeyDetails(audioFeatures?.key, audioFeatures?.mode);

  const handleSearch = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!query.trim()) return;
      const results = await searchTracks(query);
      if (results.length > 1) setShowResults(true);
    },
    [query, searchTracks]
  );

  const handleSelect = useCallback(
    async (t: SpotifyTrack) => {
      setShowResults(false);
      clearSearchResults();
      setIsPlaying(true);
      await selectTrack(t);
    },
    [selectTrack, clearSearchResults]
  );

  const handleClose = useCallback(() => {
    setShowResults(false);
    clearSearchResults();
  }, [clearSearchResults]);

  // Handle Next song skip
  const handleNextTrack = useCallback(() => {
    if (recommendations.length > 0) {
      const currentIndex = recommendations.findIndex((r) => r.id === currentTrack?.id);
      const nextIndex = (currentIndex + 1) % recommendations.length;
      const next = recommendations[nextIndex];
      if (next) void selectTrack(next);
    } else if (demoTracks.length > 0) {
      const currentIndex = demoTracks.findIndex((d) => d.id === currentTrack?.id);
      const nextIndex = (currentIndex + 1) % demoTracks.length;
      const nextDemo = demoTracks[nextIndex];
      if (nextDemo) {
        void selectTrack({
          id: nextDemo.id,
          name: nextDemo.name,
          artists: [{ id: 'demo-art', name: nextDemo.artist, type: 'artist', uri: `spotify:artist:${nextDemo.id}` }],
          album: {
            id: 'demo-alb',
            name: 'Demo Album',
            artists: [{ id: 'demo-art', name: nextDemo.artist, type: 'artist', uri: `spotify:artist:${nextDemo.id}` }],
            images: [
              { url: nextDemo.cover, height: 300, width: 300 },
              { url: nextDemo.cover, height: 150, width: 150 },
              { url: nextDemo.cover, height: 64, width: 64 },
            ],
          },
          uri: `spotify:track:${nextDemo.id}`,
          duration_ms: 210000,
          preview_url: null,
          external_urls: { spotify: '' },
        });
      }
    }
  }, [recommendations, currentTrack, demoTracks, selectTrack]);

  // Handle Previous song skip
  const handlePrevTrack = useCallback(() => {
    if (recommendations.length > 0) {
      const currentIndex = recommendations.findIndex((r) => r.id === currentTrack?.id);
      const prevIndex = (currentIndex - 1 + recommendations.length) % recommendations.length;
      const prev = recommendations[prevIndex];
      if (prev) void selectTrack(prev);
    }
  }, [recommendations, currentTrack, selectTrack]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (searchPanelRef.current && !searchPanelRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <>
      {/* ── Loader with exact Uiverse plate and progress bar ── */}
      {!loaded && <Loader onDone={() => setLoaded(true)} />}

      <div className="app">
        {/* ── Exact Ink Flow Field Background with mouse interaction ── */}
        <div className="ink-bg">
          <InkFlowField
            background="#07060D"
            colors={["#000753", "#A000FF", "#71FF6C", "#FF0000", "#FFFA00"]}
            speed={99}
            dissipation={50}
            swirl={0}
            drift={21}
            glow="rgba(0, 0, 0, 0.55)"
            cursor={{ force: 60, reach: 50 }}
          />
        </div>

        {/* ── Header ── */}
        <header className="app-header">
          <div className="logo">
            <svg className="logo-vinyl" viewBox="0 0 24 24" width="22" height="22">
              <circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" strokeWidth="1" />
              <circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" strokeWidth="0.6" strokeDasharray="2 2" />
              <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="0.8" />
              <circle cx="12" cy="12" r="1.2" fill="currentColor" />
            </svg>
            <span className="logo-text">UVibes</span>
          </div>

          <div className="header-right">
            {isAuthenticated && (
              <button className="btn-ghost" onClick={logout}>
                Sair
              </button>
            )}
          </div>
        </header>

        {/* ── Main content ── */}
        <main className="app-main">
          <div className="hero">
            <div ref={searchPanelRef} className="search-wrap hero-search">
              <form className="search-form" onSubmit={handleSearch} id="search-form">
                <input
                  type="text"
                  id="search-input"
                  className="search-input"
                  placeholder="Buscar música, artista ou gênero..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={isSearching}
                  aria-label="Buscar"
                  autoComplete="off"
                />
                <button type="submit" id="search-btn" className="search-btn" disabled={isSearching || !query.trim()} aria-label="Pesquisar">
                  {isSearching ? <span className="spinner">◌</span> : <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>}
                </button>
              </form>
              {showResults && searchResults.length > 1 && <SearchResults results={searchResults} onSelect={handleSelect} onClose={handleClose} />}
            </div>

            {!isAuthenticated && <div className="connect-card-wrap"><SpotifyConnectCard onConnect={login} isAuthenticated={isAuthenticated} onLogout={logout} /></div>}

            {/* Spotify Music Card (Active Player) */}
            {currentTrack && (
              <div className="player-layout">
                <div className="player-wrap">
                  <SpotifyMusicCard
                    track={currentTrack}
                    bpm={audioFeatures?.tempo ?? null}
                    onNext={handleNextTrack}
                    onPrev={handlePrevTrack}
                    isPlaying={isPlaying}
                    onTogglePlay={() => setIsPlaying(!isPlaying)}
                  />
                </div>
                <aside className="stats-panel" aria-label="Estatísticas da música atual">
                  <span className="stats-kicker">Agora ouvindo</span>
                  <h2>{currentTrack.name}</h2>
                  <p className="stats-artist">{currentTrack.artists?.[0]?.name ?? 'Artista'}</p>
                  <div className="stats-grid">
                    <div><span>Gênero</span><strong>{activeDemo?.genre ?? 'Vibe sonora'}</strong></div>
                    <div><span>BPM</span><strong>{audioFeatures?.tempo ? Math.round(audioFeatures.tempo) : '--'}</strong></div>
                    <div><span>Duração</span><strong>{Math.floor(currentTrack.duration_ms / 60000)}:{String(Math.floor(currentTrack.duration_ms / 1000) % 60).padStart(2, '0')}</strong></div>
                    <div><span>Energia</span><strong>{audioFeatures?.energy ? `${Math.round(audioFeatures.energy * 100)}%` : '--'}</strong></div>
                    <div><span>Tonalidade</span><strong>{keyDetails.name}</strong></div>
                    <div><span>Camelot</span><strong>{keyDetails.camelot}</strong></div>
                  </div>
                </aside>
              </div>
            )}

            {!currentTrack && !isLoading && (
              <section className="waiting-panel" aria-live="polite">
                <div className="waiting-disc"><span /></div>
                <span className="waiting-kicker">UVibes player</span>
                <h1>Aguardando uma música</h1>
                <p>Conecte o Spotify ou busque uma faixa para começar sua próxima vibração.</p>
                <div className="waiting-pulse"><i /><i /><i /><i /><i /></div>
              </section>
            )}

            {/* Status alerts */}
            {error && !isLoading && <p className="status-error">{error}</p>}
            {isLoading && (
              <p className="status-loading">
                <span className="spinner">◌</span> Analisando BPM e ondas sonoras...
              </p>
            )}
          </div>

          {/* Recommendations / Similars */}
          {recommendations.length > 0 && currentTrack && (
            <Recommendations tracks={recommendations} onSelect={selectTrack} />
          )}
        </main>

        {/* ── Footer ── */}
        <footer className="app-footer">
          <span>UVibes</span>
        </footer>

        {/* ── Floating "+" Social Links Menu ── */}
        <SocialFloatingMenu />
      </div>
    </>
  );
}
