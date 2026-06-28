// pages/SentenceQuiz.jsx
import { useEffect, useState, useRef } from "react";
import { useSentenceQuiz } from "../../hooks/useSentenceQuiz.js";
import { speak } from "../../utils/speechUtils.js";
import { updateDailyStats } from "../../utils/dailyStats.js";
import { useAuth } from '../../contexts/AuthContext.jsx';
import ProgressBar from "../common/ProgressBar.jsx";
import OptionButton from "../common/OptionButton.jsx";
import SentenceResult from "./SentenceResult.jsx";

const LEVEL_COLOR  = { A1: "#10b981", A2: "#3b82f6", B1: "#8b5cf6", B2: "#f59e0b" };
const LEVEL_LABEL  = { A1: "Başlangıç",  A2: "Temel",  B1: "Orta",  B2: "Üst-Orta" };

/* ─── tiny helpers ─────────────────────────────────────────── */
function Spinner({ color }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: `${color}40`, borderTopColor: color }}
      />
      <p className="text-xs font-semibold tracking-[0.2em] text-gray-400 dark:text-gray-500">
        YÜKLENİYOR
      </p>
    </div>
  );
}

function IconBox({ emoji, bg = "bg-gray-100 dark:bg-gray-800" }) {
  return (
    <div className={`w-16 h-16 rounded-2xl ${bg} flex items-center justify-center text-3xl`}>
      {emoji}
    </div>
  );
}
/* ─────────────────────────────────────────────────────────── */

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

  /* reset finish flag when level changes */
  useEffect(() => { setIsFinished(false); }, [userLevel]);

  /* auto-speak new question */
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
        if (user) await updateDailyStats(user.id, 'sentence', isCorrect);
      } catch (err) {
        console.error('İstatistik güncelleme hatası:', err);
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

  /* ── LOADING ─────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <Spinner color={levelColor} />
      </div>
    );
  }

  /* ── ERROR ───────────────────────────────────────────────── */
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 bg-white dark:bg-gray-950">
        <IconBox emoji="⚠️" bg="bg-red-50 dark:bg-red-950/30" />
        <p className="text-sm font-medium text-red-500 dark:text-red-400 text-center">{error}</p>
        <button
          onClick={onChangeLevel}
          className="py-3 px-8 rounded-2xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ backgroundColor: levelColor }}
        >
          Geri Dön
        </button>
      </div>
    );
  }

  /* ── FINISHED ────────────────────────────────────────────── */
  if (isFinished) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-8 p-8 text-center bg-white dark:bg-gray-950">
        <div className="text-6xl">🎉</div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Harika iş!
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Bu oturumda <strong className="text-gray-700 dark:text-gray-300">{queue.length}</strong> cümle tamamladın.
          </p>
        </div>

        {/* level pill */}
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border"
          style={{
            borderColor: `${levelColor}25`,
            backgroundColor: `${levelColor}0d`,
          }}
        >
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: levelColor }} />
          <span className="text-sm font-semibold" style={{ color: levelColor }}>
            {userLevel} — {levelLabel}
          </span>
        </div>

        {/* actions */}
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
            className="py-3 rounded-2xl text-sm font-medium text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  /* ── EMPTY ───────────────────────────────────────────────── */
  if (!currentQuestion || queue.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 text-center bg-white dark:bg-gray-950">
        <IconBox emoji="📝" />
        <div className="space-y-1.5">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Tekrarlanacak cümle yok
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Ana sayfadan yeni cümle ekleyebilirsin.
          </p>
        </div>
        <button
          onClick={onChangeLevel}
          className="py-3 px-8 rounded-2xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ backgroundColor: levelColor }}
        >
          Ana Sayfaya Dön
        </button>
      </div>
    );
  }

  /* ── QUIZ ────────────────────────────────────────────────── */
  const correctAnswer = currentQuestion.sentence_tr;
  const currentWord   = currentQuestion.en_words;
  const isCorrect     = selected === correctAnswer;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 font-sans max-w-md mx-auto px-5 py-6 flex flex-col">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">

        {/* back button */}
        <button
          onClick={onChangeLevel}
          aria-label="Geri dön"
          className="w-9 h-9 flex items-center justify-center rounded-xl
                     text-gray-400 dark:text-gray-500
                     hover:text-gray-700 dark:hover:text-gray-200
                     hover:bg-gray-100 dark:hover:bg-gray-800
                     transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* right meta */}
        <div className="flex items-center gap-3">
          <span
            className="text-xs font-bold px-3 py-1 rounded-full"
            style={{ color: levelColor, backgroundColor: `${levelColor}15` }}
          >
            {userLevel}
          </span>
          <span className="text-xs font-medium text-gray-400 dark:text-gray-500 tabular-nums">
            {queueIndex + 1} / {queue.length}
          </span>
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div className="mb-7">
        <ProgressBar current={queueIndex} total={queue.length} color={levelColor} />
      </div>

      {/* ── Question card ── */}
      <button
        type="button"
        onClick={() => handleSpeak(currentQuestion.sentence_en)}
        className={[
          "relative w-full text-left rounded-2xl p-7 mb-6 cursor-pointer",
          "transition-all duration-200 select-none group",
          "border",
          speaking
            ? "border-transparent"
            : "border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700",
          "bg-gray-50 dark:bg-gray-900",
          "active:scale-[0.99]",
        ].join(" ")}
        style={speaking ? {
          borderColor: `${levelColor}50`,
          backgroundColor: `${levelColor}08`,
        } : {}}
      >
        {/* sound icon — always visible on hover, coloured when speaking */}
        <div
          className={`absolute top-3.5 right-3.5 transition-opacity duration-200 ${
            speaking ? "opacity-100" : "opacity-0 group-hover:opacity-60"
          }`}
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            style={{ color: speaking ? levelColor : "#9ca3af" }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"
            />
          </svg>
        </div>

        {/* sentence */}
        <p
          className="text-center text-lg font-medium leading-relaxed transition-colors duration-200"
          style={{ color: speaking ? levelColor : undefined }}
        >
          {!speaking && (
            <span className="text-gray-900 dark:text-gray-100">
              "{currentQuestion.sentence_en}"
            </span>
          )}
          {speaking && `"${currentQuestion.sentence_en}"`}
        </p>

        {/* speaking dots */}
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
          <p className="mt-3 text-center text-[11px] font-semibold tracking-[0.2em] text-gray-300 dark:text-gray-700">
            SESLENDIR
          </p>
        )}
      </button>

      {/* ── Section label ── */}
      <div className="flex items-center gap-2 mb-4">
        <span
          className="w-1 h-3.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: levelColor }}
        />
        <span className="text-[11px] font-bold tracking-[0.12em] text-gray-400 dark:text-gray-500 uppercase">
          Bu cümlenin Türkçesi nedir?
        </span>
      </div>

      {/* ── Options ── */}
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

      {/* ── Result panel ── */}
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

      {/* ── Bottom hint ── */}
      {!answered && !saving && (
        <div className="mt-8 text-center pb-1">
          <span className="text-[10px] tracking-[0.22em] font-semibold text-gray-200 dark:text-gray-800">
            DOĞRU ŞIKKI SEÇ
          </span>
        </div>
      )}
    </div>
  );
}