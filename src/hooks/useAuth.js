import { useAuth } from '../contexts/AuthContext';

export const useAuth = () => {
  const context = useAuth();
  return context;
};