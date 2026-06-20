// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../config';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
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
      
      // 1. Supabase'de kullanıcı oluştur
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
        // 2. en_users'a ekle
        const { error: insertError } = await supabase
          .from("en_users")
          .upsert([{ 
            id: data.user.id,
            email: data.user.email,
            level: "A1",
            username: fullName || data.user.email?.split('@')[0] || 'Öğrenci',
            streak_days: 0,
            created_at: new Date().toISOString()
          }], { onConflict: 'id' });
        
        if (insertError) {
          console.error("❌ en_users'a ekleme hatası:", insertError);
        } else {
          console.log("✅ Kullanıcı en_users tablosuna eklendi!");
        }

        // 3. Günlük limit oluştur - SÜTUN ADLARI TABLO İLE EŞLEŞTİRİLDİ ✅
        console.log("📝 Günlük limit oluşturuluyor...");
        
        const { data: dailyData, error: dailyError } = await supabase
          .from("en_user_daily_limit")
          .upsert([{
            user_id: data.user.id,
            remaining_today: 5,
            last_reset_date: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString()
          }], { onConflict: 'user_id' })
          .select();
        
        if (dailyError) {
          console.error("❌ Günlük limit oluşturma hatası:", dailyError);
          console.error("❌ Hata kodu:", dailyError.code);
          console.error("❌ Hata mesajı:", dailyError.message);
        } else {
          console.log("✅ Günlük limit oluşturuldu!", dailyData);
        }

        // 4. Otomatik giriş dene
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
      return { success: true };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  // ============ GOOGLE LOGIN ============
  const loginWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
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