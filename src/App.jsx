import { useState, useEffect } from "react";
import { supabase } from "./config.js";
import Header from "./Header.jsx";
import HomeScreen from "./HomeScreen.jsx";
import WordQuiz from "./components/WordQuiz/WordQuiz.jsx";
import SentenceQuiz from "./components/SentenceQuiz/SentenceQuiz.jsx";
import StatsScreen from "./StatsScreen.jsx";
import DashboardScreen from "./components/Dashboard/DashboardScreen.jsx";
import QuizScreen from "./components/Quiz/QuizScreen.jsx";

const FIXED_USER_ID = "302a3b6b-c1e9-49c4-98fe-52115bd7d204";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState("home");
  const [userLevel, setUserLevel] = useState("A1");
  const [quizType, setQuizType] = useState(null);

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

  // Navigasyon fonksiyonu
  const handleNavigate = (screen, type = null) => {
    console.log("🔄 Navigasyon:", screen, type); // DEBUG
    if (type) {
      setQuizType(type);
    }
    setCurrentScreen(screen);
  };

  // Ana sayfaya dön
  const handleBackToHome = () => {
    console.log("🏠 Ana sayfaya dönülüyor"); // DEBUG
    setCurrentScreen("home");
    setQuizType(null);
  };

  // Quiz sayfasını render et
  const renderQuizScreen = () => {
    console.log("📝 Quiz render:", quizType); // DEBUG
    
    if (quizType === "word") {
      return <WordQuiz userLevel={userLevel} onChangeLevel={handleBackToHome} />;
    } else if (quizType === "sentence") {
      return <SentenceQuiz userLevel={userLevel} onChangeLevel={handleBackToHome} />;
    }
    
    // quizType null ise QuizScreen göster
    return (
      <QuizScreen 
        onStartQuiz={(type) => {
          console.log("🎯 Quiz başlatılıyor:", type); // DEBUG
          handleNavigate("quiz", type);
        }} 
        onBack={() => {
          console.log("⬅️ Geri dönüldü"); // DEBUG
          handleBackToHome();
        }}
      />
    );
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
            console.log("🏠 Home'dan quiz başlatılıyor:", type); // DEBUG
            handleNavigate("quiz", type);
          }} 
        />
      )}
      
      {currentScreen === "dashboard" && <DashboardScreen />}
      
      {currentScreen === "quiz" && renderQuizScreen()}
      
      {currentScreen === "stats" && <StatsScreen userLevel={userLevel} />}
    </div>
  );
}