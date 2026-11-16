// src/components/auth/ForgotPassword.jsx
// "Şifremi unuttum": e-postaya şifre sıfırlama bağlantısı gönderir (Supabase → Resend,
// gönderen noreply@derstakip.net). Bağlantı web'deki /sifre-yenile sayfasını açar
// (ResetPassword.jsx); e-posta şablonu Supabase'de, token_hash ile çalışır.
import React, { useState } from 'react';
import { supabase } from '../../config';
import { AuthLayout } from './AuthLayout';
import '../../styles/auth.css';

const RESET_PAGE = 'https://lingoraapp.web.app/sifre-yenile';

export const ForgotPassword = ({ onBack, defaultEmail = '' }) => {
  const [email, setEmail] = useState(defaultEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: RESET_PAGE });
    setLoading(false);
    if (error) {
      setError(
        /rate limit|too many/i.test(error.message)
          ? 'Çok fazla deneme yapıldı. Birkaç dakika sonra tekrar dene.'
          : 'E-posta gönderilemedi. Adresi kontrol edip tekrar dene.'
      );
      return;
    }
    // Hesap var mı yok mu belli etmemek için her durumda aynı mesaj.
    setSent(true);
  };

  return (
    <AuthLayout title="Şifremi unuttum" subtitle="E-posta adresine şifre sıfırlama bağlantısı gönderelim">
      {sent ? (
        <div className="auth-form">
          <p style={{ fontSize: 14, lineHeight: 1.6 }}>
            ✉️ Bu adrese kayıtlı bir hesap varsa şifre sıfırlama bağlantısı gönderdik. Gelen
            kutunu (ve gereksiz klasörünü) kontrol et. Bağlantı 1 saat geçerlidir.
          </p>
          <button type="button" className="auth-button primary" onClick={onBack}>
            Girişe dön
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}
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
          <button type="submit" className="auth-button primary" disabled={loading}>
            {loading ? 'Gönderiliyor...' : 'Sıfırlama bağlantısı gönder'}
          </button>
          <div className="auth-footer">
            <button type="button" onClick={onBack} className="auth-switch">
              ← Girişe dön
            </button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
};
