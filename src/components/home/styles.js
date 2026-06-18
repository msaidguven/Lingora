// components/home/styles.js
export const globalCss = `
  @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@500;700;800&family=Inter:wght@400;500;600&display=swap');

  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulseGlow { 0%, 100% { opacity: 0.55; } 50% { opacity: 0.85; } }
  @keyframes shimmer { 0% { transform: translateX(-120%) skewX(-15deg); } 100% { transform: translateX(220%) skewX(-15deg); } }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }

  .reveal { animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
  .reveal[data-delay="0"] { animation-delay: 0.02s; }
  .reveal[data-delay="0.5"] { animation-delay: 0.05s; }
  .reveal[data-delay="1"] { animation-delay: 0.08s; }
  .reveal[data-delay="2"] { animation-delay: 0.14s; }
  .reveal[data-delay="3"] { animation-delay: 0.20s; }
  .reveal[data-delay="4"] { animation-delay: 0.26s; }
  .reveal[data-delay="5"] { animation-delay: 0.32s; }

  .cta-btn { transition: transform 0.18s ease, filter 0.18s ease; }
  .cta-btn:active:not(:disabled) { transform: scale(0.97); }
  .cta-btn:hover:not(:disabled) { filter: brightness(1.07); }

  .quiz-btn { transition: transform 0.18s ease, filter 0.18s ease; }
  .quiz-btn-active:hover { transform: translateY(-2px); filter: brightness(1.06); }
  .quiz-btn-active:active { transform: translateY(0) scale(0.985); }

  .stat-tile { transition: transform 0.2s ease, border-color 0.2s ease; }
  .stat-tile:hover { transform: translateY(-3px); border-color: #383260; }

  .lesson-card {
    transition: all 0.2s ease;
    cursor: pointer;
  }
  .lesson-card:hover {
    border-color: #6366f1 !important;
    transform: translateX(4px);
    box-shadow: 0 4px 16px rgba(99, 102, 241, 0.15);
  }
  .lesson-card:active {
    transform: scale(0.98);
  }

  @media (prefers-reduced-motion: reduce) {
    .reveal, .cta-btn, .quiz-btn, .stat-tile, .lesson-card { 
      animation: none !important; 
      transition: none !important; 
    }
  }
`;

export const styles = {
  page: {
    minHeight: "100vh",
    background: "#0a0915",
    color: "#e9e6f7",
    fontFamily: "'Inter', system-ui, sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  glowTop: {
    position: "absolute",
    top: -120,
    left: "50%",
    transform: "translateX(-50%)",
    width: 480,
    height: 320,
    background: "radial-gradient(circle, rgba(99,102,241,0.28), transparent 70%)",
    filter: "blur(10px)",
    pointerEvents: "none",
    animation: "pulseGlow 6s ease-in-out infinite",
  },
  glowBottom: {
    position: "absolute",
    bottom: -160,
    right: -80,
    width: 420,
    height: 360,
    background: "radial-gradient(circle, rgba(168,85,247,0.18), transparent 70%)",
    filter: "blur(10px)",
    pointerEvents: "none",
    animation: "pulseGlow 7s ease-in-out infinite 1s",
  },
  content: {
    position: "relative",
    zIndex: 1,
    maxWidth: 420,
    margin: "0 auto",
    padding: "28px 20px 36px",
    transition: "opacity 0.5s ease, transform 0.5s ease",
  },
  loadingScreen: {
    minHeight: "100vh",
    background: "#0a0915",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  loadingRing: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    border: "3px solid #1e1b3a",
    borderTopColor: "#8b7cff",
    animation: "spin 0.8s linear infinite",
  },
  loadingText: {
    color: "#6b6690",
    fontSize: 13,
    letterSpacing: 1,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
  },
  brand: {
    fontSize: 11,
    letterSpacing: 3,
    color: "#8b7cff",
    fontWeight: 700,
    fontFamily: "'Manrope', sans-serif",
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  brandDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#8b7cff",
    boxShadow: "0 0 8px #8b7cff",
  },
  levelRow: {
    display: "flex",
    alignItems: "baseline",
    gap: 6,
  },
  levelBadge: {
    fontSize: 22,
    fontWeight: 800,
    fontFamily: "'Manrope', sans-serif",
    background: "linear-gradient(135deg, #fff, #b9b3e8)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
  },
  levelLabel: {
    fontSize: 13,
    color: "#6b6690",
    fontWeight: 500,
  },
  lessonsSection: {
    marginBottom: 20,
  },
  lessonsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  lessonsTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: "#e9e6f7",
    fontFamily: "'Manrope', sans-serif",
  },
  lessonsCount: {
    fontSize: 11,
    color: "#6b6690",
    background: "#161427",
    padding: "2px 10px",
    borderRadius: 12,
  },
  lessonsLoading: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "16px",
    background: "#130f24",
    borderRadius: 14,
    border: "1px solid #201c3a",
    color: "#6b6690",
    fontSize: 13,
  },
  lessonsList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  lessonCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    background: "#130f24",
    borderRadius: 14,
    border: "1px solid #201c3a",
  },
  lessonCardLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  lessonNumber: {
    fontSize: 12,
    fontWeight: 700,
    color: "#8b7cff",
    background: "rgba(139, 124, 255, 0.12)",
    padding: "2px 10px",
    borderRadius: 6,
    fontFamily: "'Manrope', sans-serif",
  },
  lessonTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: "#e9e6f7",
  },
  lessonLevel: {
    fontSize: 10,
    color: "#6b6690",
    marginTop: 2,
    background: "#0a0915",
    padding: "1px 8px",
    borderRadius: 4,
    display: "inline-block",
  },
  lessonArrow: {
    color: "#4b4768",
    fontSize: 16,
    transition: "all 0.2s ease",
  },
  noLessons: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "20px",
    background: "#130f24",
    borderRadius: 14,
    border: "1px solid #201c3a",
    color: "#6b6690",
    fontSize: 13,
  },
  noLessonsIcon: {
    fontSize: 18,
  },
  miniSpinner: {
    width: 14,
    height: 14,
    borderRadius: "50%",
    border: "2px solid #1e1b3a",
    borderTopColor: "#8b7cff",
    animation: "spin 0.7s linear infinite",
    display: "inline-block",
  },
  progressCard: {
    background: "linear-gradient(155deg, #15122a, #100e22)",
    border: "1px solid #211d3f",
    borderRadius: 20,
    padding: "18px 18px 16px",
    marginBottom: 18,
  },
  progressTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  progressLabel: {
    fontSize: 12.5,
    color: "#807bab",
    marginBottom: 4,
    fontWeight: 500,
  },
  progressValue: {
    fontSize: 26,
    fontWeight: 800,
    fontFamily: "'Manrope', sans-serif",
    color: "#fff",
  },
  progressValueMuted: {
    fontSize: 15,
    fontWeight: 600,
    color: "#5e5887",
  },
  progressRingWrap: {
    position: "relative",
    width: 56,
    height: 56,
  },
  progressRingText: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 700,
    color: "#cdc8f0",
  },
  track: {
    height: 7,
    background: "#1a1730",
    borderRadius: 99,
    overflow: "hidden",
  },
  trackFill: {
    height: "100%",
    background: "linear-gradient(90deg, #8b7cff, #5b8cff)",
    borderRadius: 99,
    transition: "width 1.1s cubic-bezier(0.16, 1, 0.3, 1) 0.3s",
  },
  ctaButton: {
    position: "relative",
    overflow: "hidden",
    width: "100%",
    padding: "17px",
    borderRadius: 16,
    border: "none",
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "#fff",
    fontWeight: 700,
    fontSize: 15.5,
    fontFamily: "'Manrope', sans-serif",
    cursor: "pointer",
    marginBottom: 14,
    boxShadow: "0 10px 28px -10px rgba(16,185,129,0.55)",
  },
  ctaButtonDisabled: {
    background: "#2a2a3a",
    boxShadow: "none",
    cursor: "not-allowed",
  },
  ctaShine: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "40%",
    height: "100%",
    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)",
    animation: "shimmer 2.8s ease-in-out infinite",
  },
  ctaContent: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  ctaIcon: {
    fontSize: 14,
  },
  quizStack: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginBottom: 16,
  },
  quizButton: {
    width: "100%",
    padding: "15px 16px",
    borderRadius: 16,
    border: "none",
    fontWeight: 700,
    fontSize: 14.5,
    fontFamily: "'Manrope', sans-serif",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  quizLeft: {
    display: "flex",
    alignItems: "center",
    gap: 9,
  },
  quizIcon: {
    fontSize: 17,
  },
  quizCount: {
    fontSize: 12,
    fontWeight: 700,
    padding: "3px 11px",
    borderRadius: 99,
    minWidth: 26,
    textAlign: "center",
  },
  statGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    marginBottom: 16,
  },
  statTile: {
    background: "#130f24",
    border: "1px solid #201c3a",
    borderRadius: 16,
    padding: "16px 14px",
    textAlign: "center",
  },
  statIcon: {
    fontSize: 22,
    marginBottom: 6,
    opacity: 0.9,
  },
  statValue: {
    fontSize: 21,
    fontWeight: 800,
    fontFamily: "'Manrope', sans-serif",
    color: "#fff",
  },
  statLabel: {
    fontSize: 11,
    color: "#6b6690",
    marginTop: 2,
  },
  summaryBar: {
    padding: "13px 10px",
    background: "#100e1f",
    border: "1px solid #1c1834",
    borderRadius: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
  },
  summaryItem: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
  },
  summaryDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    display: "inline-block",
  },
  summaryLabel: {
    color: "#807bab",
  },
  summaryValue: {
    color: "#e9e6f7",
    fontWeight: 700,
  },
  summaryDivider: {
    width: 1,
    height: 18,
    background: "#221e3c",
  },
};