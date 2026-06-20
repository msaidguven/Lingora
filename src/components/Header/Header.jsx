// src/components/Header/Header.jsx
import { useState, useEffect, useRef } from "react";
import { supabase } from "../../config.js";
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import './Header.css';

const LEVEL_COLOR = {
  A1: { from: "#10b981", to: "#059669" },
  A2: { from: "#3b82f6", to: "#2563eb" },
  B1: { from: "#a855f7", to: "#7c3aed" },
  B2: { from: "#f97316", to: "#ea580c" },
};

const NAV_ITEMS = [
  { key: "home",      icon: "ti-home",             label: "ANASAYFA"   },
  { key: "dashboard", icon: "ti-layout-dashboard",  label: "İSTATİSTİK" },
  { key: "quiz",      icon: "ti-tournament",        label: "QUIZ"  },
];

// Admin yetkisi kontrolü
const hasAdminAccess = (role) => {
  return role === 'admin' || role === 'editor' || role === 'moderator';
};

export default function Header({ 
  currentScreen, 
  onNavigate, 
  userLevel, 
  userRole = 'user',
  quizType = null,
  onLogout,
  onNavigateToAdmin // Admin sayfasına gitmek için prop
}) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [userData, setUserData] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const menuRef = useRef(null);

  const accent = LEVEL_COLOR[userLevel] || { from: "#8b7cff", to: "#5b8cff" };

  // Kullanıcı verilerini çek (username ve streak_days)
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchUserData = async () => {
      try {
        const { data, error } = await supabase
          .from("en_users")
          .select("username, streak_days")
          .eq("id", user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error("Kullanıcı verisi çekme hatası:", error);
          return;
        }

        if (data) {
          setUserData({
            username: data.username || user.email?.split('@')[0] || 'Öğrenci',
            streak_days: data.streak_days || 0
          });
        } else {
          setUserData({ 
            username: user.email?.split('@')[0] || 'Öğrenci', 
            streak_days: 0 
          });
        }
      } catch (error) {
        console.error("Kullanıcı verisi işlemleri hatası:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debug: Role değiştiğinde log et
  useEffect(() => {
    console.log("🔍 Header Debug - userRole prop received:", userRole);
    const isAdminCheck = hasAdminAccess(userRole);
    console.log("🔍 Header Debug - isAdmin check result:", isAdminCheck);
  }, [userRole]);

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

  const goToStats = () => {
    onNavigate("stats");
    setMenuOpen(false);
  };

  const goToAdmin = () => {
    setMenuOpen(false);
    if (onNavigateToAdmin) {
      onNavigateToAdmin();
    } else {
      // Fallback: window.location ile yönlendir
      window.location.href = '/admin';
    }
  };

  const handleLogout = async () => {
    setMenuOpen(false);
    if (window.confirm('Çıkış yapmak istediğinize emin misiniz?')) {
      const result = await logout();
      if (result.success) {
        onLogout?.();
      } else {
        alert('Çıkış yapılırken bir hata oluştu!');
      }
    }
  };

  const displayName = userData?.username || 
                      user?.user_metadata?.full_name || 
                      user?.email?.split('@')[0] || 
                      'Öğrenci';

  // Admin yetkisi kontrolü
  const isAdmin = hasAdminAccess(userRole);
  const roleDisplayName = userRole === 'admin' ? '👑 Admin' : 
                          userRole === 'editor' ? '✏️ Editör' : 
                          userRole === 'moderator' ? '🛡️ Moderatör' : '';

  return (
    <header className="header-wrapper" data-theme={theme}>
      <div className="header-glow" />
      
      <div className="header-bar">
        {/* Navigasyon */}
        <nav className="nav-container">
          {NAV_ITEMS.map(({ key, icon, label }) => {
            const active = isActive(key);
            const isQuiz = key === "quiz";
            const displayIcon = isQuiz && active ? getQuizIcon() : icon;
            const displayLabel = isQuiz && active ? getQuizLabel() : label;

            return (
              <button
                key={key}
                onClick={() => onNavigate(key, isQuiz ? null : undefined)}
                className={`nav-btn ${active ? 'nav-btn-active' : ''}`}
                aria-label={displayLabel}
                title={displayLabel}
                style={{
                  background: active
                    ? `linear-gradient(135deg, ${accent.from}, ${accent.to})`
                    : "transparent",
                  color: active ? "#ffffff" : "var(--text-muted)",
                  boxShadow: active ? `0 4px 14px -4px ${accent.from}88` : "none",
                }}
              >
                <i className={`ti ${displayIcon}`} aria-hidden="true" />
                <span>{displayLabel}</span>
              </button>
            );
          })}
        </nav>

        {/* Sağ Bölüm */}
        <div className="header-right">
          {/* Streak */}
          <div className="streak-pill">
            <i className="ti ti-flame" aria-hidden="true" />
            <span>{userData?.streak_days || 0}</span>
          </div>

          {/* Profil Menüsü */}
          <div className="menu-container" ref={menuRef}>
            <button 
              className="menu-toggle-btn"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Ayarları Aç"
            >
              <div className="avatar-wrapper">
                <i className="ti ti-user-circle" />
                <span className="menu-label">{displayName}</span>
                <i className={`ti ${menuOpen ? "ti-chevron-up" : "ti-chevron-down"}`} />
              </div>
            </button>

            {menuOpen && (
              <div className="dropdown-menu">
                {/* Kullanıcı Bilgisi */}
                <div className="dropdown-user">
                  <div className="dropdown-avatar">
                    <i className="ti ti-user-circle" />
                  </div>
                  <div className="dropdown-user-info">
                    <div className="dropdown-username">{displayName}</div>
                    <div className="dropdown-user-level">
                      Seviye: <span style={{ color: accent.from, fontWeight: 700 }}>{userLevel || "A1"}</span>
                    </div>
                    {roleDisplayName && (
                      <div className="dropdown-user-role" style={{ 
                        fontSize: 10, 
                        color: accent.from, 
                        fontWeight: 600,
                        background: 'rgba(99,102,241,0.1)',
                        padding: '2px 8px',
                        borderRadius: 4,
                        display: 'inline-block',
                        marginTop: 2
                      }}>
                        {roleDisplayName}
                      </div>
                    )}
                    <div className="dropdown-user-email">
                      {user?.email}
                    </div>
                  </div>
                </div>

                <div className="dropdown-divider" />

                {/* Admin Linki - SADECE YETKİLİ KULLANICILAR GÖRÜR */}
                {isAdmin && (
                  <>
                    <button 
                      className="dropdown-item dropdown-item-admin"
                      onClick={goToAdmin}
                      style={{
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))',
                        border: '1px solid rgba(99,102,241,0.2)'
                      }}
                    >
                      <i className="ti ti-shield" style={{ color: '#8b5cf6' }} />
                      <span style={{ fontWeight: 700 }}>Admin Paneli</span>
                      <span className="dropdown-badge" style={{ 
                        background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                        color: '#fff'
                      }}>
                        {userRole === 'admin' ? '👑 Admin' : userRole === 'editor' ? '✏️ Editör' : '🛡️ Moderatör'}
                      </span>
                    </button>
                    <div className="dropdown-divider" />
                  </>
                )}

                {/* Tema Değiştir */}
                <button className="dropdown-item" onClick={toggleTheme}>
                  <i className={`ti ${theme === "dark" ? "ti-sun" : "ti-moon"}`} />
                  <span>{theme === "dark" ? "Açık Tema" : "Koyu Tema"}</span>
                  <span className="dropdown-badge">
                    {theme === "dark" ? "🌙" : "☀️"}
                  </span>
                </button>

                <div className="dropdown-divider" />

                {/* İstatistikler */}
                <button 
                  className={`dropdown-item ${isActive("stats") ? 'dropdown-item-active' : ''}`}
                  onClick={goToStats}
                  style={{
                    background: isActive("stats") 
                      ? `linear-gradient(135deg, ${accent.from}, ${accent.to})` 
                      : "none",
                    color: isActive("stats") ? "#ffffff" : "var(--text-main)",
                  }}
                >
                  <i className="ti ti-chart-line" />
                  <span>Öğrendiğim Kelimeler</span>
                  {isActive("stats") && (
                    <span className="dropdown-badge">Aktif</span>
                  )}
                </button>

                {/* Profil */}
                <button className="dropdown-item">
                  <i className="ti ti-user" />
                  <span>Profil</span>
                  <i className="ti ti-chevron-right dropdown-item-arrow" />
                </button>

                {/* Ayarlar */}
                <button className="dropdown-item">
                  <i className="ti ti-settings" />
                  <span>Ayarlar</span>
                  <i className="ti ti-chevron-right dropdown-item-arrow" />
                </button>

                <div className="dropdown-divider" />

                {/* Çıkış Yap */}
                <button 
                  className="dropdown-item dropdown-item-logout"
                  onClick={handleLogout}
                >
                  <i className="ti ti-logout" />
                  <span>Çıkış Yap</span>
                </button>

                <div className="dropdown-footer">
                  <span>v2.1.0</span>
                  <span>•</span>
                  <span>Lingora</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}