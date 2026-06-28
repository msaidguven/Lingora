// pages/SentenceQuiz.jsx
import { useEffect, useState, useRef } from "react";
import { useSentenceQuiz } from "../../hooks/useSentenceQuiz.js";
import { speak } from "../../utils/speechUtils.js";
import { updateDailyStats } from "../../utils/dailyStats.js";
import { useAuth } from "../../contexts/AuthContext.jsx";
import ProgressBar from "../common/ProgressBar.jsx";
import OptionButton from "../common/OptionButton.jsx";
import SentenceResult from "./SentenceResult.jsx";

const LEVEL_COLOR = { A1: "#10b981", A2: "#3b82f6", B1: "#8b5cf6", B2: "#f59e0b" };
const LEVEL_LABEL = { A1: "Başlangıç", A2: "Temel", B1: "Orta", B2: "Üst-Orta" };

export default function SentenceQuiz({ userLevel, onChangeLevel, isDarkMode = true }) {
  const { user } = useAuth();
  const isUpdatingRef = useRef(false);

  const {
    loading, error,
    currentQuestion, options, selected, answered, saving,
    queue, queueIndex,
    handleSelect, handleNext, restartQuizSession,
  } = useSentenceQuiz(userLevel);

  const [speaking,   setSpeaking]   = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const levelColor = LEVEL_COLOR[userLevel];
  const levelLabel = LEVEL_LABEL[userLevel];

  useEffect(() => { setIsFinished(false); }, [userLevel]);

  useEffect(() => {
    if (currentQuestion && !answered && !saving) {
      const t = setTimeout(() => speak(currentQuestion.sentence_en), 100);
      return () => clearTimeout(t);
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
        if (user) await updateDailyStats(user.id, "sentence", isCorrect);
      } catch (err) {
        console.error("İstatistik güncelleme hatası:", err);
      }
    });
    isUpdatingRef.current = false;
  };

  const onNext = () => {
    if (handleNext() === null) setIsFinished(true);
  };

  const handleRestart = () => {
    setIsFinished(false);
    restartQuizSession();
  };

  /* ── LOADING ── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: `${levelColor}30`, borderTopColor: levelColor }}
          />
          <p className="text-xs font-semibold tracking-[0.2em] text-base-content/40">
            YÜKLENİYOR
          </p>
        </div>
      </div>
    );
  }

  /* ── ERROR ── */
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 bg-base-100">
        <div className="w-14 h-14 rounded-2xl bg-error/10 flex items-center justify-center text-2xl">
          ⚠️
        </div>
        <p className="text-sm font-medium text-error text-center">{error}</p>
        <button
          onClick={onChangeLevel}
          className="py-3 px-8 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ backgroundColor: levelColor }}
        >
          Geri Dön
        </button>
      </div>
    );
  }

  /* ── FINISHED ── */
  if (isFinished) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-8 p-8 text-center bg-base-100">
        <div className="text-6xl">🎉</div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-base-content">Harika iş!</h2>
          <p className="text-sm text-base-content/50">
            Bu oturumda{" "}
            <span className="font-bold text-base-content/80">{queue.length}</span>{" "}
            cümle tamamladın.
          </p>
        </div>

        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border"
          style={{ borderColor: `${levelColor}25`, backgroundColor: `${levelColor}0d` }}
        >
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: levelColor }} />
          <span className="text-sm font-semibold" style={{ color: levelColor }}>
            {userLevel} — {levelLabel}
          </span>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={handleRestart}
            className="py-3.5 rounded-2xl text-white text-sm font-bold tracking-wide transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ backgroundColor: levelColor }}
          >
            20 Cümle Daha Çalış
          </button>
          <button
            onClick={onChangeLevel}
            className="py-3 rounded-2xl text-sm font-medium text-base-content/40 hover:text-base-content transition-colors"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  /* ── EMPTY ── */
  if (!currentQuestion || queue.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 text-center bg-base-100">
        <div className="w-16 h-16 rounded-2xl bg-base-200 flex items-center justify-center text-3xl">
          📝
        </div>
        <div className="space-y-1.5">
          <h3 className="text-lg font-semibold text-base-content">
            Tekrarlanacak cümle yok
          </h3>
          <p className="text-sm text-base-content/50">
            Ana sayfadan yeni cümle ekleyebilirsin.
          </p>
        </div>
        <button
          onClick={onChangeLevel}
          className="py-3 px-8 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ backgroundColor: levelColor }}
        >
          Ana Sayfaya Dön
        </button>
      </div>
    );
  }

  /* ── QUIZ ── */
  const correctAnswer = currentQuestion.sentence_tr;
  const currentWord   = currentQuestion.en_words;
  const isCorrect     = selected === correctAnswer;

  return (
    <div className="min-h-screen bg-base-100 text-base-content font-sans max-w-md mx-auto px-5 py-6 flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onChangeLevel}
          aria-label="Geri dön"
          className="w-9 h-9 flex items-center justify-center rounded-xl
                     text-base-content/40 hover:text-base-content
                     hover:bg-base-200 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex items-center gap-3">
          <span
            className="text-xs font-bold px-3 py-1 rounded-full"
            style={{ color: levelColor, backgroundColor: `${levelColor}15` }}
          >
            {userLevel}
          </span>
          <span className="text-xs font-medium text-base-content/30 tabular-nums">
            {queueIndex + 1} / {queue.length}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-7">
        <ProgressBar current={queueIndex} total={queue.length} color={levelColor} />
      </div>

      {/* Question Card */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => handleSpeak(currentQuestion.sentence_en)}
        onKeyDown={(e) => e.key === "Enter" && handleSpeak(currentQuestion.sentence_en)}
        className="relative rounded-2xl p-7 text-center mb-6 cursor-pointer
                   transition-all duration-200 select-none group
                   border border-base-300 bg-base-200
                   hover:border-base-content/10 active:scale-[0.99]"
        style={
          speaking
            ? { borderColor: `${levelColor}45`, backgroundColor: `${levelColor}08` }
            : {}
        }
      >
        {/* Sound icon top-right */}
        <div
          className={`absolute top-3.5 right-3.5 transition-opacity duration-200 ${
            speaking ? "opacity-100" : "opacity-0 group-hover:opacity-50"
          }`}
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            style={{ color: speaking ? levelColor : "currentColor" }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"
            />
          </svg>
        </div>

        {/* Sentence */}
        <p
          className="text-lg font-medium leading-relaxed transition-colors duration-200 text-base-content"
          style={speaking ? { color: levelColor } : {}}
        >
          "{currentQuestion.sentence_en}"
        </p>

        {/* Speaking dots */}
        {speaking ? (
          <div className="mt-4 flex justify-center gap-1.5">
            {[0, 150, 300].map((delay) => (
              <span
                key={delay}
                className="w-1.5 h-1.5 rounded-full animate-bounce"
                style={{ backgroundColor: levelColor, animationDelay: `${delay}ms` }}
              />
            ))}
          </div>
        ) : (
          <p className="mt-3 text-[11px] font-semibold tracking-[0.2em] text-base-content/20">
            SESLENDIR
          </p>
        )}
      </div>

      {/* Section label */}
      <div className="flex items-center gap-2 mb-4">
        <span
          className="w-1 h-3.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: levelColor }}
        />
        <span className="text-[11px] font-bold tracking-[0.12em] text-base-content/40 uppercase">
          Bu cümlenin Türkçesi nedir?
        </span>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-2.5">
        {options.map((opt, i) => (
          <OptionButton
            key={i}
            index={i}
            label={opt}
            isAnswered={answered}
            isCorrect={opt === correctAnswer}
            isSelected={opt === selected}
            onClick={() => onSelect(opt)}
            disabled={answered || saving}
            isDark={isDarkMode}
          />
        ))}
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

      {/* Bottom hint */}
      {!answered && !saving && (
        <div className="mt-8 text-center pb-1">
          <span className="text-[10px] tracking-[0.22em] font-semibold text-base-content/15">
            DOĞRU ŞIKKI SEÇ
          </span>
        </div>
      )}
    </div>
  );
}