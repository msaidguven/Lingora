// components/home/ProgressCard.jsx
import { useState, useEffect } from "react";
import { styles } from "./styles.js";

export default function ProgressCard({ 
  myWordsCount, 
  totalWords, 
  mounted 
}) {
  const progress = totalWords > 0 ? (myWordsCount / totalWords) * 100 : 0;
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div style={styles.progressCard} className="reveal" data-delay="1">
      <div style={styles.progressTop}>
        <div>
          <div style={styles.progressLabel}>Kelime Haznen</div>
          <div style={styles.progressValue}>
            {myWordsCount}
            <span style={styles.progressValueMuted}> / {totalWords}</span>
          </div>
        </div>
        <div style={styles.progressRingWrap}>
          <svg width="56" height="56" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="24" fill="none" stroke="#1e1b3a" strokeWidth="5" />
            <circle
              cx="28"
              cy="28"
              r="24"
              fill="none"
              stroke="url(#ringGrad)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 24}
              strokeDashoffset={isMounted ? 2 * Math.PI * 24 * (1 - progress / 100) : 2 * Math.PI * 24}
              transform="rotate(-90 28 28)"
              style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(0.16, 1, 0.3, 1) 0.3s" }}
            />
            <defs>
              <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b7cff" />
                <stop offset="100%" stopColor="#5b8cff" />
              </linearGradient>
            </defs>
          </svg>
          <div style={styles.progressRingText}>{Math.round(progress)}%</div>
        </div>
      </div>
      <div style={styles.track}>
        <div
          style={{
            ...styles.trackFill,
            width: isMounted ? `${progress}%` : "0%",
          }}
        />
      </div>
    </div>
  );
}