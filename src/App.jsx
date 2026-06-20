// App.jsx
import { useState, useEffect } from "react";
import { supabase } from "./config.js";

import { useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';

import Header from './components/Header';

import HomeScreen from "./HomeScreen.jsx";
import WordQuiz from "./components/WordQuiz/WordQuiz.jsx";
import SentenceQuiz from "./components/SentenceQuiz/SentenceQuiz.jsx";
import StatsScreen from "./StatsScreen.jsx";
import DashboardScreen from "./components/Dashboard/DashboardScreen.jsx";
import QuizScreen from "./components/Quiz/QuizScreen.jsx";
import LessonPage from "./components/Lesson/LessonPage.jsx";
import { Login } from "./components/auth/Login.jsx";
import { Register } from "./components/auth/Register.jsx";
import './styles/theme.css';
import './App.css'; 


export default function App() {
  const { user, loading: authLoading, logout } = useAuth();
  const { theme } = useTheme();
  
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
          // Kullanıcı kaydı yoksa oluştur
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
      setCurrentScreen("home");
    } else {
      alert("Çıkış yapılırken bir hata oluştu!");
    }
  };

  const handleLoginSuccess = () => {
    setShowLogin(false);
    setShowRegister(false);
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
      <div className={`app-loading ${theme}`}>
        <div className="loading-ring" />
        <div className="loading-text">Uygulama yükleniyor...</div>
      </div>
    );
  }

  // Giriş sayfası
  if (showLogin) {
    return (
      <div className={`app-auth ${theme}`}>
        {showRegister ? (
          <Register 
            onRegisterSuccess={() => {
              setShowRegister(false);
              setShowLogin(true);
            }}
            onSwitchToLogin={() => {
              setShowRegister(false);
              setShowLogin(true);
            }}
          />
        ) : (
          <Login 
            onLoginSuccess={handleLoginSuccess}
            onSwitchToRegister={() => {
              setShowLogin(false);
              setShowRegister(true);
            }}
          />
        )}
      </div>
    );
  }

  // Ana uygulama
  return (
    <div className={`app-container ${theme}`}>
 

<Header 
  currentScreen={currentScreen} 
  onNavigate={handleNavigate} 
  userLevel={userLevel}
  quizType={quizType}
  onLogout={handleBackToHome}
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