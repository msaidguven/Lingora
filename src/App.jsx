import { useState, useEffect } from "react";
import { supabase } from "./config.js";
import Header from "./Header.jsx";
import HomeScreen from "./HomeScreen.jsx";
import QuizScreen from "./QuizScreen.jsx";
import StatsScreen from "./StatsScreen.jsx";

const FIXED_USER_ID = "302a3b6b-c1e9-49c4-98fe-52115bd7d204";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState("home");
  const [userLevel, setUserLevel] = useState("A1");

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

  const handleNavigate = (screen) => {
    setCurrentScreen(screen);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f0f1a" }}>
      <Header 
        currentScreen={currentScreen} 
        onNavigate={handleNavigate} 
        userLevel={userLevel}
      />
      
      {currentScreen === "home" && <HomeScreen onStartQuiz={() => handleNavigate("quiz")} />}
      {currentScreen === "quiz" && <QuizScreen userLevel={userLevel} onChangeLevel={() => handleNavigate("home")} />}
      {currentScreen === "stats" && <StatsScreen userLevel={userLevel} />}
    </div>
  );
}