import React from 'react';
import type { AudioFeatures } from '../types/spotify';

interface PixelAudioMeterProps {
  features: AudioFeatures | null;
}

export const PixelAudioMeter: React.FC<PixelAudioMeterProps> = ({ features }) => {
  const metrics = [
    {
      key: 'danceability',
      label: 'DANCEABILITY',
      value: features?.danceability ?? 0,
      color: 'cyan',
      icon: '🕺',
      desc: 'Ritmo & Dançabilidade',
    },
    {
      key: 'energy',
      label: 'ENERGY',
      value: features?.energy ?? 0,
      color: 'magenta',
      icon: '⚡',
      desc: 'Intensidade & Potência',
    },
    {
      key: 'valence',
      label: 'VALENCE',
      value: features?.valence ?? 0,
      color: 'yellow',
      icon: '✨',
      desc: 'Positividade / Mood',
    },
    {
      key: 'acousticness',
      label: 'ACOUSTIC',
      value: features?.acousticness ?? 0,
      color: 'green',
      icon: '🌱',
      desc: 'Acústico vs Eletrônico',
    },
  ];

  const renderSegments = (val: number, color: string) => {
    const totalSegments = 10;
    const filledSegments = Math.round(val * totalSegments);

    return (
      <div className="pixel-meter-bar">
        {Array.from({ length: totalSegments }).map((_, idx) => (
          <div
            key={idx}
            className={`meter-cell cell-${color} ${idx < filledSegments ? 'filled' : 'empty'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="pixel-audio-meter-grid">
      {metrics.map((item) => (
        <div key={item.key} className={`pixel-meter-card theme-${item.color}`}>
          <div className="meter-card-header">
            <span className="meter-icon">{item.icon}</span>
            <span className="meter-title">{item.label}</span>
            <span className="meter-val-badge">
              {features ? `${Math.round(item.value * 100)}%` : '---'}
            </span>
          </div>

          {renderSegments(item.value, item.color)}

          <div className="meter-footer">
            <span className="meter-desc">{item.desc}</span>
            <span className="meter-raw">{features ? item.value.toFixed(2) : '0.00'}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PixelAudioMeter;
