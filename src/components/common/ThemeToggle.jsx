import React from 'react';
import { useTheme } from '../../hooks/useTheme';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label="Tema değiştir"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
};