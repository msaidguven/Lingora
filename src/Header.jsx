import { useState, useEffect, useRef } from "react";
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
  const [theme, setTheme] = useState("dark");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

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

    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  const isActive = (key) => currentScreen === key;

  const getQuizLabel = () => {
    if (quizType === "word") return "KELİME";
    if (quizType === "sentence") return "CÜMLE";
    return "QUIZ";
  };

  const getQuizIcon = () => {
    if (quizType === "word") return "ti-book";
    if (quizType === "sentence") return "ti-message";
    return "ti-tournament";
  };

  return (
    <div style={styles.wrapper} className="header-wrapper">
      <style>{css}</style>
      <div style={styles.glow} className="header-glow" />
      <div style={styles.bar}>

        {/* Kullanıcı */}
        <div style={styles.userBlock}>
          <div style={styles.username} className="text-primary">{user?.username || "Öğrenci"}</div>
          <a href="https://lingora-phi.vercel.app/admin" style={styles.adminLink} className="admin-link">
            <i className="ti ti-settings" style={{ fontSize: 11 }} aria-hidden="true" />
            Admin
          </a>
        </div>

        {/* Navigasyon */}
        <div style={styles.nav} className="nav-container">
          {NAV_ITEMS.map(({ key, icon, label }) => {
            const active = isActive(key);
            const isQuiz = key === "quiz";
            const displayIcon = isQuiz && active ? getQuizIcon() : icon;
            const displayLabel = isQuiz && active ? getQuizLabel() : label;

            return (
              <button
                key={key}
                onClick={() => onNavigate(key, isQuiz ? null : undefined)}
                className={active ? "nav-btn nav-btn-active" : "nav-btn"}
                style={{
                  ...styles.navBtn,
                  background: active
                    ? `linear-gradient(135deg, ${accent.from}, ${accent.to})`
                    : "transparent",
                  color: active ? "#ffffff" : "var(--text-muted)",
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

        {/* Profil / Ayarlar Açılır Menüsü */}
        <div style={styles.menuContainer} ref={menuRef}>
          <button 
            style={styles.menuToggleBtn} 
            className="menu-toggle-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Ayarları Aç"
          >
            <i className="ti ti-user-circle" style={{ fontSize: 20 }} />
          </button>

          {menuOpen && (
            <div style={styles.dropdown} className="dropdown-menu">
              <div style={styles.dropdownHeader}>AYARLAR</div>
              <button style={styles.dropdownItem} className="dropdown-item" onClick={toggleTheme}>
                <i className={`ti ${theme === "dark" ? "ti-sun" : "ti-moon"}`} style={{ fontSize: 13 }} />
                <span>{theme === "dark" ? "Açık Tema" : "Koyu Tema"}</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

const css = `
  :root, [data-theme="dark"] {
    --bg-wrapper: rgba(10, 9, 21, 0.85);
    --bg-nav: #100e1f;
    --text-main: #ece9fa;
    --text-muted: #5b5683;
    --border-color: rgba(255, 255, 255, 0.06);
    --dropdown-bg: #16142c;
    --dropdown-hover: rgba(255, 255, 255, 0.05);
    --glow-opacity: 0.16;
  }

  [data-theme="light"] {
    --bg-wrapper: rgba(245, 245, 247, 0.85);
    --bg-nav: #ffffff;
    --text-main: #1d1d1f;
    --text-muted: #86868b;
    --border-color: rgba(0, 0, 0, 0.08);
    --dropdown-bg: #ffffff;
    --dropdown-hover: rgba(0, 0, 0, 0.05);
    --glow-opacity: 0.04;
  }

  .header-wrapper { background: var(--bg-wrapper) !important; border-bottom: 1px solid var(--border-color) !important; }
  .header-glow { background: radial-gradient(circle, rgba(99,102,241,var(--glow-opacity)), transparent 75%) !important; }
  .text-primary { color: var(--text-main) !important; }
  .admin-link { color: var(--text-muted) !important; }
  .nav-container { background: var(--bg-nav) !important; border: 1px solid var(--border-color) !important; }
  
  @keyframes flicker {
    0%, 100% { filter: drop-shadow(0 0 3px rgba(245,158,11,0.6)); transform: scale(1); }
    50% { filter: drop-shadow(0 0 7px rgba(245,158,11,0.9)); transform: scale(1.06); }
  }
  @keyframes headerFade {
    from { opacity: 0; transform: translateY(-6px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes dropdownFade {
    from { opacity: 0; transform: translateY(6px) scale(0.96); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  .nav-btn { transition: background 0.2s ease, color 0.2s ease, transform 0.15s ease; }
  .nav-btn:active { transform: scale(0.94); }
  .nav-btn-active i { animation: headerFade 0.3s ease; }

  .admin-link { transition: color 0.2s ease; }
  .admin-link:hover { color: #a89cff !important; }

  .streak-pill i { animation: flicker 2.4s ease-in-out infinite; }

  .menu-toggle-btn { color: var(--text-muted); transition: color 0.2s, transform 0.2s; }
  .menu-toggle-btn:hover { color: var(--text-main); transform: scale(1.05); }
  
  .dropdown-menu { 
    background: var(--dropdown-bg) !important; 
    border: 1px solid var(--border-color) !important;
    box-shadow: 0 10px 30px rgba(0,0,0, 0.25);
    animation: dropdownFade 0.15s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .dropdown-item { color: var(--text-main) !important; transition: background 0.15s; }
  .dropdown-item:hover { background: var(--dropdown-hover) !important; }

  @media (prefers-reduced-motion: reduce) {
    .nav-btn, .admin-link, .menu-toggle-btn, .dropdown-item { transition: none !important; }
    .streak-pill i, .dropdown-menu { animation: none !important; }
  }
`;

const styles = {
  wrapper: {
    position: "sticky",
    top: 0,
    zIndex: 1000, /* Sayfa içi diğer elemanların üstünde kalması için yükseltildi */
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    overflow: "visible", /* Taşmaları kesmemesi için visible yapıldı */
  },
  glow: {
    position: "absolute",
    top: -40,
    left: "50%",
    transform: "translateX(-50%)",
    width: 320,
    height: 80,
    pointerEvents: "none",
  },
  bar: {
    position: "relative",
    maxWidth: 480,
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 14px",
    overflow: "visible",
  },
  userBlock: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
    minWidth: 55,
  },
  username: {
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: "-0.2px",
    fontFamily: "'Manrope', sans-serif",
  },
  adminLink: {
    fontSize: 10,
    textDecoration: "none",
    letterSpacing: "0.2px",
    display: "flex",
    alignItems: "center",
    gap: 3,
  },
  nav: {
    display: "flex",
    flex: "1 1 auto", /* Esnek yapıldı, butona yer bırakacak */
    borderRadius: 14,
    padding: 4,
    gap: 3,
    minWidth: 0,
  },
  navBtn: {
    flex: 1,
    border: "none",
    borderRadius: 10,
    padding: "8px 2px",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 3,
    minWidth: 0,
  },
  navIcon: {
    fontSize: 16,
  },
  navLabel: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.2px",
    fontFamily: "'Manrope', sans-serif",
  },
  streak: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    background: "rgba(245,158,11,0.1)",
    border: "1px solid rgba(245,158,11,0.25)",
    borderRadius: 12,
    padding: "8px 9px",
    flexShrink: 0,
  },
  flameIcon: {
    fontSize: 15,
    color: "#f59e0b",
  },
  streakValue: {
    fontSize: 13,
    fontWeight: 800,
    color: "#f59e0b",
    lineHeight: 1,
    fontFamily: "'Manrope', sans-serif",
  },
  menuContainer: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
  },
  menuToggleBtn: {
    background: "none",
    border: "none",
    padding: "4px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  dropdown: {
    position: "absolute",
    top: "calc(100% + 12px)",
    right: 0,
    width: 120,
    borderRadius: 12,
    padding: "5px",
    zIndex: 1100, /* Diğer her şeyin (kartlar, tablolar vs.) kesinlikle önünde görünmesi için */
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  dropdownHeader: {
    fontSize: 9,
    fontWeight: 800,
    color: "var(--text-muted)",
    padding: "4px 8px 2px 8px",
    letterSpacing: "0.5px",
  },
  dropdownItem: {
    background: "none",
    border: "none",
    borderRadius: 8,
    padding: "6px 8px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 11,
    fontWeight: 600,
    textAlign: "left",
    width: "100%",
  }
};