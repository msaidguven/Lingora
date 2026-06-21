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
    <div className="dropdown dropdown-end" ref={menuRef}>
      
      {/* TOGGLE BUTTON */}
      <label
        tabIndex={0}
        className="btn btn-ghost flex items-center gap-2 normal-case"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <i className="ti ti-user-circle text-xl" />
        <span>{displayName}</span>
        <i className={`ti ${menuOpen ? "ti-chevron-up" : "ti-chevron-down"}`} />
      </label>

      {/* MENU */}
      {menuOpen && (
        <ul
          tabIndex={0}
          className="dropdown-content z-[1] menu p-3 shadow bg-base-100 rounded-box w-72"
        >
          
          {/* USER INFO */}
          <li className="p-2">
            <div className="flex flex-col gap-1">
              <div className="font-bold text-base">{displayName}</div>

              <div className="text-xs opacity-70">
                Seviye:{" "}
                <span style={{ color: accent.from, fontWeight: 700 }}>
                  {userLevel || "A1"}
                </span>
              </div>

              {roleLabel && (
                <div className="badge badge-primary badge-sm">
                  {roleLabel}
                </div>
              )}

              <div className="text-xs opacity-60">{user?.email}</div>
            </div>
          </li>

          <div className="divider my-1" />

          {/* ADMIN */}
          {isAdmin && (
            <>
              <li>
                <button
                  onClick={goToAdmin}
                  className="btn btn-sm btn-primary justify-start gap-2"
                >
                  <i className="ti ti-shield" />
                  Admin Paneli
                </button>
              </li>

              <div className="divider my-1" />
            </>
          )}

          {/* THEME */}
          <li>
            <button onClick={toggleTheme} className="flex justify-between">
              <span>
                <i className={`ti ${theme === "dark" ? "ti-sun" : "ti-moon"} mr-2`} />
                Tema Değiştir
              </span>
              <span className="badge">
                {theme === "dark" ? "🌙" : "☀️"}
              </span>
            </button>
          </li>

          {/* STATS */}
          <li>
            <button
              onClick={goToStats}
              className={isActive("stats") ? "active bg-primary text-white" : ""}
            >
              <i className="ti ti-chart-line mr-2" />
              Öğrendiğim Kelimeler
            </button>
          </li>

          {/* PROFILE */}
          <li>
            <button>
              <i className="ti ti-user mr-2" />
              Profil
            </button>
          </li>

          {/* SETTINGS */}
          <li>
            <button>
              <i className="ti ti-settings mr-2" />
              Ayarlar
            </button>
          </li>

          <div className="divider my-1" />

          {/* LOGOUT */}
          <li>
            <button
              onClick={handleLogout}
              className="text-error hover:bg-error hover:text-white"
            >
              <i className="ti ti-logout mr-2" />
              Çıkış Yap
            </button>
          </li>

          {/* FOOTER */}
          <div className="text-xs opacity-50 text-center mt-2">
            v2.1.0 • Lingora
          </div>
        </ul>
      )}
    </div>
  );
}