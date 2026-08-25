import React from 'react';
import type { SpotifyTrack } from '../types/spotify';

interface SearchResultsListProps {
  tracks: SpotifyTrack[];
  selectedTrackId?: string;
  onSelectTrack: (track: SpotifyTrack) => void;
  onClose: () => void;
}

const formatDuration = (ms?: number): string => {
  if (!ms) return '0:00';
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const SearchResultsList: React.FC<SearchResultsListProps> = ({
  tracks,
  selectedTrackId,
  onSelectTrack,
  onClose,
}) => {
  if (!tracks || tracks.length === 0) return null;

  return (
    <div className="pixel-search-results-box">
      <div className="search-results-header">
        <span className="results-title">
          <span className="pixel-icon">🔍</span> RESULTADOS ENCONTRADOS ({tracks.length})
        </span>
        <button type="button" className="pixel-btn-close" onClick={onClose}>
          ✕ FECHAR
        </button>
      </div>

      <div className="search-results-list">
        {tracks.map((track) => {
          const isSelected = track.id === selectedTrackId;
          const cover =
            track.album?.images?.[0]?.url ??
            'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=300&q=80';

          return (
            <div
              key={track.id}
              className={`search-result-item ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelectTrack(track)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onSelectTrack(track);
                }
              }}
            >
              <img src={cover} alt={track.name} className="result-cover" />
              <div className="result-info">
                <span className="result-name">{track.name}</span>
                <span className="result-artist">
                  {track.artists?.map((a) => a.name).join(', ') ?? 'Artista'}
                </span>
                <div className="result-meta">
                  <span className="result-album">{track.album?.name ?? 'Single'}</span>
                  <span className="result-duration">{formatDuration(track.duration_ms)}</span>
                </div>
              </div>
              <button
                type="button"
                className={`pixel-btn-select ${isSelected ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectTrack(track);
                }}
              >
                {isSelected ? '✓ ATIVO' : 'ANALISAR ▶'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SearchResultsList;
