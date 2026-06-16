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
  const [quizType, setQuizType] = useState(null); // "word" veya "sentence"

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
    if (type) {
      setQuizType(type);
    }
    setCurrentScreen(screen);
  };

  const handleBackToHome = () => {
    setCurrentScreen("home");
    setQuizType(null);
  };

  // Hangi quiz sayfasını göstereceğini belirle
  const renderQuizScreen = () => {
    if (quizType === "word") {
      return <WordQuiz userLevel={userLevel} onChangeLevel={handleBackToHome} />;
    } else if (quizType === "sentence") {
      return <SentenceQuiz userLevel={userLevel} onChangeLevel={handleBackToHome} />;
    }
    return <QuizScreen />; // Boş QuizScreen
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
          onStartQuiz={(type) => handleNavigate("quiz", type)} 
        />
      )}
      
      {currentScreen === "dashboard" && <DashboardScreen />}
      
      {currentScreen === "quiz" && renderQuizScreen()}
      
      {currentScreen === "stats" && <StatsScreen userLevel={userLevel} />}
    </div>
  );
}