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
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-[#0f0f1a]' : 'bg-[#f1f5f9]'}`}>
        <div className={isDarkMode ? 'text-[#64748b]' : 'text-[#475569]'}>Yükleniyor...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center flex-col gap-4 p-6 ${isDarkMode ? 'bg-[#0f0f1a]' : 'bg-[#f1f5f9]'}`}>
        <div className="text-4xl">⚠️</div>
        <div className="text-error text-sm text-center">{error}</div>
        <button onClick={onChangeLevel} className="btn btn-primary">Geri Dön</button>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className={`min-h-screen flex items-center justify-center flex-col gap-6 p-6 text-center ${isDarkMode ? 'bg-[#0f0f1a]' : 'bg-[#f1f5f9]'}`}>
        <div className="text-7xl">🎉</div>
        <div className={`text-2xl font-extrabold ${isDarkMode ? 'text-[#e2e8f0]' : 'text-[#0f172a]'}`}>
          Tebrikler, bitirdiniz!
        </div>
        <div className={`text-sm ${isDarkMode ? 'text-[#64748b]' : 'text-[#475569]'}`}>
          Bu oturumda {queue.length} cümle çalıştınız.
        </div>
        <div className={`card border px-6 py-4 shadow-lg ${isDarkMode ? 'bg-[#1a1a2e] border-[#1e293b]' : 'bg-white border-[#e2e8f0]'}`}>
          <div className={`text-sm ${isDarkMode ? 'text-[#64748b]' : 'text-[#475569]'}`}>
            Seviye: <span style={{ color: levelColor }} className="font-bold">{userLevel} - {levelLabel}</span>
          </div>
        </div>
        <button 
          onClick={handleRestart} 
          className="btn text-white font-bold px-8 py-3 text-base shadow-lg hover:shadow-xl transition-all hover:scale-105"
          style={{ 
            backgroundColor: levelColor,
            boxShadow: `0 4px 20px ${levelColor}50`
          }}
        >
          20 Cümle Daha Çalış
        </button>
        <button onClick={onChangeLevel} className={`btn btn-ghost ${isDarkMode ? 'text-[#64748b]' : 'text-[#475569]'}`}>
          Ana Sayfaya Dön
        </button>
      </div>
    );
  }

  if (!currentQuestion || queue.length === 0) {
    return (
      <div className={`min-h-screen flex items-center justify-center flex-col gap-4 p-6 text-center ${isDarkMode ? 'bg-[#0f0f1a]' : 'bg-[#f1f5f9]'}`}>
        <div className="text-6xl">📝</div>
        <div className={`text-lg font-bold ${isDarkMode ? 'text-[#e2e8f0]' : 'text-[#0f172a]'}`}>
          Tekrarlanacak cümle yok!
        </div>
        <div className={`text-sm ${isDarkMode ? 'text-[#64748b]' : 'text-[#475569]'}`}>
          Ana sayfadan yeni cümle ekleyebilirsin.
        </div>
        <button onClick={onChangeLevel} className="btn btn-primary mt-4">Ana Sayfaya Dön</button>
      </div>
    );
  }

  const currentWord = currentQuestion.en_words;
  const correctAnswer = currentQuestion.sentence_tr;
  const isCorrect = selected === correctAnswer;

  return (
    <div className={`min-h-screen font-sans max-w-md mx-auto px-5 py-6 ${isDarkMode ? 'bg-[#0f0f1a]' : 'bg-[#f1f5f9]'}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={onChangeLevel}
            className={`btn btn-ghost btn-sm btn-square ${isDarkMode ? 'text-[#64748b]' : 'text-[#475569]'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className={`text-sm font-semibold ${isDarkMode ? 'text-[#64748b]' : 'text-[#475569]'}`}>
            Cümle Quiz
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div 
            className="badge badge-sm px-3 py-2 font-bold border"
            style={{ 
              color: levelColor,
              backgroundColor: isDarkMode ? `${levelColor}20` : `${levelColor}15`,
              borderColor: `${levelColor}40`
            }}
          >
            {userLevel}
          </div>
          <span className={`text-xs font-medium ${isDarkMode ? 'text-[#475569]' : 'text-[#94a3b8]'}`}>
            {queueIndex + 1} / {queue.length}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <ProgressBar current={queueIndex} total={queue.length} color={levelColor} />
      </div>

      {/* Question Card */}
      <div 
        onClick={() => handleSpeak(currentQuestion.sentence_en)}
        className={`card rounded-2xl p-8 text-center mb-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group border ${
          isDarkMode 
            ? 'bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border-[#1e293b] hover:border-[#334155]' 
            : 'bg-gradient-to-br from-white to-[#f8fafc] border-[#e2e8f0] hover:border-[#cbd5e1]'
        } ${speaking ? 'ring-2 ring-offset-2' : ''}`}
        style={speaking ? { ringColor: levelColor } : {}}
      >
        <div className={`absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-xs ${
          isDarkMode ? 'text-[#475569]' : 'text-[#94a3b8]'
        }`}>
          🔊 tıkla
        </div>
        <div className={`text-xl font-medium leading-relaxed transition-colors duration-300 ${
          speaking ? 'text-primary' : isDarkMode ? 'text-[#e2e8f0]' : 'text-[#0f172a]'
        }`}>
          "{currentQuestion.sentence_en}"
        </div>
        {speaking && (
          <div className="mt-3 flex justify-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}
      </div>

      {/* Question Label */}
      <div className={`flex items-center gap-2 text-sm font-medium mb-4 ${isDarkMode ? 'text-[#64748b]' : 'text-[#475569]'}`}>
        <span className="w-1 h-4 rounded-full" style={{ backgroundColor: levelColor }} />
        Bu cümlenin Türkçesi nedir?
      </div>

      {/* Options */}
      <div className="flex flex-col gap-3">
        {options.map((opt, i) => {
          const isOptionCorrect = opt === correctAnswer;
          const isOptionSelected = opt === selected;
          return (
            <OptionButton
              key={i}
              index={i}
              label={opt}
              isAnswered={answered}
              isCorrect={isOptionCorrect}
              isSelected={isOptionSelected}
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
          <span className={`text-xs tracking-wider ${isDarkMode ? 'text-[#475569]' : 'text-[#94a3b8]'}`}>
            DOĞRU ŞIKKI SEÇ VE DEVAM ET
          </span>
        </div>
      )}
    </div>
  );
}