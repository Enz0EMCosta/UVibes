import React from 'react';

interface PixelEqualizerProps {
  bpm?: number;
  isPlaying?: boolean;
  barsCount?: number;
}

export const PixelEqualizer: React.FC<PixelEqualizerProps> = ({
  bpm = 120,
  isPlaying = true,
  barsCount = 12,
}) => {
  // Speed multiplier derived from BPM
  const speedSec = (60 / Math.max(bpm, 60)) * 0.75;

  const bars = Array.from({ length: barsCount });

  return (
    <div className="pixel-equalizer-container" aria-label="Equalizador Pixel">
      <div className="pixel-equalizer-bars">
        {bars.map((_, index) => {
          const delay = (index * 0.08).toFixed(2);
          const barSpeed = (speedSec * (0.8 + (index % 4) * 0.15)).toFixed(2);

          return (
            <div
              key={index}
              className={`pixel-eq-bar ${isPlaying ? 'animating' : ''}`}
              style={{
                animationDuration: `${barSpeed}s`,
                animationDelay: `${delay}s`,
              }}
            >
              <div className="pixel-eq-segment seg-4" />
              <div className="pixel-eq-segment seg-3" />
              <div className="pixel-eq-segment seg-2" />
              <div className="pixel-eq-segment seg-1" />
            </div>
          );
        })}
      </div>
      <div className="pixel-eq-label">
        <span className="pixel-dot live-indicator" />
        <span>AUDIO VIBES // {bpm ? `${bpm.toFixed(0)} BPM` : 'STANDBY'}</span>
      </div>
    </div>
  );
};

export default PixelEqualizer;
