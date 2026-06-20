// src/components/auth/Register.jsx
import React, { useState } from 'react';
import { AuthLayout } from './AuthLayout';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/auth.css';

export const Register = ({ onRegisterSuccess, onSwitchToLogin }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register, login } = useAuth(); // login'i de ekleyin

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor!');
      return;
    }

    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalı!');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Önce kayıt ol
      const registerResult = await register(email, password, fullName);
      
      if (!registerResult.success) {
        setError(registerResult.error || 'Kayıt başarısız!');
        setLoading(false);
        return;
      }

      // 2. Kayıt başarılı, otomatik giriş yap
      const loginResult = await login(email, password);
      
      if (loginResult.success) {
        // 3. Giriş başarılı, ana sayfaya yönlendir
        onRegisterSuccess?.();
      } else {
        // Giriş başarısız ama kayıt başarılı
        setError('Kayıt başarılı! Lütfen giriş yapın.');
        onSwitchToLogin();
      }
    } catch (error) {
      setError('Bir hata oluştu! Lütfen tekrar deneyin.');
    }

    setLoading(false);
  };

  return (
    <AuthLayout 
      title="Hesap Oluştur" 
      subtitle="Lingora'ya katıl ve dil öğrenmeye başla"
    >
      <form onSubmit={handleSubmit} className="auth-form">
        {error && <div className="auth-error">{error}</div>}
        
        <div className="form-group">
          <label>Ad Soyad</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ahmet Yılmaz"
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>E-posta</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ornek@email.com"
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Şifre</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={loading}
          />
          <small>En az 6 karakter</small>
        </div>

        <div className="form-group">
          <label>Şifre Tekrar</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={loading}
          />
        </div>

        <button 
          type="submit" 
          className="auth-button primary"
          disabled={loading}
        >
          {loading ? 'Kaydediliyor...' : 'Kayıt Ol'}
        </button>

        <div className="auth-footer">
          <span>Zaten hesabınız var mı?</span>
          <button 
            type="button" 
            onClick={onSwitchToLogin}
            className="auth-switch"
          >
            Giriş Yap
          </button>
        </div>
      </form>
    </AuthLayout>
  );
};