import { useEffect, useState, useRef } from "react";
import { useSentenceQuiz } from "../../hooks/useSentenceQuiz.js";
import { speak } from "../../utils/speechUtils.js";
import { updateDailyStats } from "../../utils/dailyStats.js";
import { useAuth } from '../../contexts/AuthContext.jsx';
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
    if (speaking) return;
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
      <div className="min-h-screen flex items-center justify-center flex-col gap-6 p-6 text-center bg-gradient-to-b from-base-100 to-base-200">
        <div className="relative">
          <div className="absolute inset-0 blur-2xl bg-primary/20 rounded-full animate-pulse" />
          <div className="relative text-7xl">🎉</div>
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Tebrikler!
          </h2>
          <p className="text-base-content/60 text-sm">
            Bu oturumda {queue.length} cümle çalıştınız.
          </p>
        </div>
        <div className="badge badge-lg px-4 py-3 gap-2 border" style={{ borderColor: `${levelColor}40` }}>
          <span className="text-base-content/60">Seviye</span>
          <span className="font-bold" style={{ color: levelColor }}>{userLevel}</span>
          <span className="text-base-content/40">•</span>
          <span className="text-base-content/60">{levelLabel}</span>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs mt-2">
          <button 
            onClick={handleRestart} 
            className="btn text-white font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105"
            style={{ 
              backgroundColor: levelColor,
              boxShadow: `0 4px 20px ${levelColor}50`
            }}
          >
            20 Cümle Daha Çalış
          </button>
          <button onClick={onChangeLevel} className="btn btn-ghost">
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestion || queue.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4 p-6 text-center bg-base-100">
        <div className="text-6xl">📝</div>
        <h3 className="text-xl font-bold">Tekrarlanacak cümle yok!</h3>
        <p className="text-sm text-base-content/50">
          Ana sayfadan yeni cümle ekleyebilirsin.
        </p>
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
    <div className="min-h-screen bg-gradient-to-b from-base-100 to-base-200 font-sans max-w-md mx-auto px-5 py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={onChangeLevel}
            className="btn btn-ghost btn-sm btn-square"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-base-content/60">
            Cümle Quiz
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div 
            className="badge badge-sm px-3 py-2 font-bold border"
            style={{ 
              color: levelColor,
              backgroundColor: `${levelColor}12`,
              borderColor: `${levelColor}30`
            }}
          >
            {userLevel}
          </div>
          <span className="text-xs font-medium text-base-content/40 tabular-nums">
            {queueIndex + 1} / {queue.length}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <ProgressBar current={queueIndex} total={queue.length} color={levelColor} />
      </div>

      {/* Question Card - Tıklanabilir */}
      <div 
        onClick={() => handleSpeak(currentQuestion.sentence_en)}
        className={`card bg-base-100 border border-base-300 rounded-2xl p-8 text-center mb-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group ${
          speaking ? 'ring-2 ring-offset-2' : ''
        }`}
        style={speaking ? { ringColor: levelColor } : {}}
      >
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-xs text-base-content/30">🔊 tıkla</span>
        </div>
        <div className={`text-xl font-medium leading-relaxed transition-colors duration-300 ${
          speaking ? 'text-primary' : 'text-base-content'
        }`}>
          "{currentQuestion.sentence_en}"
        </div>
        {speaking && (
          <div className="mt-3 flex justify-center">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>

      {/* Question Label */}
      <div className="flex items-center gap-2 text-sm font-medium text-base-content/50 mb-4">
        <span className="w-1 h-4 rounded-full" style={{ backgroundColor: levelColor }} />
        Bu cümlenin Türkçesi nedir?
      </div>

      {/* Options */}
      <div className="flex flex-col gap-3">
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
              isDark={isDarkMode}
            />
          );
        })}
      </div>

      {/* Result */}
      {answered && (
        <div className="mt-6">
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
        </div>
      )}

      {/* Bottom Info */}
      {!answered && !saving && (
        <div className="mt-8 text-center">
          <span className="text-xs text-base-content/20 tracking-wider">
            DOĞRU ŞIKKI SEÇ VE DEVAM ET
          </span>
        </div>
      )}
    </div>
  );
}