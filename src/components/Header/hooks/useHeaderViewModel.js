// src/components/Header/hooks/useHeaderViewModel.js
// Header'ın tüm state'i ve iş mantığı burada yaşar.
// Header.jsx (View) bu hook'un döndürdüğü değerleri sadece ekrana basar;
// "nasıl çalışıyor" sorusunun cevabını bilmesi gerekmez.

import { useState, useEffect, useRef } from "react";
import { supabase } from "../../../config.js";
import { useAuth } from "../../../contexts/AuthContext";
import { useTheme } from "../../../contexts/ThemeContext";
import { fetchHeaderUserData } from "../services/headerUserService";
import { LEVEL_COLOR, DEFAULT_ACCENT, QUIZ_VARIANTS } from "../config/navConfig";
import { hasAdminAccess, getRoleLabel } from "../config/roleConfig";

export function useHeaderViewModel({
  currentScreen,
  onNavigate,
  userLevel,
  userRole = "user",
  quizType = null,
  onLogout,
  onNavigateToAdmin,
}) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Kullanıcı verisini çek (username, streak_days)
  useEffect(() => {
    let active = true;
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchHeaderUserData(supabase, user).then((data) => {
      if (active) {
        setUserData(data);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [user]);

  // Dropdown menü dışına tıklayınca kapat
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const accent = LEVEL_COLOR[userLevel] || DEFAULT_ACCENT;
  const isActive = (key) => currentScreen === key;
  const quizVariant = QUIZ_VARIANTS[quizType] || QUIZ_VARIANTS.default;

  const displayName =
    userData?.username ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Öğrenci";

  const isAdmin = hasAdminAccess(userRole);
  const roleLabel = getRoleLabel(userRole);

  const goToStats = () => {
    onNavigate("dashboard");
    setMenuOpen(false);
  };

  const goToAdmin = () => {
    setMenuOpen(false);
    if (onNavigateToAdmin) {
      onNavigateToAdmin();
    } else {
      window.location.href = "/admin";
    }
  };

  const handleLogout = async () => {
    setMenuOpen(false);
    if (!window.confirm("Çıkış yapmak istediğinize emin misiniz?")) return;
    const result = await logout();
    if (result.success) {
      onLogout?.();
    } else {
      alert("Çıkış yapılırken bir hata oluştu!");
    }
  };

  return {
    // veri
    user,
    theme,
    toggleTheme,
    loading,
    accent,
    isActive,
    quizVariant,
    displayName,
    isAdmin,
    roleLabel,
    userLevel,
    streakDays: userData?.streak_days || 0,
    // menü state
    menuOpen,
    setMenuOpen,
    menuRef,
    // navigasyon
    currentScreen,
    onNavigate,
    // aksiyonlar
    goToStats,
    goToAdmin,
    handleLogout,
  };
}
