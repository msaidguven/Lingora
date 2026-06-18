// App.jsx
import { useState, useEffect } from "react";
import { supabase } from "./config.js";
import Header from "./Header.jsx";
import HomeScreen from "./components/home/HomeScreen.jsx";
import WordQuiz from "./components/WordQuiz/WordQuiz.jsx";
import SentenceQuiz from "./components/SentenceQuiz/SentenceQuiz.jsx";
import StatsScreen from "./StatsScreen.jsx";
import DashboardScreen from "./components/Dashboard/DashboardScreen.jsx";
import QuizScreen from "./components/Quiz/QuizScreen.jsx";
import LessonPage from "./components/Lesson/LessonPage.jsx"; // ✅ Import eklendi

const FIXED_USER_ID = "302a3b6b-c1e9-49c4-98fe-52115bd7d204";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState("home");
  const [userLevel, setUserLevel] = useState("A1");
  const [quizType, setQuizType] = useState(null);
  const [selectedLessonId, setSelectedLessonId] = useState(null); // ✅ Ders ID'si için state

  useEffect(() => {
    const fetchUserLevel = async () => {
      const { data } = await supabase
        .from("en_users")
        .select("level")
        .eq("id", FIXED_USER_ID)
        .single();
      if (data) setUserLevel(data.level);
    };
    fetchUserLevel();
  }, []);

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

  // ✅ Ders sayfasına gitme fonksiyonu
  const handleGoToLesson = (lessonId) => {
    setSelectedLessonId(lessonId);
    setCurrentScreen("lesson");
    setQuizType(null);
  };

  const handleBackToHome = () => {
    console.log("🏠 Ana sayfaya dönülüyor");
    setCurrentScreen("home");
    setQuizType(null);
    setSelectedLessonId(null); // ✅ Ders ID'sini sıfırla
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

  return (
    <div style={{ minHeight: "100vh", background: "#0f0f1a" }}>
      <Header 
        currentScreen={currentScreen} 
        onNavigate={handleNavigate} 
        userLevel={userLevel}
        quizType={quizType}
      />
      
      {currentScreen === "home" && (
        <HomeScreen 
          onStartQuiz={(type) => {
            console.log("🏠 Home'dan quiz başlatılıyor:", type);
            handleNavigate("quiz", type);
          }}
          onNavigate={handleNavigate}
          onGoToLesson={handleGoToLesson} // ✅ HomeScreen'e prop olarak gönder
        />
      )}
      
      {currentScreen === "dashboard" && <DashboardScreen />}
      
      {currentScreen === "quiz" && renderQuizScreen()}
      
      {currentScreen === "stats" && <StatsScreen userLevel={userLevel} />}
      
      {/* ✅ Ders sayfası */}
      {currentScreen === "lesson" && (
        <LessonPage 
          lessonId={selectedLessonId} 
          onBack={handleBackToHome}
        />
      )}
    </div>
  );
}