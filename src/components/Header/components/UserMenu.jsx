// src/components/Header/components/UserMenu.jsx
import { useState } from "react";
import ThemeToggle from "../../common/ThemeToggle.jsx";

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
  goToStats,    // ✅ EKLENDİ
  goToAdmin,
  handleLogout,
}) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      {/* Profil Avatar Butonu */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary transition-all hover:bg-primary/20 hover:scale-105 active:scale-95"
      >
        {displayName?.[0]?.toUpperCase() || "👤"}
      </button>

      {/* Dropdown Menü */}
      {menuOpen && (
        <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-2xl border border-base-300 bg-base-100/95 shadow-2xl backdrop-blur-xl animate-in slide-in-from-top-2 duration-200">
          {/* Kullanıcı Bilgileri */}
          <div className="border-b border-base-300 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-bold text-primary">
                {displayName?.[0]?.toUpperCase() || "👤"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-base-content">
                  {displayName}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-base-content/50">{roleLabel}</span>
                  {userLevel && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                      {userLevel}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Menü Öğeleri */}
          <div className="p-1.5">
            {/* ✅ İSTATİSTİK BUTONU EKLENDİ */}
            <button
              onClick={goToStats}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-base-content/70 transition-all hover:bg-base-200 hover:text-base-content"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Detaylı İstatistikler
            </button>

            {/* Tema Değiştir */}
            <div className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-base-content/70">
              <span>Tema</span>
              <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
            </div>

            {/* Admin Panel (Sadece adminler için) */}
            {isAdmin && (
              <button
                onClick={goToAdmin}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-amber-600 transition-all hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/20"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Admin Panel
              </button>
            )}

            {/* Çıkış Yap */}
            {!showLogoutConfirm ? (
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 transition-all hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Çıkış Yap
              </button>
            ) : (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 p-2 dark:bg-red-950/20">
                <span className="text-xs text-red-600 dark:text-red-400">Emin misin?</span>
                <button
                  onClick={handleLogout}
                  className="rounded-lg bg-red-500 px-3 py-1 text-xs font-medium text-white transition-all hover:bg-red-600"
                >
                  Evet
                </button>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="rounded-lg px-3 py-1 text-xs font-medium text-base-content/50 transition-all hover:bg-base-200"
                >
                  Hayır
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}