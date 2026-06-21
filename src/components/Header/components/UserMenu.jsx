// src/components/Header/components/UserMenu.jsx
export default function UserMenu({
  menuOpen,
  setMenuOpen,
  menuRef,
  displayName,
  user,
  userLevel,
  accent,
  roleLabel,
  isAdmin,
  theme,
  toggleTheme,
  isActive,
  goToStats,
  goToAdmin,
  handleLogout,
}) {
  return (
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
          {/* Kullanıcı bilgisi */}
          <div className="dropdown-user">
            <div className="dropdown-avatar">
              <i className="ti ti-user-circle" />
            </div>
            <div className="dropdown-user-info">
              <div className="dropdown-username">{displayName}</div>
              <div className="dropdown-user-level">
                Seviye: <span style={{ color: accent.from, fontWeight: 700 }}>{userLevel || "A1"}</span>
              </div>
              {roleLabel && (
                <div
                  className="dropdown-user-role"
                  style={{
                    fontSize: 10,
                    color: accent.from,
                    fontWeight: 600,
                    background: "rgba(99,102,241,0.1)",
                    padding: "2px 8px",
                    borderRadius: 4,
                    display: "inline-block",
                    marginTop: 2,
                  }}
                >
                  {roleLabel}
                </div>
              )}
              <div className="dropdown-user-email">{user?.email}</div>
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
                  background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))",
                  border: "1px solid rgba(99,102,241,0.2)",
                }}
              >
                <i className="ti ti-shield" style={{ color: "#8b5cf6" }} />
                <span style={{ fontWeight: 700 }}>Admin Paneli</span>
                <span
                  className="dropdown-badge"
                  style={{ background: "linear-gradient(135deg, #8b5cf6, #6366f1)", color: "#fff" }}
                >
                  {roleLabel}
                </span>
              </button>
              <div className="dropdown-divider" />
            </>
          )}

          {/* Tema Değiştir */}
          <button className="dropdown-item" onClick={toggleTheme}>
            <i className={`ti ${theme === "dark" ? "ti-sun" : "ti-moon"}`} />
            <span>{theme === "dark" ? "Açık Tema" : "Koyu Tema"}</span>
            <span className="dropdown-badge">{theme === "dark" ? "🌙" : "☀️"}</span>
          </button>

          <div className="dropdown-divider" />

          {/* İstatistikler */}
          <button
            className={`dropdown-item ${isActive("stats") ? "dropdown-item-active" : ""}`}
            onClick={goToStats}
            style={{
              background: isActive("stats") ? `linear-gradient(135deg, ${accent.from}, ${accent.to})` : "none",
              color: isActive("stats") ? "#ffffff" : "var(--text-main)",
            }}
          >
            <i className="ti ti-chart-line" />
            <span>Öğrendiğim Kelimeler</span>
            {isActive("stats") && <span className="dropdown-badge">Aktif</span>}
          </button>

          {/* TODO: Profil sayfası route'u hazır olduğunda gerçek onClick ekle */}
          <button className="dropdown-item">
            <i className="ti ti-user" />
            <span>Profil</span>
            <i className="ti ti-chevron-right dropdown-item-arrow" />
          </button>

          {/* TODO: Ayarlar sayfası route'u hazır olduğunda gerçek onClick ekle */}
          <button className="dropdown-item">
            <i className="ti ti-settings" />
            <span>Ayarlar</span>
            <i className="ti ti-chevron-right dropdown-item-arrow" />
          </button>

          <div className="dropdown-divider" />

          {/* Çıkış Yap */}
          <button className="dropdown-item dropdown-item-logout" onClick={handleLogout}>
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
  );
}
