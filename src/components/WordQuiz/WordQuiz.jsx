// WordQuiz.jsx
import { useEffect, useState, useRef } from "react";
import { useWordQuiz } from "../../hooks/useWordQuiz.js";
import { speak } from "../../utils/speechUtils.js";
import { updateDailyStats } from "../../utils/dailyStats.js";
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import ProgressBar from "../common/ProgressBar.jsx";
import OptionButton from "../common/OptionButton.jsx";
import ExampleModal from "./ExampleModal.jsx";
import FeedbackModal from "./FeedbackModal.jsx";

const LEVEL_COLOR = { A1: "#10b981", A2: "#3b82f6", B1: "#8b5cf6", B2: "#f59e0b" };

export default function WordQuiz({ userLevel, onChangeLevel }) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const isUpdatingRef = useRef(false);

  const isAdmin = user?.role === 'admin';

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
    examplesMap,
    handleSelect,
    handleNext,
    restartQuizSession,
    setExamplesMap
  } = useWordQuiz(userLevel);

  const [showExampleModal, setShowExampleModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedWordForExample, setSelectedWordForExample] = useState(null);
  const [selectedWordForFeedback, setSelectedWordForFeedback] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const levelColor = LEVEL_COLOR[userLevel];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setIsFinished(false);
  }, [userLevel]);

  const handleCardClick = () => {
    if (currentQuestion && !answered) {
      setSpeaking(true);
      speak(currentQuestion.word);
      setTimeout(() => {
        setSpeaking(false);
      }, 1800);
    }
  };

  const onSelect = async (opt) => {
    if (answered || saving || isUpdatingRef.current) return;
    
    isUpdatingRef.current = true;

    await handleSelect(opt, async (isCorrect) => {
      try {
        if (user) {
          await updateDailyStats(user.id, 'word', isCorrect);
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
    setShowExampleModal(false);
    setShowFeedbackModal(false);
    setSelectedWordForExample(null);
    setSelectedWordForFeedback(null);
    restartQuizSession();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <div className="text-base-content/50 font-medium tracking-wider">Yükleniyor...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-6 p-6 bg-base-100">
        <div className="text-5xl">⚠️</div>
        <div className="text-error text-sm text-center font-medium">{error}</div>
        <button onClick={onChangeLevel} className="btn btn-primary btn-md px-8 rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
          Geri Dön
        </button>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-6 p-8 text-center bg-gradient-to-b from-base-100 to-base-200">
        <div className="relative">
          <div className="absolute inset-0 blur-2xl bg-primary/20 rounded-full animate-pulse" />
          <div className="relative text-6xl">🎉</div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Tebrikler!
          </h2>
          <p className="text-base-content/60 text-sm font-medium">
            Bu oturumda {queue.length} kelime çalıştınız.
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs mt-2">
          <button 
            onClick={handleRestart} 
            className="btn btn-primary btn-lg rounded-full shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all hover:scale-105 font-semibold"
          >
            20 Kelime Daha Çalış
          </button>
          <button 
            onClick={onChangeLevel} 
            className="btn btn-ghost rounded-full text-base-content/50 hover:text-base-content transition-all"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestion || queue.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-6 p-8 text-center bg-base-100">
        <div className="text-6xl">📝</div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-base-content">Tekrarlanacak kelime yok!</h3>
          <p className="text-sm text-base-content/50 font-medium">
            Ana sayfadan yeni kelime ekleyebilirsin.
          </p>
        </div>
        <button 
          onClick={onChangeLevel} 
          className="btn btn-primary btn-md px-8 rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
        >
          Ana Sayfaya Dön
        </button>
      </div>
    );
  }

  const correctAnswer = currentQuestion.meaning;

  return (
    <div className="min-h-screen bg-gradient-to-b from-base-100 to-base-200/50 text-base-content font-sans max-w-md mx-auto px-5 py-6">
      {/* Progress */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-semibold text-base-content/40 tracking-wider">
          {queueIndex + 1} / {queue.length}
        </span>
        <span style={{ color: levelColor }} className="text-xs font-bold">
          {options.length} şık
        </span>
      </div>
      
      <ProgressBar current={queueIndex} total={queue.length} color={levelColor} />

      {/* Word Card */}
      <div 
        className={`relative rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 bg-base-100 border border-base-200 shadow-lg hover:shadow-xl ${answered ? 'opacity-75 cursor-default' : 'hover:scale-[1.02] hover:border-primary/20'}`}
        onClick={handleCardClick}
        style={{ marginTop: 20, marginBottom: 20 }}
      >
        {/* Part of Speech */}
        {currentQuestion?.part_of_speech?.length > 0 && (
          <div className="flex justify-center gap-2 mb-3">
            {currentQuestion.part_of_speech.map(p => (
              <span 
                key={p} 
                className="text-[10px] font-semibold px-3 py-1 rounded-full"
                style={{ 
                  color: '#6366f1', 
                  background: isDark ? '#6366f122' : '#6366f110',
                  border: `1px solid ${isDark ? '#6366f133' : '#6366f120'}`
                }}
              >
                {p}
              </span>
            ))}
          </div>
        )}

        {/* Word */}
        <div className="text-4xl font-extrabold tracking-tight mb-2 leading-tight text-base-content">
          {currentQuestion.word}
        </div>

        {/* Speaking indicator */}
        {speaking && (
          <div className="mt-2 flex items-center justify-center gap-2 text-xs font-medium text-primary">
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
            Dinleniyor...
          </div>
        )}

        {/* Menu Button - 3 dots */}
        <div className="absolute top-3 right-3" ref={menuRef}>
          <button
            className={`p-2 rounded-xl transition-all duration-200 text-base-content/30 hover:text-base-content hover:bg-base-200/80`}
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            aria-label="İşlemler"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {menuOpen && (
            <div className={`absolute right-0 top-full mt-1.5 w-52 rounded-2xl shadow-2xl border p-1.5 z-50 bg-base-100 border-base-200`}>
              <button
                className={`flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-base-200 text-base-content`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedWordForFeedback(currentQuestion);
                  setShowFeedbackModal(true);
                  setMenuOpen(false);
                }}
              >
                <span className="text-base">💬</span>
                Geri Bildirim
              </button>

              {isAdmin && (
                <button
                  className={`flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-base-200 text-base-content`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedWordForExample(currentQuestion);
                    setShowExampleModal(true);
                    setMenuOpen(false);
                  }}
                >
                  <span className="text-base">✏️</span>
                  Cümle Ekle
                </button>
              )}

              <div className={`my-1.5 h-px bg-base-200`} />

              <div className={`px-3.5 py-1.5 text-[10px] font-mono text-base-content/30`}>
                ID: {currentQuestion.id?.slice(0, 8)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Question */}
      <div className="flex items-center gap-2 text-xs font-semibold mb-3 text-base-content/40 tracking-wider">
        <span className="w-1 h-3 rounded-full bg-primary/60" />
        Türkçe anlamı nedir?
      </div>

      {/* Options */}
      <div className="flex flex-col gap-2.5">
        {options.map((opt, i) => {
          const isCorrect = opt === correctAnswer;
          const isSelected = opt === selected;
          return (
            <OptionButton
              key={i}
              index={i}
              label={opt}
              isAnswered={answered}
              isCorrect={isCorrect}
              isSelected={isSelected}
              onClick={() => onSelect(opt)}
              disabled={answered || saving}
              isDark={isDark}
            />
          );
        })}
      </div>

      {/* Answer Feedback */}
      {answered && (
        <div className={`mt-4 p-4 rounded-2xl border-2 transition-all duration-300 ${
          selected === correctAnswer
            ? 'bg-success/10 border-success/40 text-success'
            : 'bg-error/10 border-error/40 text-error'
        }`}>
          <div className="flex items-center gap-2 font-bold text-sm mb-3">
            <span className="text-lg">
              {selected === correctAnswer ? '✅' : '❌'}
            </span>
            {selected === correctAnswer ? "Doğru!" : `Doğru cevap: "${correctAnswer}"`}
          </div>
          
          <button 
            onClick={onNext} 
            disabled={saving} 
            className="btn btn-primary w-full rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="loading loading-spinner loading-xs" />
                Kaydediliyor...
              </span>
            ) : queueIndex + 1 >= queue.length ? (
              "🏁 Bitir"
            ) : (
              "Sonraki →"
            )}
          </button>
        </div>
      )}

      {/* Bottom Info */}
      {!answered && !saving && (
        <div className="mt-6 text-center">
          <span className="text-[10px] tracking-[0.15em] text-base-content/20 font-medium">
            DOĞRU ŞIKKI SEÇ VE DEVAM ET
          </span>
        </div>
      )}

      {/* Modals */}
      {showExampleModal && selectedWordForExample && (
        <ExampleModal
          word={selectedWordForExample}
          onClose={() => {
            setShowExampleModal(false);
            setSelectedWordForExample(null);
          }}
          onSuccess={() => {
            setShowExampleModal(false);
            setSelectedWordForExample(null);
          }}
          examplesMap={examplesMap}
          setExamplesMap={setExamplesMap}
        />
      )}

      {showFeedbackModal && selectedWordForFeedback && (
        <FeedbackModal
          word={selectedWordForFeedback}
          onClose={() => {
            setShowFeedbackModal(false);
            setSelectedWordForFeedback(null);
          }}
          user={user}
        />
      )}
    </div>
  );
}