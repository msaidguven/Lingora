
export default function UserMenu({
  menuOpen,
  setMenuOpen,
  menuRef,
  displayName,
  user,
  userLevel,
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
    <div className="relative flex shrink-0 items-center gap-2" ref={menuRef}>
      {/* COIN GÖSTERİMİ */}
      <button
        className="flex h-9 items-center gap-2 rounded-xl border border-base-300 bg-base-200 px-2 text-base-content/70 transition-colors hover:bg-base-300 hover:text-base-content"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Ayarları Aç"
      >
        <i className="ti ti-user-circle text-[22px]" />
        <span className="max-w-[70px] truncate font-display text-[11px] font-bold tracking-wide opacity-85">
          {displayName}
        </span>
        <i
          className={`ti ${menuOpen ? "ti-chevron-up" : "ti-chevron-down"} text-xs opacity-60 transition-transform`}
        />
      </button>

      {menuOpen && (
        <div className="animate-fade-up absolute right-0 top-[calc(100%+12px)] z-[9999] w-64 origin-top-right rounded-2xl border border-base-300 bg-base-200/98 p-2 shadow-2xl backdrop-blur-xl">
          {/* Kullanıcı bilgisi */}
          <div className="flex items-center gap-3 rounded-2xl bg-primary/5 px-3 py-2.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-base-300 bg-gradient-to-br from-primary/25 to-secondary/25">
              <i className="ti ti-user-circle text-2xl text-base-content/70" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-sm font-bold">{displayName}</div>
              <div className="text-[11px] text-base-content/55">
                Seviye: <span className="font-bold text-primary">{userLevel || "A1"}</span>
              </div>
              {roleLabel && (
                <span className="mt-0.5 inline-block rounded bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  {roleLabel}
                </span>
              )}
              <div className="truncate text-[10px] text-base-content/30">{user?.email}</div>
            </div>
          </div>

          <div className="my-1 h-px bg-base-300" />

          {/* Admin Linki - SADECE YETKİLİ KULLANICILAR GÖRÜR */}
          {isAdmin && (
            <>
              <button
                className="flex w-full items-center gap-3 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/15 to-accent/15 px-3 py-2.5 text-left text-[13px] transition-transform hover:translate-x-1"
                onClick={goToAdmin}
              >
                <i className="ti ti-shield text-accent" />
                <span className="font-bold">Admin Paneli</span>
                <span className="ml-auto rounded-lg bg-gradient-to-br from-accent to-primary px-2.5 py-0.5 text-[10px] font-bold text-white">
                  {roleLabel}
                </span>
              </button>
              <div className="my-1 h-px bg-base-300" />
            </>
          )}

          {/* Tema Değiştir - daisyUI Theme Controller ile */}
          <div className="flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors hover:bg-base-300">
            <div className="flex items-center gap-3">
              <i className={`ti ${theme === "dark" ? "ti-moon" : "ti-sun"} w-5 text-center opacity-70`} />
              <span className="text-[13px] font-semibold">
                {theme === "dark" ? "Koyu Tema" : "Açık Tema"}
              </span>
            </div>
            
            {/* daisyUI Theme Controller Toggle */}
            <label className="flex cursor-pointer gap-2 items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-60"
              >
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
              </svg>
              <input 
                type="checkbox" 
                className="toggle toggle-sm theme-controller" 
                checked={theme === "dark"}
                onChange={toggleTheme}
                aria-label="Tema değiştir"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-60"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            </label>
          </div>

          <div className="my-1 h-px bg-base-300" />

          {/* İstatistikler */}
          <button
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold transition-transform hover:translate-x-1 ${
              isActive("stats")
                ? "bg-gradient-to-br from-primary to-secondary text-white"
                : "hover:bg-base-300"
            }`}
            onClick={goToStats}
          >
            <i className="ti ti-chart-line w-5 text-center opacity-70" />
            <span>Öğrendiğim Kelimeler</span>
            {isActive("stats") && (
              <span className="ml-auto rounded-lg bg-white/20 px-2.5 py-0.5 text-[10px] font-bold">
                Aktif
              </span>
            )}
          </button>

          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold transition-transform hover:translate-x-1 hover:bg-base-300">
            <i className="ti ti-user w-5 text-center opacity-70" />
            <span>Profil</span>
            <i className="ti ti-chevron-right ml-auto text-sm opacity-40" />
          </button>

          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold transition-transform hover:translate-x-1 hover:bg-base-300">
            <i className="ti ti-settings w-5 text-center opacity-70" />
            <span>Ayarlar</span>
            <i className="ti ti-chevron-right ml-auto text-sm opacity-40" />
          </button>

          <div className="my-1 h-px bg-base-300" />

          {/* Çıkış Yap */}
          <button
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold text-error transition-transform hover:translate-x-1 hover:bg-error/10"
            onClick={handleLogout}
          >
            <i className="ti ti-logout w-5 text-center" />
            <span>Çıkış Yap</span>
          </button>

          <div className="flex justify-center gap-2 px-2 pb-1 pt-2">
            <span className="text-[9px] font-medium tracking-wide text-base-content/30">
              v2.1.0
            </span>
            <span className="text-[9px] text-base-content/30">•</span>
            <span className="text-[9px] font-medium tracking-wide text-base-content/30">
              Lingora
            </span>
          </div>
        </div>
      )}
    </div>
  );
}