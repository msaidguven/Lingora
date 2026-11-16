// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { supabase } from '../config';

// Mobilde Google girişi Chrome sekmesinde açılır, bitince bu adresle uygulamaya döner
// (AndroidManifest'teki intent-filter; Supabase'in izinli yönlendirmelerinde de kayıtlı).
const NATIVE_AUTH_CALLBACK = 'com.lingora.language://auth-callback';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ============ KULLANICI ROLÜNÜ GETİR ============
  const fetchUserRole = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("en_users")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("❌ Rol çekme hatası:", error);
        return null;
      }
      return data?.role || 'user';
    } catch (error) {
      console.error("❌ Rol hatası:", error);
      return null;
    }
  };

  // ============ PROFİL YOKSA OLUŞTUR ============
  // E-postayla kayıtta profil register() içinde açılır; Google ile ilk girişte açılmamıştır.
  const ensureProfile = async (authUser) => {
    const { data } = await supabase
      .from("en_users")
      .select("id")
      .eq("id", authUser.id)
      .maybeSingle();
    if (data) return;
    const meta = authUser.user_metadata || {};
    const { error } = await supabase.from("en_users").upsert([{
      id: authUser.id,
      email: authUser.email,
      level: "A1",
      username: meta.full_name || meta.name || authUser.email?.split('@')[0] || 'Öğrenci',
      role: 'user',
      streak_days: 0,
      created_at: new Date().toISOString(),
    }], { onConflict: 'id', ignoreDuplicates: true });
    if (error) console.error("❌ Profil oluşturulamadı:", error);
  };

  // ============ USER'ı ROLE İLE ZENGİNLEŞTİR ============
  const enrichUserWithRole = async (authUser) => {
    if (!authUser) return null;

    await ensureProfile(authUser).catch((e) => console.error("❌ Profil kontrolü:", e));
    const role = await fetchUserRole(authUser.id);
    return {
      ...authUser,
      role: role || 'user'
    };
  };

  useEffect(() => {
    let active = true;

    // Oturumu role ile zenginleştirir; hata olsa bile loading kapanır.
    const applySession = async (nextSession) => {
      try {
        const enriched = nextSession?.user
          ? await enrichUserWithRole(nextSession.user)
          : null;
        if (active) setUser(enriched);
      } catch (err) {
        console.error("❌ Oturum yükleme hatası:", err);
        if (active) setUser(nextSession?.user ? { ...nextSession.user, role: 'user' } : null);
      } finally {
        if (active) setLoading(false);
      }
    };

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (!active) return;
        setSession(session);
        return applySession(session);
      })
      .catch((err) => {
        console.error("❌ getSession hatası:", err);
        if (active) setLoading(false);
      });

    // ÖNEMLİ: callback içinde supabase çağrısı await EDİLMEMELİ (auth kilidi
    // kilitlenir, uygulama sonsuz yüklemede kalır). İşi sonraya erteliyoruz.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setTimeout(() => applySession(session), 0);
      }
    );

    // Mobil: Google girişinden uygulamaya dönüş. ?code= oturuma çevrilir; oturum
    // değişikliği yukarıdaki onAuthStateChange ile ekrana yansır.
    let urlListener;
    if (Capacitor.isNativePlatform()) {
      CapApp.addListener('appUrlOpen', async ({ url }) => {
        if (!url?.startsWith(NATIVE_AUTH_CALLBACK)) return;
        Browser.close().catch(() => {});
        const params = new URL(url).searchParams;
        const code = params.get('code');
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error("❌ Google girişi tamamlanamadı:", error);
            setError(error.message);
          }
        } else if (params.get('error')) {
          setError(params.get('error_description') || params.get('error'));
        }
      }).then((l) => { urlListener = l; });
    }

    return () => {
      active = false;
      subscription.unsubscribe();
      urlListener?.remove();
    };
  }, []);

  // ============ LOGIN ============
  const login = async (email, password) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      
      // User'ı role ile zenginleştir
      if (data?.user) {
        const enrichedUser = await enrichUserWithRole(data.user);
        setUser(enrichedUser);
        data.user = enrichedUser;
      }
      
      return { success: true, data };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  // ============ REGISTER ============
  const register = async (email, password, fullName) => {
    try {
      setError(null);
      
      console.log("📝 Kayıt başlatılıyor...", { email, fullName });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      
      if (error) throw error;
      
      console.log("👤 Kullanıcı oluşturuldu:", data.user?.id);
      
      if (data.user) {
        // en_users'a ekle - role varsayılan 'user'
        const { error: insertError } = await supabase
          .from("en_users")
          .upsert([{ 
            id: data.user.id,
            email: data.user.email,
            level: "A1",
            username: fullName || data.user.email?.split('@')[0] || 'Öğrenci',
            role: 'user', // Varsayılan rol
            streak_days: 0,
            created_at: new Date().toISOString()
          }], { 
            onConflict: 'id',
            ignoreDuplicates: true 
          });
        
        if (insertError && insertError.code !== '23505') {
          console.error("❌ en_users'a ekleme hatası:", insertError);
        } else {
          console.log("✅ Kullanıcı en_users tablosuna eklendi!");
        }

        // Günlük limit oluştur
        console.log("📝 Günlük limit oluşturuluyor...");
        
        const { error: dailyError } = await supabase
          .from("en_user_daily_limit")
          .upsert([{
            user_id: data.user.id,
            remaining_today: 5,
            last_reset_date: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString()
          }], { 
            onConflict: 'user_id',
            ignoreDuplicates: true 
          });
        
        if (dailyError) {
          console.error("❌ Günlük limit oluşturma hatası:", dailyError);
        } else {
          console.log("✅ Günlük limit oluşturuldu!");
        }

        // User'ı role ile zenginleştir
        const enrichedUser = await enrichUserWithRole(data.user);
        setUser(enrichedUser);
        data.user = enrichedUser;

        // Otomatik giriş dene
        try {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (!signInError) {
            console.log("✅ Otomatik giriş başarılı!");
          }
        } catch (signInError) {
          console.log("📝 Otomatik giriş yapılamadı");
        }
      }
      
      return { success: true, data, user: data.user };
    } catch (error) {
      console.error("❌ Register hatası:", error);
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  // ============ LOGOUT ============
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setSession(null);
      return { success: true };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  // ============ İLERLEMEYİ SIFIRLA (hesap kalır) ============
  const resetProgress = async () => {
    const { error } = await supabase.rpc("reset_my_progress");
    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  // ============ HESABI KALICI OLARAK SİL ============
  const deleteAccount = async () => {
    const { error } = await supabase.rpc("delete_my_account");
    if (error) return { success: false, error: error.message };
    // Sunucuda kullanıcı artık yok; yerel oturumu da temizle.
    await supabase.auth.signOut({ scope: "local" }).catch(() => {});
    setUser(null);
    setSession(null);
    return { success: true };
  };

  // ============ GOOGLE LOGIN ============
  // Web: Google sayfasına yönlendirir, dönüşte oturum adresteki koddan otomatik açılır.
  // Mobil: Google'ın uygulama içi web görünümünü engellemesi yüzünden giriş Chrome
  // sekmesinde açılır; dönüş appUrlOpen dinleyicisinde tamamlanır (yukarıda).
  // Her iki durumda da sonuç "redirecting": giriş, oturum değişince ekrana yansır.
  const loginWithGoogle = async () => {
    try {
      setError(null);
      const native = Capacitor.isNativePlatform();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: native ? NATIVE_AUTH_CALLBACK : window.location.origin,
          skipBrowserRedirect: native,
          // Her seferinde hesap seçme ekranı çıksın (tek hesapla otomatik girmesin).
          queryParams: { prompt: 'select_account' },
        },
      });
      if (error) throw error;
      if (native) await Browser.open({ url: data.url });
      return { success: true, redirecting: true, data };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  // ============ FACEBOOK LOGIN ============
  const loginWithFacebook = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  // ============ KULLANICI VERİLERİNİ GETİR ============
  const fetchUserData = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("en_users")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("❌ Kullanıcı verisi çekme hatası:", error);
        return null;
      }
      return data;
    } catch (error) {
      console.error("❌ Kullanıcı verisi hatası:", error);
      return null;
    }
  };

  // ============ KULLANICI SEVİYESİNİ GÜNCELLE ============
  const updateUserLevel = async (userId, level) => {
    try {
      const { data, error } = await supabase
        .from("en_users")
        .update({ level })
        .eq("id", userId);

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error("❌ Seviye güncelleme hatası:", error);
      return { success: false, error: error.message };
    }
  };

  // ============ GÜNLÜK LİMİTİ KONTROL ET ============
  const checkDailyLimit = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("en_user_daily_limit")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("❌ Günlük limit kontrol hatası:", error);
        return null;
      }
      return data;
    } catch (error) {
      console.error("❌ Günlük limit hatası:", error);
      return null;
    }
  };

  // ============ GÜNLÜK LİMİTİ GÜNCELLE ============
  const updateDailyLimit = async (userId, remaining) => {
    try {
      const { data, error } = await supabase
        .from("en_user_daily_limit")
        .update({ 
          remaining_today: remaining,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", userId);

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error("❌ Günlük limit güncelleme hatası:", error);
      return { success: false, error: error.message };
    }
  };

  // ============ VALUE ============
  const value = {
    user,
    session,
    loading,
    error,
    login,
    register,
    logout,
    resetProgress,
    deleteAccount,
    loginWithGoogle,
    loginWithFacebook,
    fetchUserData,
    updateUserLevel,
    checkDailyLimit,
    updateDailyLimit,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ============ USE AUTH HOOK ============
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};