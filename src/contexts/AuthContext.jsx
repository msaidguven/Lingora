import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../config';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Mevcut oturumu kontrol et
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Auth state değişikliklerini dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

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

  // src/contexts/AuthContext.jsx - register fonksiyonunu güncelleyin

const register = async (email, password, fullName) => {
  try {
    setError(null);
    
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
    
    // 2. Kullanıcı oluşturulduysa, en_users tablosuna da ekle
    if (data.user) {
      try {
        const { error: insertError } = await supabase
          .from("en_users")
          .insert([{ 
            id: data.user.id,
            email: data.user.email,
            level: "A1",
            username: fullName || data.user.email?.split('@')[0] || 'Öğrenci',
            streak_days: 0,
            created_at: new Date().toISOString()
          }]);
        
        if (insertError) {
          console.error("❌ en_users'a ekleme hatası:", insertError);
          // RLS hatası varsa ama kullanıcı oluştuysa devam et
          if (insertError.code === '42501') {
            console.warn("⚠️ RLS politikası nedeniyle en_users'a eklenemedi.");
            console.warn("📝 Lütfen Supabase'de RLS politikalarını yapılandırın.");
          }
        } else {
          console.log("✅ Kullanıcı en_users tablosuna eklendi!");
        }
      } catch (insertError) {
        console.error("❌ en_users insert hatası:", insertError);
      }
    }
    
    return { success: true, data, user: data.user };
  } catch (error) {
    setError(error.message);
    return { success: false, error: error.message };
  }
};

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

  // Google ile giriş
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

  // Facebook ile giriş
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};