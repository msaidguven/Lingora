import { useState, useEffect } from "react";
import QuizScreen from "./QuizScreen.jsx";
import HomeScreen from "./HomeScreen.jsx";

const FIXED_USER_ID = "302a3b6b-c1e9-49c4-98fe-52115bd7d204";

export default function App() {
  const [screen, setScreen] = useState("home");
  const [userLevel, setUserLevel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Kullanıcının seviyesini db'den al
    const fetchUserLevel = async () => {
      const { data, error } = await supabase
        .from("en_users")
        .select("level")
        .eq("id", FIXED_USER_ID)
        .single();
      
      if (data && !error) {
        setUserLevel(data.level);
      } else {
        setUserLevel("A1"); // varsayılan
      }
      setLoading(false);
    };
    
    fetchUserLevel();
  }, []);

  const handleStartQuiz = () => {
    setScreen("quiz");
  };

  const handleBackToHome = () => {
    setScreen("home");
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f0f1a", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#64748b" }}>Yükleniyor...</div>
      </div>
    );
  }

  if (screen === "home") {
    return <HomeScreen onStartQuiz={handleStartQuiz} />;
  }

  return <QuizScreen userLevel={userLevel} onChangeLevel={handleBackToHome} />;
}