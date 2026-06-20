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
import { Login } from "./components/auth/Login.jsx";
import { Register } from "./components/auth/Register.jsx";
import './App.css';

// AppContent bileşeni - AuthProvider içinde çalışır
function AppContent() {
  const { user, loading: authLoading, logout } = useAuth();
  const [currentScreen, setCurrentScreen] = useState("home");
  const [userLevel, setUserLevel] = useState("A1");
  const [quizType, setQuizType] = useState(null);
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  // Kullanıcı seviyesini çek
  useEffect(() => {
    if (!user) {
      setShowLogin(true);
      setShowRegister(false);
      return;
    }
    
    const fetchUserLevel = async () => {
      try {
        const { data, error } = await supabase
          .from("en_users")
          .select("level")
          .eq("id", user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error("Seviye çekme hatası:", error);
          return;
        }

        if (data) {
          setUserLevel(data.level);
        } else {
          const { error: insertError } = await supabase
            .from("en_users")
            .insert([{ 
              id: user.id, 
              email: user.email,
              level: "A1",
              created_at: new Date().toISOString()
            }]);

          if (insertError) {
            console.error("Kullanıcı oluşturma hatası:", insertError);
          } else {
            setUserLevel("A1");
          }
        }
      } catch (error) {
        console.error("Seviye işlemleri hatası:", error);
      }
    };

    fetchUserLevel();
    setShowLogin(false);
    setShowRegister(false);
  }, [user]);

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

  // Auth yükleniyor durumu
  if (authLoading) {
    return (
      <div className="app-loading">
        <div className="loading-ring" />
        <div className="loading-text">Uygulama yükleniyor...</div>
      </div>
    );
  }

  // Giriş sayfası
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

  // Kullanıcı yoksa login göster (güvenlik için)
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

  // Ana uygulama
  return (
    <div className="app-container">
      <Header 
        currentScreen={currentScreen} 
        onNavigate={handleNavigate} 
        userLevel={userLevel}
        quizType={quizType}
        onLogout={handleLogout}
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
      </main>
    </div>
  );
}

// ANA APP - Provider'lar burada sarmalıyor
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}