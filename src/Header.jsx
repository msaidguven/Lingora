import { useState, useEffect } from "react";
import { supabase } from "./config.js";

const FIXED_USER_ID = "302a3b6b-c1e9-49c4-98fe-52115bd7d204";
const LEVEL_COLOR = {
  A1: { from: "#10b981", to: "#059669" },
  A2: { from: "#3b82f6", to: "#2563eb" },
  B1: { from: "#a855f7", to: "#7c3aed" },
  B2: { from: "#f97316", to: "#ea580c" },
};

const NAV_ITEMS = [
  { key: "home",      icon: "ti-home",             label: "ANASAYFA"   },
  { key: "dashboard", icon: "ti-layout-dashboard",  label: "PANEL" },
  { key: "quiz",      icon: "ti-tournament",        label: "QUIZ"  },
  { key: "stats",     icon: "ti-chart-line",        label: "İSTATİSTİK" },
];

export default function Header({ currentScreen, onNavigate, userLevel, quizType = null }) {
  const [user, setUser] = useState(null);
  const accent = LEVEL_COLOR[userLevel] || { from: "#8b7cff", to: "#5b8cff" };

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase
        .from("en_users")
        .select("username, streak_days")
        .eq("id", FIXED_USER_ID)
        .single();
      if (data) setUser(data);
    };

    fetchUser();
  }, []);

  const isActive = (key) => currentScreen === key;

  // Quiz aktifken özel label gösterimi
  const getQuizLabel = () => {
    if (quizType === "word") return "KELİME";
    if (quizType === "sentence") return "CÜMLE";
    return "QUIZ";
  };

  // Quiz aktifken özel ikon gösterimi
  const getQuizIcon = () => {
    if (quizType === "word") return "ti-book";
    if (quizType === "sentence") return "ti-message";
    return "ti-tournament";
  };

  return (
    <div style={styles.wrapper}>
      <style>{css}</style>
      <div style={styles.glow} />
      <div style={styles.bar}>

        {/* Kullanıcı */}
        <div style={styles.userBlock}>
          <div style={styles.username}>{user?.username || "Öğrenci"}</div>
          <a href="https://lingora-phi.vercel.app/admin" style={styles.adminLink} className="admin-link">
            <i className="ti ti-settings" style={{ fontSize: 11 }} aria-hidden="true" />
            Admin
          </a>
        </div>

        {/* Nav */}
        <div style={styles.nav}>
          {NAV_ITEMS.map(({ key, icon, label }) => {
            const active = isActive(key);
            const isQuiz = key === "quiz";
            const displayIcon = isQuiz && active ? getQuizIcon() : icon;
            const displayLabel = isQuiz && active ? getQuizLabel() : label;

            return (
              <button
                key={key}
                onClick={() => {
                  if (key === "quiz") {
                    onNavigate(key, null);
                  } else {
                    onNavigate(key);
                  }
                }}
                className={active ? "nav-btn nav-btn-active" : "nav-btn"}
                style={{
                  ...styles.navBtn,
                  background: active
                    ? `linear-gradient(135deg, ${accent.from}, ${accent.to})`
                    : "transparent",
                  color: active ? "#ffffff" : "#5b5683",
                  boxShadow: active ? `0 4px 14px -4px ${accent.from}88` : "none",
                }}
              >
                <i className={`ti ${displayIcon}`} style={styles.navIcon} aria-hidden="true" />
                <span style={styles.navLabel}>{displayLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Streak */}
        <div style={styles.streak} className="streak-pill">
          <i className="ti ti-flame" style={styles.flameIcon} aria-hidden="true" />
          <span style={styles.streakValue}>{user?.streak_days || 0}</span>
        </div>

      </div>
    </div>
  );
}

const css = `
  @keyframes flicker {
    0%, 100% { filter: drop-shadow(0 0 3px rgba(245,158,11,0.6)); transform: scale(1); }
    50% { filter: drop-shadow(0 0 7px rgba(245,158,11,0.9)); transform: scale(1.06); }
  }
  @keyframes headerFade {
    from { opacity: 0; transform: translateY(-6px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .nav-btn { transition: background 0.2s ease, color 0.2s ease, transform 0.15s ease; }
  .nav-btn:active { transform: scale(0.94); }
  .nav-btn-active i { animation: headerFade 0.3s ease; }

  .admin-link { transition: color 0.2s ease, gap 0.2s ease; }
  .admin-link:hover { color: #a89cff !important; }

  .streak-pill i { animation: flicker 2.4s ease-in-out infinite; }

  @media (prefers-reduced-motion: reduce) {
    .nav-btn, .admin-link { transition: none !important; }
    .streak-pill i { animation: none !important; }
  }
`;

const styles = {
  wrapper: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    background: "rgba(10,9,21,0.85)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    overflow: "hidden",
  },
  glow: {
    position: "absolute",
    top: -40,
    left: "50%",
    transform: "translateX(-50%)",
    width: 320,
    height: 80,
    background: "radial-gradient(circle, rgba(99,102,241,0.16), transparent 75%)",
    pointerEvents: "none",
  },
  bar: {
    position: "relative",
    maxWidth: 480,
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 14px",
  },
  userBlock: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
    minWidth: 58,
  },
  username: {
    fontSize: 13,
    fontWeight: 700,
    color: "#ece9fa",
    letterSpacing: "-0.2px",
    fontFamily: "'Manrope', sans-serif",
  },
  adminLink: {
    fontSize: 10,
    color: "#5b5683",
    textDecoration: "none",
    letterSpacing: "0.2px",
    display: "flex",
    alignItems: "center",
    gap: 3,
  },
  nav: {
    display: "flex",
    flex: 1,
    background: "#100e1f",
    border: "1px solid rgba(255,255,255,0.05)",
    borderRadius: 14,
    padding: 4,
    gap: 3,
  },
  navBtn: {
    flex: 1,
    border: "none",
    borderRadius: 10,
    padding: "8px 4px",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 3,
  },
  navIcon: {
    fontSize: 17,
  },
  navLabel: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.4px",
    fontFamily: "'Manrope', sans-serif",
  },
  streak: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    background: "rgba(245,158,11,0.1)",
    border: "1px solid rgba(245,158,11,0.25)",
    borderRadius: 12,
    padding: "8px 11px",
  },
  flameIcon: {
    fontSize: 16,
    color: "#f59e0b",
  },
  streakValue: {
    fontSize: 14,
    fontWeight: 800,
    color: "#f59e0b",
    lineHeight: 1,
    fontFamily: "'Manrope', sans-serif",
  },
};