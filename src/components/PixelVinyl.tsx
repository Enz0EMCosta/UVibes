import React from 'react';

interface PixelVinylProps {
  coverUrl?: string;
  albumName?: string;
  bpm?: number;
  isPlaying?: boolean;
}

export const PixelVinyl: React.FC<PixelVinylProps> = ({
  coverUrl,
  albumName = 'Álbum',
  bpm = 120,
  isPlaying = true,
}) => {
  // Speed of 1 full 33/45 RPM rotation synced with BPM
  const rotationDuration = (60 / Math.max(bpm || 120, 60)) * 2;

  return (
    <div className="pixel-turntable">
      <div className="turntable-deck">
        <div
          className={`pixel-vinyl-disc ${isPlaying ? 'spinning' : ''}`}
          style={{
            animationDuration: `${rotationDuration.toFixed(2)}s`,
          }}
        >
          {/* Outer pixel grooves */}
          <div className="vinyl-groove groove-outer" />
          <div className="vinyl-groove groove-mid" />
          <div className="vinyl-groove groove-inner" />

          {/* Center record label with album artwork */}
          <div className="vinyl-center-label">
            {coverUrl ? (
              <img src={coverUrl} alt={albumName} className="vinyl-label-art" />
            ) : (
              <div className="vinyl-label-placeholder">
                <span className="pixel-symbol">♫</span>
              </div>
            )}
            <div className="vinyl-spindle-hole" />
          </div>

          {/* Vinyl light reflection shine */}
          <div className="vinyl-light-sheen" />
        </div>

        {/* 8-bit Tonearm */}
        <div className={`pixel-tonearm ${isPlaying ? 'engaged' : ''}`}>
          <div className="tonearm-base" />
          <div className="tonearm-arm" />
          <div className="tonearm-cartridge" />
        </div>

        {/* BPM Counter Badge */}
        <div className="pixel-bpm-badge">
          <span className="bpm-number">{bpm ? bpm.toFixed(1) : '---'}</span>
          <span className="bpm-unit">BPM</span>
        </div>
      </div>
    </div>
  );
};

export default PixelVinyl;
