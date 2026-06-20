import { useTheme } from '../contexts/ThemeContext';

export const useTheme = () => {
  const context = useTheme();
  return context;
};