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
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <div className="text-base-content/50">Yükleniyor...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4 p-6 bg-base-100">
        <div className="text-4xl">⚠️</div>
        <div className="text-error text-sm text-center">{error}</div>
        <button onClick={onChangeLevel} className="btn btn-primary">
          Geri Dön
        </button>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4 p-6 text-center bg-base-100 text-base-content">
        <div className="text-6xl">🎉</div>
        <div className="text-2xl font-extrabold">Tebrikler, bitirdiniz!</div>
        <div className="text-sm text-base-content/50">
          Bu oturumda {queue.length} cümle çalıştınız.
        </div>
        <div className="card border border-base-300 bg-base-200 px-6 py-4 shadow-lg">
          <div className="text-sm text-base-content/50">
            Seviye: <span style={{ color: levelColor }} className="font-bold">{userLevel} - {levelLabel}</span>
          </div>
        </div>
        <button 
          onClick={handleRestart} 
          className="btn text-white font-bold px-8 py-3 text-base"
          style={{ 
            backgroundColor: levelColor,
            boxShadow: `0 4px 16px ${levelColor}40`
          }}
        >
          20 Cümle Daha Çalış
        </button>
        <button onClick={onChangeLevel} className="btn btn-ghost text-base-content/50">
          Ana Sayfaya Dön
        </button>
      </div>
    );
  }

  if (!currentQuestion || queue.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4 p-6 text-center bg-base-100 text-base-content">
        <div className="text-5xl">📝</div>
        <div className="text-lg font-bold">Tekrarlanacak cümle yok!</div>
        <div className="text-sm text-base-content/50">
          Ana sayfadan yeni cümle ekleyebilirsin.
        </div>
        <button onClick={onChangeLevel} className="btn btn-primary mt-4">
          Ana Sayfaya Dön
        </button>
      </div>
    );
  }

  const currentWord = currentQuestion.en_words;
  const correctAnswer = currentQuestion.sentence_tr;
  const isCorrect = selected === correctAnswer;

  return (
    <div className="min-h-screen bg-base-100 text-base-content font-sans max-w-md mx-auto px-5 py-5">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <div className="text-sm font-semibold text-base-content/50">
          Cümle Quiz
        </div>
        <div className="flex items-center gap-3">
          <span 
            className="font-bold text-sm px-3 py-1 rounded-full border"
            style={{ 
              color: levelColor,
              backgroundColor: `${levelColor}15`,
              borderColor: `${levelColor}40`
            }}
          >
            {userLevel}
          </span>
          <span className="text-xs text-base-content/30">
            {queueIndex + 1} / {queue.length}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <ProgressBar current={queueIndex} total={queue.length} color={levelColor} />

      {/* Question Card */}
      <div className="card bg-base-200 border border-base-300 rounded-2xl p-7 text-center mt-5 mb-5 shadow-lg">
        <div className="text-xl font-semibold leading-relaxed mb-4">
          "{currentQuestion.sentence_en}"
        </div>
        <button 
          onClick={() => handleSpeak(currentQuestion.sentence_en)} 
          className={`btn inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
            speaking ? 'text-white' : ''
          }`}
          style={speaking ? { backgroundColor: levelColor, boxShadow: `0 4px 16px ${levelColor}60` } : {}}
        >
          <SpeakerIcon /> {speaking ? "Çalıyor..." : "🔊 Dinle"}
        </button>
      </div>

      {/* Question Label */}
      <div className="text-sm font-semibold tracking-wide mb-3 text-base-content/50">
        Bu cümlenin Türkçesi nedir?
      </div>

      {/* Options */}
      <div className="flex flex-col gap-2.5">
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
        <div className="mt-6 text-center text-xs text-base-content/30">
          <span>Doğru şıkkı seç ve devam et</span>
        </div>
      )}
    </div>
  );
}