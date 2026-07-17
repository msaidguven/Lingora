// src/components/Header/hooks/useHeaderViewModel.js
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../../contexts/AuthContext.jsx";
import { useTheme } from "../../../contexts/ThemeContext.jsx";
import { supabase } from "../../../config.js";
import { NAV_ITEMS, QUIZ_VARIANTS, LEVEL_COLOR, DEFAULT_ACCENT } from "../config/navConfig.js";
import { getUserDisplayName, getUserRole } from "../services/headerUserService.js";

export function useHeaderViewModel(props) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userLevel, setUserLevel] = useState("A1");
  const menuRef = useRef(null);

  // Props'tan gelen değerler
  const currentScreen = props.currentScreen || "home";
  const onNavigate = props.onNavigate || (() => { });
  const quizVariant = props.quizVariant || "default";

  // Kullanıcı bilgileri
  const displayName = getUserDisplayName(user);
  const roleLabel = getUserRole(user);
  const isAdmin = user?.role === "admin";

  // Seviye rengi
  const levelColors = LEVEL_COLOR[userLevel] || LEVEL_COLOR["A1"];
  const accent = { from: levelColors.from, to: levelColors.to };

  // Aktif mi kontrolü
  const isActive = (key) => currentScreen === key;

  // Navigasyon fonksiyonu
  const handleNavigate = (key) => {
    setMenuOpen(false);
    onNavigate(key);
  };

  // İstatistik sayfasına git
  const goToStats = () => {
    setMenuOpen(false);
    onNavigate("statsScreen"); // ✅ EKLENDİ
  };

  // Admin sayfasına git
  const goToAdmin = () => {
    setMenuOpen(false);
    onNavigate("admin");
  };

  // Çıkış yap
  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
  };

  // Kullanıcı seviyesini getir
  useEffect(() => {
    if (user?.id) {
      supabase
        .from("en_users")
        .select("level")
        .eq("id", user.id)
        .single()
        .then(({ data, error }) => {
          if (!error && data?.level) {
            setUserLevel(data.level);
          }
        });
    }
  }, [user]);

  // Dışarı tıklama ile menü kapatma
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef]);

  return {
    user,
    menuOpen,
    setMenuOpen,
    menuRef,
    displayName,
    userLevel,
    roleLabel,
    isAdmin,
    theme,
    toggleTheme,
    currentScreen,
    onNavigate: handleNavigate,
    isActive,
    accent,
    quizVariant,
    goToStats, // ✅ EKLENDİ
    goToAdmin,
    handleLogout,
  };
}