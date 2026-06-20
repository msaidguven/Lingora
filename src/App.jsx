// App.jsx
import { useState, useEffect } from "react";
import { supabase } from "./config.js";
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Header from "./components/Header/Header.jsx";
import HomeScreen from "./HomeScreen/HomeScreen.jsx";
import WordQuiz from "./components/WordQuiz/WordQuiz.jsx";
import SentenceQuiz from "./components/SentenceQuiz/SentenceQuiz.jsx";
import StatsScreen from "./StatsScreen.jsx";
import DashboardScreen from "./components/Dashboard/DashboardScreen.jsx";
import QuizScreen from "./components/Quiz/QuizScreen.jsx";
import LessonPage from "./components/Lesson/LessonPage.jsx";
import Admin from "./Admin.jsx";
import { Login } from "./components/auth/Login.jsx";
import { Register } from "./components/auth/Register.jsx";
import './App.css';

// AppContent bileşeni - AuthProvider içinde çalışır
function AppContent() {
  const { user, loading: authLoading, logout } = useAuth();
  const [currentScreen, setCurrentScreen] = useState("home");
  const [userLevel, setUserLevel] = useState("A1");
  const [userRole, setUserRole] = useState("user");
  const [quizType, setQuizType] = useState(null);
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  // ============ KULLANICI SEVİYE VE ROLÜ ÇEK ============
  useEffect(() => {
    if (!user) {
      setShowLogin(true);
      setShowRegister(false);
      return;
    }
    
    const fetchUserLevel = async () => {
      try {
        // Önce kullanıcı var mı kontrol et - maybeSingle() ile
        const { data, error } = await supabase
          .from("en_users")
          .select("level, role")
          .eq("id", user.id)
          .maybeSingle();

        // Eğer gerçek bir hata varsa (kayıt bulunamadı hatası değilse)
        if (error && error.code !== 'PGRST116') {
          console.error("❌ Seviye çekme hatası:", error);
          return;
        }

        if (data) {
          // Kullanıcı zaten varsa seviyesini ve rolünü al
          setUserLevel(data.level);
          setUserRole(data.role || 'user');
          console.log("✅ Kullanıcı seviyesi:", data.level, "Rolü:", data.role);
          console.log("👑 DEBUG Admin Check - Role:", data.role, "Is Admin?", data.role === 'admin');
          return; // Fonksiyonu bitir
        }

        // Kullanıcı yoksa oluştur (Bu noktaya sadece yeni kullanıcılar gelir)
        console.log("📝 Yeni kullanıcı oluşturuluyor...");
        
        const { error: insertError } = await supabase
          .from("en_users")
          .insert([{ 
            id: user.id, 
            email: user.email,
            level: "A1",
            role: "user",
            username: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Öğrenci',
            streak_days: 0,
            created_at: new Date().toISOString()
          }]);

        if (insertError) {
          // 23505 = Unique violation (kullanıcı zaten var) - yoksay
          if (insertError.code === '23505') {
            console.log("📝 Kullanıcı zaten mevcut, seviye varsayılan olarak A1");
            setUserLevel("A1");
            setUserRole("user");
          } else {
            console.error("❌ Kullanıcı oluşturma hatası:", insertError);
          }
        } else {
          console.log("✅ Yeni kullanıcı oluşturuldu!");
          setUserLevel("A1");
          setUserRole("user");
        }
      } catch (error) {
        console.error("❌ Seviye işlemleri hatası:", error);
      }
    };

    fetchUserLevel();
    setShowLogin(false);
    setShowRegister(false);
  }, [user]);

  // ============ NAVIGASYON ============
  const handleNavigate = (screen, type = null) => {
    console.log("🔄 Navigasyon:", screen, type);
    
    if (screen === "quiz" && !type) {
      setQuizType(null);
    }
    
    if (type) {
      setQuizType(type);
    }
    setCurrentScreen(screen);
  };

  const handleGoToLesson = (lessonId) => {
    setSelectedLessonId(lessonId);
    setCurrentScreen("lesson");
    setQuizType(null);
  };

  const handleBackToHome = () => {
    console.log("🏠 Ana sayfaya dönülüyor");
    setCurrentScreen("home");
    setQuizType(null);
    setSelectedLessonId(null);
  };

  const handleNavigateToAdmin = () => {
    console.log("👑 Admin sayfasına gidiliyor");
    setCurrentScreen("admin");
  };

  // ============ LOGOUT ============
  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      setShowLogin(true);
      setShowRegister(false);
      setCurrentScreen("home");
    } else {
      alert("Çıkış yapılırken bir hata oluştu!");
    }
  };

  // ============ AUTH HANDLERS ============
  const handleLoginSuccess = () => {
    console.log("✅ Login başarılı");
    setShowLogin(false);
    setShowRegister(false);
  };

  const handleSwitchToRegister = () => {
    console.log("🔄 Login -> Register");
    setShowLogin(false);
    setShowRegister(true);
  };

  const handleSwitchToLogin = () => {
    console.log("🔄 Register -> Login");
    setShowLogin(true);
    setShowRegister(false);
  };

  const handleRegisterSuccess = () => {
    console.log("✅ Kayıt başarılı");
    setShowRegister(false);
    setShowLogin(true);
  };

  // ============ QUIZ RENDER ============
  const renderQuizScreen = () => {
    console.log("📝 Quiz render:", quizType);
    
    if (!quizType) {
      return (
        <QuizScreen 
          onStartQuiz={(type) => {
            console.log("🎯 Quiz başlatılıyor:", type);
            handleNavigate("quiz", type);
          }} 
          onBack={handleBackToHome}
        />
      );
    }
    
    if (quizType === "word") {
      return <WordQuiz userLevel={userLevel} onChangeLevel={handleBackToHome} />;
    } else if (quizType === "sentence") {
      return <SentenceQuiz userLevel={userLevel} onChangeLevel={handleBackToHome} />;
    }
    
    return null;
  };

  // ============ RENDER DURUMLARI ============
  
  // 1. Auth yükleniyor durumu
  if (authLoading) {
    return (
      <div className="app-loading">
        <div className="loading-ring" />
        <div className="loading-text">Uygulama yükleniyor...</div>
      </div>
    );
  }

  // 2. Giriş sayfası
  if (showLogin) {
    console.log("📱 Login gösteriliyor, showRegister:", showRegister);
    return (
      <div className="app-auth">
        {showRegister ? (
          <Register 
            onRegisterSuccess={handleRegisterSuccess}
            onSwitchToLogin={handleSwitchToLogin}
          />
        ) : (
          <Login 
            onLoginSuccess={handleLoginSuccess}
            onSwitchToRegister={handleSwitchToRegister}
          />
        )}
      </div>
    );
  }

  // 3. Kullanıcı yoksa login göster (güvenlik için)
  if (!user) {
    console.log("👤 Kullanıcı yok, login gösteriliyor");
    setShowLogin(true);
    return (
      <div className="app-auth">
        <Login 
          onLoginSuccess={handleLoginSuccess}
          onSwitchToRegister={handleSwitchToRegister}
        />
      </div>
    );
  }

  // 4. Ana uygulama
  return (
    <div className="app-container">
      <Header 
        currentScreen={currentScreen} 
        onNavigate={handleNavigate} 
        userLevel={userLevel}
        userRole={userRole}
        quizType={quizType}
        onLogout={handleLogout}
        onNavigateToAdmin={handleNavigateToAdmin}
      />
      
      <main className="app-main">
        {currentScreen === "home" && (
          <HomeScreen 
            onStartQuiz={(type) => {
              console.log("🏠 Home'dan quiz başlatılıyor:", type);
              handleNavigate("quiz", type);
            }}
            onNavigate={handleNavigate}
            onGoToLesson={handleGoToLesson}
          />
        )}
        
        {currentScreen === "dashboard" && <DashboardScreen />}
        
        {currentScreen === "quiz" && renderQuizScreen()}
        
        {currentScreen === "stats" && <StatsScreen userLevel={userLevel} />}
        
        {currentScreen === "lesson" && (
          <LessonPage 
            lessonId={selectedLessonId} 
            onBack={handleBackToHome}
            userId={user?.id}
          />
        )}

        {currentScreen === "admin" && (
          <Admin onBack={handleBackToHome} />
        )}
      </main>
    </div>
  );
}

// ============ ANA APP - PROVIDER'LAR ============
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}