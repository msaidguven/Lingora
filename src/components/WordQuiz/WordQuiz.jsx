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
        <div className="text-base-content/50">Yükleniyor...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4 p-6 bg-base-100">
        <div className="text-4xl">⚠️</div>
        <div className="text-error text-sm text-center">{error}</div>
        <button onClick={onChangeLevel} className="btn btn-primary">Geri Dön</button>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4 p-6 text-center bg-base-100">
        <div className="text-5xl">🎉</div>
        <h2 className="text-xl font-extrabold text-base-content">Tebrikler, bitirdiniz!</h2>
        <p className="text-sm text-base-content/50">
          Bu oturumda {queue.length} kelime çalıştınız.
        </p>
        <button onClick={handleRestart} className="btn btn-primary mt-4">
          20 Kelime Daha Çalış
        </button>
        <button onClick={onChangeLevel} className="btn btn-ghost text-base-content/50">
          Ana Sayfaya Dön
        </button>
      </div>
    );
  }

  if (!currentQuestion || queue.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4 p-6 text-center bg-base-100">
        <div className="text-5xl">🎉</div>
        <h3 className="text-lg font-bold text-base-content">Tekrarlanacak kelime yok!</h3>
        <p className="text-sm text-base-content/50">
          Ana sayfadan yeni kelime ekleyebilirsin.
        </p>
        <button onClick={onChangeLevel} className="btn btn-primary mt-4">
          Ana Sayfaya Dön
        </button>
      </div>
    );
  }

  const correctAnswer = currentQuestion.meaning;

  return (
    <div className="min-h-screen bg-base-100 text-base-content font-sans max-w-md mx-auto p-5">
      {/* Progress */}
      <div className="flex justify-between text-[11px] mb-1.5">
        <span className="text-base-content/50">{queueIndex + 1} / {queue.length}</span>
        <span style={{ color: levelColor }} className="font-bold">
          {options.length} şık
        </span>
      </div>
      
      <ProgressBar current={queueIndex} total={queue.length} color={levelColor} />

      {/* Word Card */}
      <div 
        className={`relative rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 hover:scale-[1.02] bg-base-200 border border-base-300 hover:border-base-400 ${answered ? 'opacity-75 cursor-default' : 'hover:shadow-xl'}`}
        onClick={handleCardClick}
        style={{ marginBottom: 18 }}
      >
        {/* Part of Speech */}
        {currentQuestion?.part_of_speech?.length > 0 && (
          <div className="flex justify-center gap-1.5 mb-2.5">
            {currentQuestion.part_of_speech.map(p => (
              <span 
                key={p} 
                className="text-[10px] font-semibold px-2 py-0.5 rounded"
                style={{ 
                  color: '#6366f1', 
                  background: isDark ? '#6366f122' : '#6366f110' 
                }}
              >
                {p}
              </span>
            ))}
          </div>
        )}

        {/* Word */}
        <div className="text-3xl font-extrabold tracking-tight mb-2 leading-tight text-base-content">
          {currentQuestion.word}
        </div>

        {/* Speaking indicator */}
        {speaking && (
          <div className="text-[11px] font-medium text-primary">🔊 Dinleniyor...</div>
        )}

        {/* Menu Button - 3 dots */}
        <div className="absolute top-3 right-3" ref={menuRef}>
          <button
            className={`p-1.5 rounded-lg transition-colors text-base-content/50 hover:text-base-content hover:bg-base-300/50`}
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
            <div className={`absolute right-0 top-full mt-1 w-48 rounded-xl shadow-2xl border p-1 z-50 bg-base-200 border-base-300`}>
              {/* Feedback Button - Everyone can see */}
              <button
                className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-base-300 text-base-content`}
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

              {/* Add Example Button - Admin only */}
              {isAdmin && (
                <button
                  className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-base-300 text-base-content`}
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

              {/* Divider */}
              <div className={`my-1 h-px bg-base-300`} />

              {/* Word info */}
              <div className={`px-3 py-1.5 text-[10px] text-base-content/40`}>
                ID: {currentQuestion.id?.slice(0, 8)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Question */}
      <div className="text-xs font-semibold mb-2.5 text-base-content/50">
        Türkçe anlamı nedir?
      </div>

      {/* Options */}
      <div className="flex flex-col gap-2">
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
        <div className={`mt-3.5 p-3.5 rounded-xl border transition-colors duration-300 ${
          selected === correctAnswer
            ? 'bg-success/20 border-success text-success'
            : 'bg-error/20 border-error text-error'
        }`}>
          <div className="font-bold text-sm mb-3">
            {selected === correctAnswer ? "✓ Doğru!" : `✗ Doğru cevap: "${correctAnswer}"`}
          </div>
          
          <button 
            onClick={onNext} 
            disabled={saving} 
            className="btn btn-primary w-full"
          >
            {saving ? "Kaydediliyor..." : queueIndex + 1 >= queue.length ? "🏁 Bitir" : "Sonraki →"}
          </button>
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