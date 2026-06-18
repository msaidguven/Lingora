// HomeScreen.jsx
import { useState, useEffect } from "react";
import { FIXED_USER_ID } from "./components/home/constants.js";
import { styles, globalCss } from "./components/home/styles.js";
import LoadingScreen from "./components/home/LoadingScreen.jsx";
import HomeHeader from "./components/home/HomeHeader.jsx";
import LessonsSection from "./components/home/LessonsSection.jsx";
import ProgressCard from "./components/home/ProgressCard.jsx";
import OpenNewWordsButton from "./components/home/OpenNewWordsButton.jsx";
import QuizButtons from "./components/home/QuizButtons.jsx";
import StatTiles from "./components/home/StatTiles.jsx";
import SummaryBar from "./components/home/SummaryBar.jsx";

export default function HomeScreen({ onStartQuiz, onGoToLesson }) {
  const [mounted, setMounted] = useState(false);
  const [opening, setOpening] = useState(false);
  
  const {
    loading,
    totalWords,
    myWordsCount,
    dailyRemaining,
    dueCount,
    dueSentenceCount,
    userLevel,
    recentLessons,
    lessonsLoading,
    openNewWords,
  } = useHomeData();

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const handleOpenNewWords = async () => {
    setOpening(true);
    await openNewWords();
    setOpening(false);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  const progress = totalWords > 0 ? (myWordsCount / totalWords) * 100 : 0;
  const remainingWords = totalWords - myWordsCount;

  return (
    <div style={styles.page}>
      <style>{globalCss}</style>

      <div style={styles.glowTop} />
      <div style={styles.glowBottom} />

      <div style={{ 
        ...styles.content, 
        opacity: mounted ? 1 : 0, 
        transform: mounted ? "translateY(0)" : "translateY(12px)" 
      }}>
        <HomeHeader userLevel={userLevel} />
        
        <LessonsSection 
          lessons={recentLessons} 
          loading={lessonsLoading} 
          onGoToLesson={onGoToLesson} 
        />
        
        <ProgressCard 
          myWordsCount={myWordsCount} 
          totalWords={totalWords} 
          mounted={mounted} 
        />
        
        <OpenNewWordsButton 
          dailyRemaining={dailyRemaining}
          myWordsCount={myWordsCount}
          totalWords={totalWords}
          opening={opening}
          onOpenNewWords={handleOpenNewWords}
        />
        
        <QuizButtons 
          dueCount={dueCount}
          dueSentenceCount={dueSentenceCount}
          onStartQuiz={onStartQuiz}
        />
        
        <StatTiles 
          progress={progress}
          remainingWords={remainingWords}
        />
        
        <SummaryBar 
          dueCount={dueCount}
          dueSentenceCount={dueSentenceCount}
        />
      </div>
    </div>
  );
}