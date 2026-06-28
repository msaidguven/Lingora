import { useEffect, useState, useRef } from "react";
import { useSentenceQuiz } from "../../hooks/useSentenceQuiz.js";
import { speak } from "../../utils/speechUtils.js";
import { updateDailyStats } from "../../utils/dailyStats.js";
import { useAuth } from '../../contexts/AuthContext.jsx';
import SpeakerIcon from "../common/SpeakerIcon.jsx";
import ProgressBar from "../common/ProgressBar.jsx";
import OptionButton from "../common/OptionButton.jsx";
import SentenceResult from "./SentenceResult.jsx";

const LEVEL_COLOR = { A1: "#10b981", A2: "#3b82f6", B1: "#8b5cf6", B2: "#f59e0b" };
const LEVEL_LABEL = { A1: "Başlangıç", A2: "Temel", B1: "Orta", B2: "Üst-Orta" };

// Tema renkleri
const THEMES = {
  dark: {
    background: "#0f0f1a",
    cardBg: "linear-gradient(135deg, #1a1a2e, #16213e)",
    cardBorder: "#1e293b",
    textPrimary: "#e2e8f0",
    textSecondary: "#64748b",
    textMuted: "#475569",
    buttonBg: "#1e293b",
    buttonHover: "#2d3a4f",
    shadow: "0 4px 24px rgba(0,0,0,0.3)",
    inputBg: "#1e293b",
    inputBorder: "#334155",
    successBg: "#10b98120",
    errorBg: "#ef444420",
    resultBg: "#1a1a2e",
  },
  light: {
    background: "#f1f5f9",
    cardBg: "linear-gradient(135deg, #ffffff, #f8fafc)",
    cardBorder: "#e2e8f0",
    textPrimary: "#0f172a",
    textSecondary: "#475569",
    textMuted: "#94a3b8",
    buttonBg: "#e2e8f0",
    buttonHover: "#cbd5e1",
    shadow: "0 4px 24px rgba(0,0,0,0.08)",
    inputBg: "#ffffff",
    inputBorder: "#e2e8f0",
    successBg: "#10b98115",
    errorBg: "#ef444415",
    resultBg: "#ffffff",
  }
};

export default function SentenceQuiz({ userLevel, onChangeLevel, isDarkMode = true }) {
  const { user } = useAuth();
  const isUpdatingRef = useRef(false);
  
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
  const levelLabel = LEVEL_LABEL[userLevel];
  const theme = THEMES[isDarkMode ? 'dark' : 'light'];

  useEffect(() => {
    setIsFinished(false);
  }, [userLevel]);

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
    if (answered || saving || isUpdatingRef.current) return;
    
    isUpdatingRef.current = true;

    await handleSelect(opt, async (isCorrect) => {
      try {
        if (user) {
          await updateDailyStats(user.id, 'sentence', isCorrect);
        }
      } catch (error) {
        console.error('İstatistik güncelleme hatası:', error);
      }
    });

    isUpdatingRef.current = false;
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
      <div style={{ 
        minHeight: "100vh", 
        background: theme.background, 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center" 
      }}>
        <div style={{ color: theme.textSecondary }}>Yükleniyor...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        background: theme.background, 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        flexDirection: "column", 
        gap: 16, 
        padding: 24 
      }}>
        <div style={{ fontSize: 36 }}>⚠️</div>
        <div style={{ color: "#ef4444", fontSize: 14, textAlign: "center" }}>{error}</div>
        <button 
          onClick={onChangeLevel} 
          style={{ 
            background: "#6366f1", 
            border: "none", 
            borderRadius: 10, 
            padding: "10px 20px", 
            color: "#fff", 
            cursor: "pointer",
            fontWeight: 600,
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => e.target.style.background = "#4f46e5"}
          onMouseLeave={(e) => e.target.style.background = "#6366f1"}
        >
          Geri Dön
        </button>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        background: theme.background, 
        color: theme.textPrimary, 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        flexDirection: "column", 
        gap: 16, 
        padding: 24, 
        textAlign: "center" 
      }}>
        <div style={{ fontSize: 64 }}>🎉</div>
        <div style={{ fontSize: 24, fontWeight: 800 }}>Tebrikler, bitirdiniz!</div>
        <div style={{ fontSize: 14, color: theme.textSecondary }}>
          Bu oturumda {queue.length} cümle çalıştınız.
        </div>
        <div style={{ 
          background: theme.cardBg,
          border: `1px solid ${theme.cardBorder}`,
          borderRadius: 12,
          padding: "16px 24px",
          marginTop: 8,
          boxShadow: theme.shadow
        }}>
          <div style={{ fontSize: 13, color: theme.textSecondary }}>
            Seviye: <span style={{ color: levelColor, fontWeight: 700 }}>{userLevel} - {levelLabel}</span>
          </div>
        </div>
        <button 
          onClick={handleRestart} 
          style={{ 
            background: levelColor, 
            border: "none", 
            borderRadius: 12, 
            padding: "14px 32px", 
            color: "#fff", 
            cursor: "pointer", 
            fontWeight: 700, 
            marginTop: 16,
            fontSize: 16,
            transition: "all 0.2s",
            boxShadow: `0 4px 16px ${levelColor}40`
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "scale(1.02)";
            e.target.style.boxShadow = `0 6px 24px ${levelColor}60`;
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "scale(1)";
            e.target.style.boxShadow = `0 4px 16px ${levelColor}40`;
          }}
        >
          20 Cümle Daha Çalış
        </button>
        <button 
          onClick={onChangeLevel} 
          style={{ 
            background: "transparent", 
            border: `1px solid ${theme.cardBorder}`, 
            borderRadius: 10, 
            padding: "10px 22px", 
            color: theme.textSecondary, 
            cursor: "pointer", 
            fontWeight: 600,
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => {
            e.target.style.background = isDarkMode ? "#1e293b" : "#f1f5f9";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "transparent";
          }}
        >
          Ana Sayfaya Dön
        </button>
      </div>
    );
  }

  if (!currentQuestion || queue.length === 0) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        background: theme.background, 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        flexDirection: "column", 
        gap: 16, 
        padding: 24, 
        textAlign: "center" 
      }}>
        <div style={{ fontSize: 48 }}>📝</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: theme.textPrimary }}>
          Tekrarlanacak cümle yok!
        </div>
        <div style={{ fontSize: 13, color: theme.textSecondary }}>
          Ana sayfadan yeni cümle ekleyebilirsin.
        </div>
        <button 
          onClick={onChangeLevel} 
          style={{ 
            background: "#6366f1", 
            border: "none", 
            borderRadius: 10, 
            padding: "12px 24px", 
            color: "#fff", 
            cursor: "pointer", 
            fontWeight: 600, 
            marginTop: 16,
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => e.target.style.background = "#4f46e5"}
          onMouseLeave={(e) => e.target.style.background = "#6366f1"}
        >
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
      background: theme.background, 
      color: theme.textPrimary, 
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif", 
      maxWidth: 480, 
      margin: "0 auto", 
      padding: "20px" 
    }}>
      {/* Header */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginBottom: 8
      }}>
        <div style={{ 
          fontSize: 13, 
          color: theme.textSecondary,
          fontWeight: 600
        }}>
          Cümle Quiz
        </div>
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 12
        }}>
          <span style={{ 
            color: levelColor, 
            fontWeight: 700, 
            fontSize: 13,
            background: isDarkMode ? `${levelColor}20` : `${levelColor}15`,
            padding: "4px 12px",
            borderRadius: 20,
            border: `1px solid ${levelColor}40`
          }}>
            {userLevel}
          </span>
          <span style={{ 
            fontSize: 12, 
            color: theme.textMuted
          }}>
            {queueIndex + 1} / {queue.length}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <ProgressBar current={queueIndex} total={queue.length} color={levelColor} />

      {/* Question Card */}
      <div style={{ 
        background: theme.cardBg, 
        border: `1px solid ${theme.cardBorder}`, 
        borderRadius: 16, 
        padding: "28px 24px", 
        textAlign: "center", 
        marginTop: 20,
        marginBottom: 20,
        boxShadow: theme.shadow
      }}>
        <div style={{ 
          fontSize: 20, 
          fontWeight: 600, 
          letterSpacing: -0.3, 
          marginBottom: 16, 
          lineHeight: 1.5,
          color: theme.textPrimary
        }}>
          "{currentQuestion.sentence_en}"
        </div>
        <button 
          onClick={() => handleSpeak(currentQuestion.sentence_en)} 
          style={{ 
            background: speaking ? levelColor : theme.buttonBg, 
            border: "none", 
            borderRadius: 10, 
            padding: "8px 18px", 
            color: speaking ? "#fff" : theme.textPrimary, 
            cursor: "pointer", 
            display: "inline-flex", 
            alignItems: "center", 
            gap: 8, 
            fontSize: 13, 
            fontWeight: 600,
            transition: "all 0.2s",
            boxShadow: speaking ? `0 4px 16px ${levelColor}60` : "none"
          }}
          onMouseEnter={(e) => {
            if (!speaking) {
              e.target.style.background = theme.buttonHover;
            }
          }}
          onMouseLeave={(e) => {
            if (!speaking) {
              e.target.style.background = theme.buttonBg;
            }
          }}
        >
          <SpeakerIcon /> {speaking ? "Çalıyor..." : "🔊 Dinle"}
        </button>
      </div>

      {/* Question Label */}
      <div style={{ 
        fontSize: 13, 
        color: theme.textSecondary, 
        marginBottom: 12, 
        fontWeight: 600,
        letterSpacing: 0.3
      }}>
        Bu cümlenin Türkçesi nedir?
      </div>

      {/* Options */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
              isDarkMode={isDarkMode}
            />
          );
        })}
      </div>

      {/* Result */}
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
    isDarkMode={isDarkMode}
  />
)}

      {/* Bottom Info */}
      {!answered && !saving && (
        <div style={{ 
          marginTop: 24, 
          textAlign: "center", 
          fontSize: 11, 
          color: theme.textMuted 
        }}>
          <span>Doğru şıkkı seç ve devam et</span>
        </div>
      )}
    </div>
  );
}