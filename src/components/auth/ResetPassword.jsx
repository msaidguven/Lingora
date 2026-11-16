// src/components/auth/ResetPassword.jsx
// E-postadaki bağlantının açtığı sayfa: /sifre-yenile?token_hash=...&type=recovery
// token_hash doğrulanınca geçici oturum açılır, kullanıcı yeni şifresini belirler.
// (token_hash yöntemi, sıfırlamanın istendiği cihazdan bağımsız çalışır.)
import React, { useEffect, useState } from 'react';
import { supabase } from '../../config';
import { AuthLayout } from './AuthLayout';
import '../../styles/auth.css';

export const isResetPasswordPage = () =>
  typeof window !== 'undefined' && window.location.pathname.replace(/\/$/, '') === '/sifre-yenile';

export const ResetPassword = ({ onDone }) => {
  const [stage, setStage] = useState('verifying'); // verifying | form | invalid | done
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenHash = params.get('token_hash');
    if (!tokenHash) {
      setStage('invalid');
      return;
    }
    supabase.auth
      .verifyOtp({ token_hash: tokenHash, type: 'recovery' })
      .then(({ error }) => setStage(error ? 'invalid' : 'form'));
  }, []);

  const finish = () => {
    window.history.replaceState(null, '', '/');
    onDone?.();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) return setError('Şifre en az 6 karakter olmalı.');
    if (password !== password2) return setError('Şifreler aynı değil.');
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(/different from the old/i.test(error.message)
        ? 'Yeni şifre eski şifrenle aynı olamaz.'
        : 'Şifre güncellenemedi. Tekrar dene.');
      return;
    }
    setStage('done');
  };

  if (stage === 'verifying') {
    return <AuthLayout title="Yeni şifre" subtitle="Bağlantı kontrol ediliyor..." />;
  }

  if (stage === 'invalid') {
    return (
      <AuthLayout title="Bağlantı geçersiz" subtitle="Bu bağlantının süresi dolmuş ya da daha önce kullanılmış">
        <div className="auth-form">
          <p style={{ fontSize: 14, lineHeight: 1.6 }}>
            Giriş ekranındaki <b>Şifremi unuttum</b> ile yeni bir bağlantı isteyebilirsin.
          </p>
          <button type="button" className="auth-button primary" onClick={finish}>Girişe dön</button>
        </div>
      </AuthLayout>
    );
  }

  if (stage === 'done') {
    return (
      <AuthLayout title="Şifren güncellendi" subtitle="Artık yeni şifrenle giriş yapabilirsin">
        <div className="auth-form">
          <p style={{ fontSize: 14, lineHeight: 1.6 }}>
            ✅ Mobil uygulamada da yeni şifrenle giriş yapabilirsin.
          </p>
          <button type="button" className="auth-button primary" onClick={finish}>Lingora'ya devam et</button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Yeni şifre belirle" subtitle="Hesabın için yeni bir şifre seç">
      <form onSubmit={handleSubmit} className="auth-form">
        {error && <div className="auth-error">{error}</div>}
        <div className="form-group">
          <label>Yeni şifre</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="En az 6 karakter" required disabled={loading} autoComplete="new-password" />
        </div>
        <div className="form-group">
          <label>Yeni şifre (tekrar)</label>
          <input type="password" value={password2} onChange={(e) => setPassword2(e.target.value)}
            placeholder="••••••••" required disabled={loading} autoComplete="new-password" />
        </div>
        <button type="submit" className="auth-button primary" disabled={loading}>
          {loading ? 'Kaydediliyor...' : 'Şifreyi kaydet'}
        </button>
      </form>
    </AuthLayout>
  );
};
