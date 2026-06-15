import { useState, useEffect } from "react";
import { supabase } from "./config.js";
import QuizScreen from "./QuizScreen.jsx";
import HomeScreen from "./HomeScreen.jsx";

const FIXED_USER_ID = "302a3b6b-c1e9-49c4-98fe-52115bd7d204";

export default function App() {
  const [screen, setScreen] = useState("home");
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

  const handleStartQuiz = () => {
    setScreen("quiz");
  };

  const handleBackToHome = () => {
    setScreen("home");
  };

  if (screen === "home") {
    return <HomeScreen onStartQuiz={handleStartQuiz} />;
  }

  return <QuizScreen userLevel={userLevel} mode="review" onChangeLevel={handleBackToHome} />;
}