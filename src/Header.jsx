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
      
      {/* Arka plan gradient efekti */}
      <div style={styles.glow} className="header-glow" />
      
      <div style={styles.bar}>
        {/* Sol - Sadece isim (admin linki menüye taşındı) */}
        <div style={styles.userBlock}>
          <div style={styles.username} className="text-primary">
            <i className="ti ti-user" style={styles.userIcon} />
            {user?.username || "Öğrenci"}
          </div>
        </div>

        {/* Orta - Navigasyon */}
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

        {/* Sağ - Streak ve Menü */}
        <div style={styles.rightSection}>
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
              <div style={styles.avatarWrapper}>
                <i className="ti ti-user-circle" style={styles.avatarIcon} />
                <span style={styles.menuLabel}>Menü</span>
                <i className={`ti ${menuOpen ? "ti-chevron-up" : "ti-chevron-down"}`} style={styles.chevronIcon} />
              </div>
            </button>

            {menuOpen && (
              <div style={styles.dropdown} className="dropdown-menu">
                {/* Kullanıcı Bilgisi */}
                <div style={styles.dropdownUser}>
                  <div style={styles.dropdownAvatar}>
                    <i className="ti ti-user-circle" style={styles.dropdownAvatarIcon} />
                  </div>
                  <div style={styles.dropdownUserInfo}>
                    <div style={styles.dropdownUsername}>{user?.username || "Öğrenci"}</div>
                    <div style={styles.dropdownUserLevel}>
                      Seviye: <span style={{ color: accent.from, fontWeight: 700 }}>{userLevel || "A1"}</span>
                    </div>
                  </div>
                </div>

                <div style={styles.dropdownDivider} />

                {/* Admin Linki */}
                <a 
                  href="https://lingora-phi.vercel.app/admin" 
                  style={styles.dropdownItemLink} 
                  className="dropdown-item"
                >
                  <i className="ti ti-settings" style={styles.dropdownIcon} />
                  <span>Admin Paneli</span>
                  <span style={styles.dropdownBadge}>Yönetici</span>
                </a>

                <div style={styles.dropdownDivider} />

                {/* Tema Değiştir */}
                <button style={styles.dropdownItem} className="dropdown-item" onClick={toggleTheme}>
                  <i className={`ti ${theme === "dark" ? "ti-sun" : "ti-moon"}`} style={styles.dropdownIcon} />
                  <span>{theme === "dark" ? "Açık Tema" : "Koyu Tema"}</span>
                  <span style={styles.dropdownBadge}>
                    {theme === "dark" ? "🌙" : "☀️"}
                  </span>
                </button>

                <div style={styles.dropdownDivider} />

                {/* Profil */}
                <button style={styles.dropdownItem} className="dropdown-item">
                  <i className="ti ti-user" style={styles.dropdownIcon} />
                  <span>Profil</span>
                  <i className="ti ti-chevron-right" style={{ ...styles.dropdownIcon, marginLeft: "auto", fontSize: 12 }} />
                </button>

                {/* İstatistikler */}
                <button style={styles.dropdownItem} className="dropdown-item">
                  <i className="ti ti-chart-bar" style={styles.dropdownIcon} />
                  <span>İstatistikler</span>
                  <i className="ti ti-chevron-right" style={{ ...styles.dropdownIcon, marginLeft: "auto", fontSize: 12 }} />
                </button>

                {/* Ayarlar */}
                <button style={styles.dropdownItem} className="dropdown-item">
                  <i className="ti ti-settings" style={styles.dropdownIcon} />
                  <span>Ayarlar</span>
                  <i className="ti ti-chevron-right" style={{ ...styles.dropdownIcon, marginLeft: "auto", fontSize: 12 }} />
                </button>

                <div style={styles.dropdownDivider} />

                {/* Çıkış Yap */}
                <button style={{ ...styles.dropdownItem, color: "#ef4444" }} className="dropdown-item">
                  <i className="ti ti-logout" style={{ ...styles.dropdownIcon, color: "#ef4444" }} />
                  <span>Çıkış Yap</span>
                </button>

                <div style={styles.dropdownFooter}>
                  <span style={styles.dropdownVersion}>v2.1.0</span>
                  <span style={styles.dropdownVersion}>•</span>
                  <span style={styles.dropdownVersion}>Lingora</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const css = `
  :root, [data-theme="dark"] {
    --bg-wrapper: rgba(10, 9, 21, 0.75);
    --bg-nav: rgba(16, 14, 31, 0.8);
    --text-main: #ece9fa;
    --text-muted: #5b5683;
    --border-color: rgba(255, 255, 255, 0.06);
    --dropdown-bg: rgba(22, 20, 44, 0.95);
    --dropdown-hover: rgba(255, 255, 255, 0.05);
    --glow-opacity: 0.16;
    --shadow-color: rgba(0, 0, 0, 0.3);
    --accent-glow: rgba(99, 102, 241, 0.1);
  }

  [data-theme="light"] {
    --bg-wrapper: rgba(255, 255, 255, 0.75);
    --bg-nav: rgba(255, 255, 255, 0.8);
    --text-main: #1d1d1f;
    --text-muted: #86868b;
    --border-color: rgba(0, 0, 0, 0.06);
    --dropdown-bg: rgba(255, 255, 255, 0.95);
    --dropdown-hover: rgba(0, 0, 0, 0.03);
    --glow-opacity: 0.04;
    --shadow-color: rgba(0, 0, 0, 0.1);
    --accent-glow: rgba(99, 102, 241, 0.05);
  }

  .header-wrapper { 
    background: var(--bg-wrapper) !important; 
    border-bottom: 1px solid var(--border-color) !important;
    overflow: visible !important;
    box-shadow: 0 4px 30px var(--shadow-color) !important;
  }

  .header-glow { 
    background: radial-gradient(circle, rgba(99,102,241,var(--glow-opacity)), transparent 75%) !important;
    animation: glowPulse 4s ease-in-out infinite;
  }

  .nav-container { 
    background: var(--bg-nav) !important; 
    border: 1px solid var(--border-color) !important;
    backdrop-filter: blur(10px) !important;
    -webkit-backdrop-filter: blur(10px) !important;
  }

  .streak-pill { 
    background: rgba(245,158,11,0.12) !important;
    border: 1px solid rgba(245,158,11,0.2) !important;
    transition: all 0.3s ease !important;
  }
  .streak-pill:hover {
    background: rgba(245,158,11,0.18) !important;
    transform: scale(1.02) !important;
  }

  .streak-pill i { 
    animation: flicker 2.4s ease-in-out infinite;
    filter: drop-shadow(0 0 4px rgba(245,158,11,0.4));
  }

  .menu-toggle-btn { 
    color: var(--text-muted) !important; 
    transition: all 0.3s ease !important;
    padding: 6px 12px !important;
    border-radius: 10px !important;
    background: var(--accent-glow) !important;
  }
  .menu-toggle-btn:hover { 
    color: var(--text-main) !important;
    background: rgba(99, 102, 241, 0.15) !important;
    transform: translateY(-2px) !important;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2) !important;
  }

  .dropdown-menu { 
    background: var(--dropdown-bg) !important; 
    border: 1px solid var(--border-color) !important;
    box-shadow: 0 20px 60px var(--shadow-color) !important;
    animation: dropdownFade 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
    backdrop-filter: blur(20px) !important;
    -webkit-backdrop-filter: blur(20px) !important;
  }

  .dropdown-item { 
    color: var(--text-main) !important; 
    transition: all 0.2s ease !important;
    position: relative !important;
    text-decoration: none !important;
  }
  .dropdown-item:hover { 
    background: var(--dropdown-hover) !important;
    transform: translateX(4px) !important;
  }

  .nav-btn { 
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
    position: relative !important;
  }
  .nav-btn:active { transform: scale(0.92) !important; }
  .nav-btn-active { 
    transform: translateY(-1px) !important;
    box-shadow: 0 4px 20px rgba(99,102,241,0.3) !important;
  }
  .nav-btn-active i { animation: headerFade 0.3s ease !important; }

  @keyframes flicker {
    0%, 100% { filter: drop-shadow(0 0 3px rgba(245,158,11,0.6)); transform: scale(1); }
    50% { filter: drop-shadow(0 0 8px rgba(245,158,11,0.9)); transform: scale(1.06); }
  }

  @keyframes headerFade {
    from { opacity: 0; transform: translateY(-4px) scale(0.8); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  @keyframes dropdownFade {
    from { opacity: 0; transform: translateY(8px) scale(0.96); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  @keyframes glowPulse {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
  }

  @media (prefers-reduced-motion: reduce) {
    .nav-btn, .admin-link, .menu-toggle-btn, .dropdown-item { transition: none !important; }
    .streak-pill i, .dropdown-menu, .header-glow { animation: none !important; }
  }
`;

const styles = {
  wrapper: {
    position: "sticky",
    top: 0,
    zIndex: 1000,
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    overflow: "visible",
  },
  glow: {
    position: "absolute",
    top: -50,
    left: "50%",
    transform: "translateX(-50%)",
    width: 400,
    height: 100,
    pointerEvents: "none",
    opacity: 0.6,
  },
  bar: {
    position: "relative",
    maxWidth: 500,
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 16px",
    overflow: "visible",
  },
  userBlock: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    minWidth: 60,
    flexShrink: 0,
  },
  username: {
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: "-0.2px",
    fontFamily: "'Manrope', sans-serif",
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  userIcon: {
    fontSize: 14,
    opacity: 0.6,
  },
  nav: {
    display: "flex",
    flex: "1 1 auto",
    borderRadius: 16,
    padding: 5,
    gap: 4,
    minWidth: 0,
  },
  navBtn: {
    flex: 1,
    border: "none",
    borderRadius: 12,
    padding: "8px 4px",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 3,
    minWidth: 0,
    fontSize: 9,
  },
  navIcon: {
    fontSize: 17,
    transition: "transform 0.2s ease",
  },
  navLabel: {
    fontSize: 8.5,
    fontWeight: 700,
    letterSpacing: "0.4px",
    fontFamily: "'Manrope', sans-serif",
    textTransform: "uppercase",
  },
  rightSection: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  streak: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    borderRadius: 14,
    padding: "7px 10px",
    flexShrink: 0,
    cursor: "default",
  },
  flameIcon: {
    fontSize: 16,
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
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarWrapper: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    fontWeight: 600,
    color: "inherit",
  },
  avatarIcon: {
    fontSize: 20,
  },
  menuLabel: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.3px",
    fontFamily: "'Manrope', sans-serif",
    opacity: 0.8,
  },
  chevronIcon: {
    fontSize: 12,
    transition: "transform 0.2s ease",
  },
  dropdown: {
    position: "absolute",
    top: "calc(100% + 12px)",
    right: 0,
    width: 220,
    borderRadius: 16,
    padding: "8px",
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  dropdownUser: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "8px 10px 8px 8px",
    borderRadius: 12,
  },
  dropdownAvatar: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,124,255,0.2))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  dropdownAvatarIcon: {
    fontSize: 24,
    color: "var(--text-main)",
    opacity: 0.8,
  },
  dropdownUserInfo: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    flex: 1,
  },
  dropdownUsername: {
    fontSize: 14,
    fontWeight: 700,
    color: "var(--text-main)",
    fontFamily: "'Manrope', sans-serif",
  },
  dropdownUserLevel: {
    fontSize: 11,
    color: "var(--text-muted)",
    fontWeight: 500,
  },
  dropdownItem: {
    background: "none",
    border: "none",
    borderRadius: 10,
    padding: "8px 10px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 12,
    fontWeight: 600,
    textAlign: "left",
    width: "100%",
    fontFamily: "'Inter', sans-serif",
    color: "var(--text-main)",
    transition: "all 0.2s ease",
    textDecoration: "none",
  },
  dropdownItemLink: {
    background: "none",
    border: "none",
    borderRadius: 10,
    padding: "8px 10px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 12,
    fontWeight: 600,
    textAlign: "left",
    width: "100%",
    fontFamily: "'Inter', sans-serif",
    color: "var(--text-main)",
    transition: "all 0.2s ease",
    textDecoration: "none",
  },
  dropdownIcon: {
    fontSize: 14,
    opacity: 0.7,
    flexShrink: 0,
  },
  dropdownBadge: {
    marginLeft: "auto",
    fontSize: 10,
    padding: "2px 8px",
    borderRadius: 6,
    background: "rgba(99,102,241,0.15)",
    color: "rgba(99,102,241,0.8)",
    fontWeight: 700,
    letterSpacing: "0.3px",
  },
  dropdownDivider: {
    height: 1,
    background: "var(--border-color)",
    margin: "4px 4px",
  },
  dropdownFooter: {
    padding: "6px 10px 2px 10px",
    display: "flex",
    justifyContent: "center",
    gap: 6,
  },
  dropdownVersion: {
    fontSize: 9,
    color: "var(--text-muted)",
    opacity: 0.4,
    letterSpacing: "0.3px",
  }
};