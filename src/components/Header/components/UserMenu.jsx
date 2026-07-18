// src/components/Header/components/UserMenu.jsx
import { DOGEAR } from "../../../theme/notebook";

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
  streakDays = 0,
}) {
  return (
    <div className="relative flex shrink-0 items-center gap-2" ref={menuRef}>
      {/* Tetikleyici buton — navy kapak üzerinde durduğu için sabit krem/beyaz tonlar */}
      <button
        className="flex h-9 items-center gap-2 rounded-md border border-dashed border-white/25 bg-white/5 px-2 text-[#F0E9D8]/85 transition-colors hover:bg-white/10"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Ayarları Aç"
      >
        <i className="ti ti-user-circle text-[20px]" />
        <span className="max-w-[70px] truncate font-mono text-[11px] font-bold tracking-wide">
          {displayName}
        </span>
        <i
          className={`ti ${menuOpen ? "ti-chevron-up" : "ti-chevron-down"} text-xs opacity-70 transition-transform`}
        />
      </button>

      {menuOpen && (
        <div
          className={`animate-fade-up absolute right-0 top-[calc(100%+12px)] z-[9999] w-64 origin-top-right rounded-md border border-[var(--lg-border)] bg-[var(--lg-card)] p-2 shadow-2xl ${DOGEAR}`}
        >
          {/* Kullanıcı kartı — öğrenci kimlik damgası gibi */}
          <div className="flex items-center gap-3 rounded-md border border-dashed border-[var(--lg-border)] px-3 py-2.5">
            <div className="flex h-11 w-11 shrink-0 -rotate-3 items-center justify-center rounded-full border-2 border-dashed border-[var(--lg-red)] bg-[var(--lg-bg)]">
              <i className="ti ti-user-circle text-2xl text-[var(--lg-red)]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-serif text-sm font-bold text-[var(--lg-ink)]">
                {displayName}
              </div>
              <div className="text-[11px] text-[var(--lg-ink-muted)]">
                Seviye:{" "}
                <span className="font-mono font-bold text-[var(--lg-red)]">
                  {userLevel || "A1"}
                </span>
                {streakDays > 0 && (
                  <span className="ml-2 font-mono text-[10.5px] text-[var(--lg-gold)]">
                    🔥 {streakDays} gün
                  </span>
                )}
              </div>
              {roleLabel && (
                <span className="mt-1 inline-block rounded-full border border-dashed border-[var(--lg-red)]/60 px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-wide text-[var(--lg-red)]">
                  {roleLabel}
                </span>
              )}
              <div className="mt-0.5 truncate font-mono text-[9.5px] text-[var(--lg-ink-muted)]">
                {user?.email}
              </div>
            </div>
          </div>

          <div className="my-1.5 border-t border-dashed border-[var(--lg-border)]" />

          {/* Admin Linki - SADECE YETKİLİ KULLANICILAR GÖRÜR */}
          {isAdmin && (
            <>
              <button
                className="flex w-full items-center gap-3 rounded-md border border-dashed border-[var(--lg-gold)]/60 bg-[var(--lg-gold)]/10 px-3 py-2.5 text-left text-[13px] transition-transform hover:translate-x-1"
                onClick={goToAdmin}
              >
                <i className="ti ti-shield text-[var(--lg-gold)]" />
                <span className="font-serif font-bold text-[var(--lg-ink)]">Admin Paneli</span>
                <span className="ml-auto rounded-full border border-dashed border-[var(--lg-gold)] px-2 py-0.5 font-mono text-[9px] font-bold text-[var(--lg-gold)]">
                  {roleLabel}
                </span>
              </button>
              <div className="my-1.5 border-t border-dashed border-[var(--lg-border)]" />
            </>
          )}

          {/* Tema Değiştir - daisyUI Theme Controller ile */}
          <div className="flex items-center justify-between rounded-md px-3 py-2.5 transition-colors hover:bg-[var(--lg-border)]">
            <div className="flex items-center gap-3">
              <i
                className={`ti ${theme === "dark" ? "ti-moon" : "ti-sun"} w-5 text-center text-[var(--lg-ink-muted)]`}
              />
              <span className="text-[13px] font-semibold text-[var(--lg-ink)]">
                {theme === "dark" ? "Koyu Tema" : "Açık Tema"}
              </span>
            </div>

            {/* daisyUI Theme Controller Toggle */}
            <label className="flex cursor-pointer items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[var(--lg-ink-muted)]"
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
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[var(--lg-ink-muted)]"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            </label>
          </div>

          <div className="my-1.5 border-t border-dashed border-[var(--lg-border)]" />

          {/* İstatistikler */}
          <button
            className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-[13px] font-semibold transition-transform hover:translate-x-1 ${isActive("stats")
                ? "border border-dashed border-[var(--lg-red)] text-[var(--lg-red)]"
                : "text-[var(--lg-ink)] hover:bg-[var(--lg-border)]"
              }`}
            onClick={goToStats}
          >
            <i className="ti ti-chart-line w-5 text-center opacity-70" />
            <span>Öğrendiğim Kelimeler</span>
            {isActive("stats") && (
              <span className="ml-auto rounded-full border border-dashed border-[var(--lg-red)] px-2 py-0.5 font-mono text-[9px] font-bold">
                Aktif
              </span>
            )}
          </button>

          <button className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-[13px] font-semibold text-[var(--lg-ink)] transition-transform hover:translate-x-1 hover:bg-[var(--lg-border)]">
            <i className="ti ti-user w-5 text-center opacity-70" />
            <span>Profil</span>
            <span className="ml-auto h-px max-w-6 flex-1 border-t border-dotted border-[var(--lg-border-strong)]" />
            <i className="ti ti-chevron-right text-sm opacity-40" />
          </button>

          <button className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-[13px] font-semibold text-[var(--lg-ink)] transition-transform hover:translate-x-1 hover:bg-[var(--lg-border)]">
            <i className="ti ti-settings w-5 text-center opacity-70" />
            <span>Ayarlar</span>
            <span className="ml-auto h-px max-w-6 flex-1 border-t border-dotted border-[var(--lg-border-strong)]" />
            <i className="ti ti-chevron-right text-sm opacity-40" />
          </button>

          <div className="my-1.5 border-t border-dashed border-[var(--lg-border)]" />

          {/* Çıkış Yap */}
          <button
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-[13px] font-semibold text-[var(--lg-red)] transition-transform hover:translate-x-1 hover:bg-[var(--lg-red)]/10"
            onClick={handleLogout}
          >
            <i className="ti ti-logout w-5 text-center" />
            <span>Çıkış Yap</span>
          </button>

          <div className="flex justify-center gap-2 px-2 pb-1 pt-2 font-mono text-[9px] tracking-wide text-[var(--lg-ink-muted)]">
            <span>v2.1.0</span>
            <span>•</span>
            <span>Lingora</span>
          </div>
        </div>
      )}
    </div>
  );
}