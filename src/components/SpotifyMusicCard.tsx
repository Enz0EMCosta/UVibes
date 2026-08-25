import React, { useState, useEffect } from 'react';
import type { SpotifyTrack } from '../types/spotify';
import './SpotifyMusicCard.css';

interface SpotifyMusicCardProps {
  track: SpotifyTrack;
  bpm: number | null;
  onNext?: () => void;
  onPrev?: () => void;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
}

export const SpotifyMusicCard: React.FC<SpotifyMusicCardProps> = ({
  track,
  bpm,
  onNext,
  onPrev,
  isPlaying = true,
  onTogglePlay,
}) => {
  const [playingState, setPlayingState] = useState(isPlaying);
  const [progress, setProgress] = useState(38); // percentage
  const [volume, setVolume] = useState(75);
  const [currentTimeSec, setCurrentTimeSec] = useState(64); // ~1:04

  useEffect(() => {
    setPlayingState(isPlaying);
  }, [isPlaying]);

  // Simulate progress when playing
  useEffect(() => {
    if (!playingState) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 0;
        return prev + 0.5;
      });
      setCurrentTimeSec((prev) => (prev > 210 ? 0 : prev + 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [playingState]);

  const togglePlay = () => {
    const next = !playingState;
    setPlayingState(next);
    if (onTogglePlay) onTogglePlay();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const durationSeconds = Math.round(track.duration_ms / 1000);

  const albumArt =
    track.album?.images?.[1]?.url ??
    track.album?.images?.[0]?.url ??
    track.album?.images?.[2]?.url;

  return (
    <div className="card-container">
      {/* Spotify music card (From Uiverse.io by csozidev) */}
      <div className="card">
        <div className="top">
          <div className="pfp">
            {albumArt ? (
              <img src={albumArt} alt={track.name} className="pfp-img" />
            ) : (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="#191414">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            )}
          </div>
          <div className="texts">
            <p className="title-1" title={track.name}>
              {track.name}
            </p>
            <p className="title-2">
              {track.artists?.[0]?.name ?? 'Artista'}
              {bpm ? ` • ${Math.round(bpm)} BPM` : ''}
            </p>
          </div>
        </div>

        <div className="track-stats" aria-label="Estatísticas da música">
          <div className="track-stat">
            <span className="track-stat-label">Duração</span>
            <strong>{formatTime(durationSeconds)}</strong>
          </div>
          <div className="track-stat-divider" />
          <div className="track-stat">
            <span className="track-stat-label">BPM</span>
            <strong>{bpm ? Math.round(bpm) : '--'}</strong>
          </div>
        </div>

        <div className="controls">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            height="20"
            width="20"
            className="volume_button"
          >
            <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.5A2.25 2.25 0 0 0 2.25 9.75v4.5a2.25 2.25 0 0 0 2.25 2.25h1.94l4.5 4.5c.944.945 2.56.276 2.56-1.06V4.06ZM18.584 5.106a.75.75 0 0 1 1.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 0 1-1.06-1.06 8.25 8.25 0 0 0 0-11.668.75.75 0 0 1 0-1.06Z" />
            <path d="M15.932 7.757a.75.75 0 0 1 1.061 0 6 6 0 0 1 0 8.486.75.75 0 0 1-1.06-1.061 4.5 4.5 0 0 0 0-6.364.75.75 0 0 1 0-1.06Z" />
          </svg>

          <div
            className="volume"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const newVol = Math.max(5, Math.min(100, (clickX / rect.width) * 100));
              setVolume(newVol);
            }}
          >
            <div className="slider">
              <div className="green" style={{ width: `${volume}%` }}></div>
            </div>
            <div className="circle" style={{ left: `${volume * 0.8}%` }}></div>
          </div>

          <div className="air"></div>

          {/* Previous song button */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            height="20"
            width="20"
            onClick={onPrev}
            aria-label="Música anterior"
          >
            <path d="M9.195 18.44c1.25.714 2.805-.189 2.805-1.629v-2.34l6.945 3.968c1.25.715 2.805-.188 2.805-1.628V7.19c0-1.44-1.555-2.343-2.805-1.628L12 9.529v-2.34c0-1.44-1.555-2.343-2.805-1.628L2.25 9.529v-2.34a.75.75 0 0 0-1.5 0v9.622a.75.75 0 0 0 1.5 0v-2.34l6.945 3.969Z" />
          </svg>

          {/* Play/Pause toggle */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            height="20"
            width="20"
            onClick={togglePlay}
            aria-label={playingState ? 'Pausar' : 'Tocar'}
          >
            {playingState ? (
              <path
                fillRule="evenodd"
                d="M6.75 5.25a.75.75 0 0 1 .75.75v12a.75.75 0 0 1-1.5 0v-12a.75.75 0 0 1 .75-.75Zm10.5 0a.75.75 0 0 1 .75.75v12a.75.75 0 0 1-1.5 0v-12a.75.75 0 0 1 .75-.75Z"
                clipRule="evenodd"
              />
            ) : (
              <path
                fillRule="evenodd"
                d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653Z"
                clipRule="evenodd"
              />
            )}
          </svg>

          {/* Next song button */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            height="20"
            width="20"
            onClick={onNext}
            aria-label="Próxima música"
          >
            <path d="M5.055 7.06C3.805 6.347 2.25 7.25 2.25 8.69v8.622c0 1.44 1.555 2.343 2.805 1.628L12 14.971v2.34c0 1.44 1.555 2.343 2.805 1.628l6.945-3.968v2.34a.75.75 0 0 0 1.5 0V7.689a.75.75 0 0 0-1.5 0v2.34L14.805 6.06C13.555 5.346 12 6.249 12 7.689v2.34L5.055 7.061Z" />
          </svg>

          <div className="air"></div>

          {/* Animated equalizer bars */}
          <div className={`playing ${playingState ? 'is-active' : 'is-paused'}`}>
            <div className="greenline line-1"></div>
            <div className="greenline line-2"></div>
            <div className="greenline line-3"></div>
            <div className="greenline line-4"></div>
            <div className="greenline line-5"></div>
          </div>
        </div>

        {/* Progress track */}
        <div
          className="time"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const newPct = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
            setProgress(newPct);
            setCurrentTimeSec(Math.round((newPct / 100) * 214));
          }}
        >
          <div className="elapsed" style={{ width: `${progress}%` }}></div>
        </div>

        <p className="timetext time_now">{formatTime(currentTimeSec)}</p>
        <p className="timetext time_full">3:34</p>
      </div>
    </div>
  );
};
