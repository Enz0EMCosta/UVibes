import React from 'react';
import './SpotifyConnectCard.css';

interface SpotifyConnectCardProps {
  onConnect: () => void;
  isAuthenticated: boolean;
  onLogout: () => void;
}

export const SpotifyConnectCard: React.FC<SpotifyConnectCardProps> = ({
  onConnect,
  isAuthenticated,
  onLogout,
}) => {
  if (isAuthenticated) {
    return (
      <div className="spotify-connected-badge" onClick={onLogout} title="Clique para desconectar">
        <span className="dot-live" />
        <span className="connected-text">Spotify Conectado</span>
        <span className="logout-hint">Desconectar</span>
      </div>
    );
  }

  return (
    <div className="spotify-card-container" onClick={onConnect}>
      <div className="spotify-card">
        <div className="card-bg-effects">
          <div className="glow-gradient" />
          <div className="orb-bounce" />
          <div className="orb-ping-top" />
          <div className="orb-ping-bottom" />
          <div className="light-sweep" />
        </div>
        <div className="card-content">
          <div className="icon-wrapper">
            <div className="ring-ping" />
            <div className="ring-pulse" />
            <div className="icon-circle">
              <div className="icon-rotator">
                <svg className="spotify-svg" viewBox="0 0 496 512" xmlns="http://www.w3.org/2000/svg">
                  <path d="M248 8C111.1 8 0 119.1 0 256s111.1 248 248 248 248-111.1 248-248S384.9 8 248 8zm100.7 364.9c-4.2 0-6.8-1.3-10.7-3.6-62.4-37.6-135-39.2-206.7-24.5-3.9 1-9 2.6-11.9 2.6-9.7 0-15.8-7.7-15.8-15.8 0-10.3 6.1-15.2 13.6-16.8 81.9-18.1 165.6-16.5 237 30.2 6.1 3.9 9.7 7.4 9.7 16.5s-7.1 15.4-15.2 15.4zm26.9-65.6c-5.2 0-8.7-2.3-12.3-4.2-62.5-37-155.7-51.9-238.6-29.4-4.8 1.3-7.4 2.6-11.9 2.6-10.7 0-19.4-8.7-19.4-19.4s5.2-17.8 15.5-20.7c27.8-7.8 56.2-13.6 97.8-13.6 64.9 0 127.6 16.1 177 45.5 8.1 4.8 11.3 11 11.3 19.7-.1 10.8-8.5 19.5-19.4 19.5zm31-76.2c-5.2 0-8.4-1.3-12.9-3.9-71.2-42.5-198.5-52.7-280.9-29.7-3.6 1-8.1 2.6-12.9 2.6-13.2 0-23.3-10.3-23.3-23.6 0-13.6 8.4-21.3 17.4-23.9 35.2-10.3 74.6-15.2 117.5-15.2 73 0 149.5 15.2 205.4 47.8 7.8 4.5 12.9 10.7 12.9 22.6 0 13.6-11 23.3-23.2 23.3z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="title-wrap"><p className="brand-title">Descubra sua vibe</p></div>
          <div className="text-desc-wrap">
            <p className="desc-line">Conecte no seu Spotify,</p>
            <p className="desc-line">sincronize o que você está ouvindo</p>
            <p className="desc-line">e encontre faixas com a mesma vibração.</p>
          </div>
          <div className="card-divider" />
          <div className="pulse-dots"><div className="dot d1" /><div className="dot d2" /><div className="dot d3" /></div>
        </div>
        <div className="corner-glow-tl" />
        <div className="corner-glow-br" />
      </div>
    </div>
  );
};
