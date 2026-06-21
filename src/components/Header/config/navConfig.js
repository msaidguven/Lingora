// src/components/Header/config/navConfig.js
// Üst navigasyon barındaki sabit menü öğeleri.
// Yeni bir sekme eklemek/çıkarmak için sadece burayı düzenlemen yeterli,
// Header.jsx veya diğer component'lere dokunmana gerek yok.

export const NAV_ITEMS = [
  { key: "home",      icon: "ti-home",             label: "ANASAYFA"   },
  { key: "dashboard", icon: "ti-layout-dashboard",  label: "İSTATİSTİK" },
  { key: "quiz",      icon: "ti-tournament",        label: "QUIZ"       },
];

// Quiz sekmesi aktifken quizType'a göre ikon/label değişimi
export const QUIZ_VARIANTS = {
  word:     { icon: "ti-book",       label: "KELİME" },
  sentence: { icon: "ti-message",    label: "CÜMLE"  },
  default:  { icon: "ti-tournament", label: "QUIZ"   },
};

export const LEVEL_COLOR = {
  A1: { from: "#10b981", to: "#059669" },
  A2: { from: "#3b82f6", to: "#2563eb" },
  B1: { from: "#a855f7", to: "#7c3aed" },
  B2: { from: "#f97316", to: "#ea580c" },
};

export const DEFAULT_ACCENT = { from: "#8b7cff", to: "#5b8cff" };
