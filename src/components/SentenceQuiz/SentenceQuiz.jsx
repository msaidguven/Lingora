import { useEffect, useState } from "react";
import { useSentenceQuiz } from "../../hooks/useSentenceQuiz.js";
import { speak } from "../../utils/speechUtils.js";
import { updateDailyStats } from "../../utils/dailyStats.js"; // ✅ Eklendi
import SpeakerIcon from "../common/SpeakerIcon.jsx";
import ProgressBar from "../common/ProgressBar.jsx";
import OptionButton from "../common/OptionButton.jsx";
import SentenceResult from "./SentenceResult.jsx";

const LEVEL_COLOR = { A1: "#10b981", A2: "#3b82f6", B1: "#8b5cf6", B2: "#f59e0b" };

export default function SentenceQuiz({ userLevel, onChangeLevel }) {
  const {
    loading,
    error,
    currentQuestion,
    options,
    selected,
    answered,
    saving,
    queue,
    queueIndex,
    allCards,
    handleSelect,
    handleNext,
    restartQuizSession,
    setSelected,
    setAnswered
  } = useSentenceQuiz(userLevel);

  const [speaking, setSpeaking] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const levelColor = LEVEL_COLOR[userLevel];

  useEffect(() => {
    setIsFinished(false);
  }, [userLevel]);

  // Cümle gelince telaffuz et
  useEffect(() => {
    if (currentQuestion && !answered && !saving) {
      setTimeout(() => {
        speak(currentQuestion.sentence_en);
      }, 100);
    }
  }, [currentQuestion, answered, saving]);

  const handleSpeak = (text) => {
    setSpeaking(true);
    speak(text);
    setTimeout(() => setSpeaking(false), 1800);
  };

  const onSelect = async (opt) => {
    await handleSelect(opt, async (isCorrect) => {
      // ✅ İstatistikleri güncelle (Türkiye saatiyle)
      try {
        await updateDailyStats('sentence', isCorrect);
      } catch (error) {
        console.error('İstatistik güncelleme hatası:', error);
      }
    });
  };

  const onNext = () => {
    const nextQuestion = handleNext();
    if (nextQuestion === null) {
      setIsFinished(true);
    }
  };

  const handleRestart = () => {
    setIsFinished(false);
    restartQuizSession();
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f0f1a", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#64748b" }}>Yükleniyor...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f0f1a", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, padding: 24 }}>
        <div style={{ fontSize: 36 }}>⚠️</div>
        <div style={{ color: "#ef4444", fontSize: 14, textAlign: "center" }}>{error}</div>
        <button onClick={onChangeLevel} style={{ background: "#6366f1", border: "none", borderRadius: 10, padding: "10px 20px", color: "#fff", cursor: "pointer" }}>Geri Dön</button>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f0f1a", color: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, padding: 24, textAlign: "center" }}>
        <div style={{ fontSize: 48 }}>🎉</div>
        <div style={{ fontSize: 20, fontWeight: 800 }}>Tebrikler, bitirdiniz!</div>
        <div style={{ fontSize: 13, color: "#64748b" }}>
          Bu oturumda {queue.length} cümle çalıştınız.
        </div>
        <button onClick={handleRestart} style={{ background: "#6366f1", border: "none", borderRadius: 10, padding: "12px 24px", color: "#fff", cursor: "pointer", fontWeight: 700, marginTop: 16 }}>
          20 Cümle Daha Çalış
        </button>
        <button onClick={onChangeLevel} style={{ background: "transparent", border: "1px solid #1e293b", borderRadius: 10, padding: "10px 22px", color: "#64748b", cursor: "pointer", fontWeight: 600 }}>
          Ana Sayfaya Dön
        </button>
      </div>
    );
  }

  if (!currentQuestion || queue.length === 0) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f0f1a", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, padding: 24, textAlign: "center" }}>
        <div style={{ fontSize: 48 }}>🎉</div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Tekrarlanacak cümle yok!</div>
        <div style={{ fontSize: 13, color: "#64748b" }}>Ana sayfadan yeni cümle ekleyebilirsin.</div>
        <button onClick={onChangeLevel} style={{ background: "#6366f1", border: "none", borderRadius: 10, padding: "12px 24px", color: "#fff", cursor: "pointer", fontWeight: 600, marginTop: 16 }}>
          Ana Sayfaya Dön
        </button>
      </div>
    );
  }

  const currentWord = currentQuestion.en_words;
  const correctAnswer = currentQuestion.sentence_tr;
  const isCorrect = selected === correctAnswer;

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "#0f0f1a", 
      color: "#e2e8f0", 
      fontFamily: "'Inter', system-ui, sans-serif", 
      maxWidth: 420, 
      margin: "0 auto", 
      padding: "20px" 
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#475569", marginBottom: 6 }}>
        <span>{queueIndex + 1} / {queue.length}</span>
        <span style={{ color: levelColor, fontWeight: 700 }}>{options.length} şık</span>
      </div>
      
      <ProgressBar current={queueIndex} total={queue.length} color={levelColor} />

      <div style={{ 
        background: "linear-gradient(135deg, #1a1a2e, #16213e)", 
        border: "1px solid #1e293b", 
        borderRadius: 20, 
        padding: "26px 22px", 
        textAlign: "center", 
        marginBottom: 18 
      }}>
        <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: -0.5, marginBottom: 14, lineHeight: 1.4 }}>
          "{currentQuestion.sentence_en}"
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
          <button 
            onClick={() => handleSpeak(currentQuestion.sentence_en)} 
            style={{ 
              background: speaking ? "#6366f1" : "#1e293b", 
              border: "none", 
              borderRadius: 10, 
              padding: "7px 16px", 
              color: "#e2e8f0", 
              cursor: "pointer", 
              display: "inline-flex", 
              alignItems: "center", 
              gap: 6, 
              fontSize: 12, 
              fontWeight: 600 
            }}
          >
            <SpeakerIcon /> {speaking ? "Çalıyor..." : "Telaffuz"}
          </button>
        </div>
      </div>

      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10, fontWeight: 600 }}>
        Bu cümlenin Türkçesi nedir?
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {options.map((opt, i) => {
          const isOptionCorrect = opt === correctAnswer;
          const isSelected = opt === selected;
          return (
            <OptionButton
              key={i}
              index={i}
              label={opt}
              isAnswered={answered}
              isCorrect={isOptionCorrect}
              isSelected={isSelected}
              onClick={() => onSelect(opt)}
              disabled={answered || saving}
            />
          );
        })}
      </div>

      {answered && (
        <SentenceResult
          isCorrect={isCorrect}
          correctAnswer={correctAnswer}
          selectedAnswer={selected}
          currentWord={currentWord}
          onNext={onNext}
          onSpeak={handleSpeak}
          isSaving={saving}
          isLastQuestion={queueIndex + 1 >= queue.length}
        />
      )}
    </div>
  );
}