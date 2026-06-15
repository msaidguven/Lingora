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

  // Yeni kelime açma işlemi
  const handleOpenNewWord = async () => {
    // Havuzdaki kelime ID'lerini al
    const { data: userWords } = await supabase
      .from("en_user_words")
      .select("word_id")
      .eq("user_id", FIXED_USER_ID);
    
    const learnedIds = userWords?.map(w => w.word_id) || [];
    
    // Havuzda olmayan rastgele bir kelime bul
    let query = supabase
      .from("en_words")
      .select("*")
      .eq("level", userLevel)
      .eq("type", "word");
    
    if (learnedIds.length > 0) {
      query = query.not("id", "in", `(${learnedIds.join(",")})`);
    }
    
    const { data: newWords } = await query.limit(10);
    
    if (!newWords || newWords.length === 0) {
      alert("Tüm kelimeleri açtınız!");
      return;
    }
    
    const randomWord = newWords[Math.floor(Math.random() * newWords.length)];
    
    // QuizScreen'e yönlendir (yeni kelime modu)
    setScreen("newWordQuiz");
    // Geçici state'e kelimeyi kaydet (bunu daha sonra düzenli yapacağız)
    sessionStorage.setItem("newWord", JSON.stringify(randomWord));
  };

  const handleStartQuiz = () => {
    setScreen("quiz");
  };

  const handleBackToHome = () => {
    setScreen("home");
  };

  if (screen === "home") {
    return <HomeScreen onStartQuiz={handleStartQuiz} onOpenNewWord={handleOpenNewWord} />;
  }

  if (screen === "newWordQuiz") {
    const newWord = JSON.parse(sessionStorage.getItem("newWord") || "{}");
    return (
      <QuizScreen 
        userLevel={userLevel} 
        mode="new"
        newWord={newWord}
        onChangeLevel={handleBackToHome} 
      />
    );
  }

  return <QuizScreen userLevel={userLevel} mode="review" onChangeLevel={handleBackToHome} />;
}