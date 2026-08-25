import { useEffect, useRef, useState } from "react";
import InkFlowField from "./InkFlowField";
import "./Loader.css";

interface LoaderProps {
  onDone: () => void;
}

export function Loader({ onDone }: LoaderProps) {
  const [progress, setProgress] = useState(0);
  const overlayRef = useRef<HTMLDivElement>(null);
  const doneCalled = useRef(false);

  useEffect(() => {
    // Animate progress from 0 → 100 in 2.4s with easing
    const duration = 2400; // ms
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      const pct = Math.round(eased * 100);
      setProgress(pct);

      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        // Short pause at 100% then fade out
        if (!doneCalled.current) {
          doneCalled.current = true;
          setTimeout(() => {
            const el = overlayRef.current;
            if (el) {
              el.style.opacity = "0";
              setTimeout(onDone, 500);
            } else {
              onDone();
            }
          }, 300);
        }
      }
    };

    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  return (
    <div ref={overlayRef} className="loader-overlay">
      <div className="loader-field">
        <InkFlowField
          background="#07060D"
          colors={["#07170D", "#1DB954", "#3A6B4A", "#111217"]}
          speed={70}
          dissipation={58}
          swirl={8}
          drift={14}
          glow="rgba(0, 0, 0, 0.72)"
          cursor={{ force: 45, reach: 42 }}
        />
      </div>

      {/* Vinyl plate (exact Uiverse design) */}
      <div className="container">
        <div className="plate">
          <div className="black">
            <div className="border">
              <div className="white">
                <div className="center" />
              </div>
            </div>
          </div>
        </div>
        <div className="player">
          <div className="circ" />
          <div className="rect" />
        </div>
      </div>

      {/* Brand */}
      <div className="loader-brand">UVibes</div>

      {/* Progress bar */}
      <div className="loader-bar-wrap">
        <div className="loader-bar-track">
          <div className="loader-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="loader-pct">{progress}%</span>
      </div>
    </div>
  );
}
