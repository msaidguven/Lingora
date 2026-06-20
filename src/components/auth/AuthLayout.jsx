import React from 'react';

import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

import '../../styles/auth.css';

export const AuthLayout = ({ children, title, subtitle }) => {
  const { theme } = useTheme();

  return (
    <div className={`auth-page ${theme}`}>
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-brand">
              <span className="brand-dot" />
              LINGORA
            </div>
            <h1 className="auth-title">{title}</h1>
            {subtitle && <p className="auth-subtitle">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};