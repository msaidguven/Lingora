// pages/SentenceQuiz.jsx
import { useEffect, useState, useRef, useMemo } from "react";
import { useSentenceQuiz } from "../../hooks/useSentenceQuiz.js";
import { speak } from "../../utils/speechUtils.js";
import { updateDailyStats } from "../../utils/dailyStats.js";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import ProgressBar from "../common/ProgressBar.jsx";
import SentenceResult from "./SentenceResult.jsx";
import { supabase } from "../../config.js";
import Toast from "../common/Toast.jsx";

const LEVEL_COLOR = { A1: "#10b981", A2: "#3b82f6", B1: "#8b5cf6", B2: "#f59e0b", C1: "#a855f7" };
const LEVEL_LABEL = { A1: "Başlangıç", A2: "Temel", B1: "Orta", B2: "Üst-Orta", C1: "İleri" };

// Coin sesi
const playCoinSound = () => {
  try {
    const audio = new Audio('/sounds/coin.mp3');
    audio.volume = 0.5;
    audio.play().catch(err => console.log('Ses çalınamadı:', err));
  } catch (error) {
    console.log('Ses hatası:', error);
  }
};

// Tarayıcının bekleyen/oynayan konuşma sentezini güvenli şekilde iptal eder.
const cancelPendingSpeech = () => {
  try {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  } catch (e) {
    // no-op
  }
};

export default function SentenceQuiz({ userLevel, onChangeLevel }) {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  const { user } = useAuth();
  const isUpdatingRef = useRef(false);
  const lastSpokenIdRef = useRef(null);

  const {
    loading, error,
    currentQuestion, options, selected, answered, saving,
    queue, queueIndex,
    handleSelect, handleNext, restartQuizSession,
  } = useSentenceQuiz(userLevel);

  const [speaking, setSpeaking] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [revealed, setRevealed] = useState(false);

  // Yeni state'ler
  const [showTranslationModal, setShowTranslationModal] = useState(false);
  const [translation, setTranslation] = useState('');
  const [translating, setTranslating] = useState(false);
  const [wordTranslation, setWordTranslation] = useState('');
  const [selectedWord, setSelectedWord] = useState('');
  const [showWordModal, setShowWordModal] = useState(false);

  const levelColor = LEVEL_COLOR[userLevel] || "#8b5cf6";
  const levelLabel = LEVEL_LABEL[userLevel] || "Orta";

  // Cümleyi kelimelere ayırma (noktalama işaretlerini koruyarak)
  const splitSentenceIntoWords = (sentence) => {
    if (!sentence) return [];
    // Kelimeleri ve noktalama işaretlerini ayır
    const parts = sentence.match(/[\w']+|[.,!?;:]/g);
    return parts || [];
  };

  // Kelime listesini oluştur
  const wordParts = useMemo(() => {
    if (!currentQuestion?.sentence_en) return [];
    return splitSentenceIntoWords(currentQuestion.sentence_en);
  }, [currentQuestion]);

  // Tek kelime çevirisi
  const translateWord = async (word) => {
    if (!word || word.trim().length === 0 || translating) return;

    // Noktalama işaretlerini kontrol et
    if (/^[.,!?;:]$/.test(word)) return;

    setSelectedWord(word);
    setTranslating(true);
    setWordTranslation('');

    try {
      const response = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=tr&dt=t&q=${encodeURIComponent(word.trim())}`
      );
      const data = await response.json();
      if (data && data[0]) {
        const translated = data[0].map(item => item[0]).join('');
        setWordTranslation(translated);
        setShowWordModal(true);
      } else {
        setWordTranslation('Çeviri bulunamadı');
        setShowWordModal(true);
      }
    } catch (error) {
      console.error('Kelime çeviri hatası:', error);
      setWordTranslation('Çeviri yüklenemedi');
      setShowWordModal(true);
    } finally {
      setTranslating(false);
    }
  };

  // Kelimeye tıklama handler'ı
  const handleWordClick = (word, e) => {
    e.stopPropagation(); // Kart tıklamasını engelle
    translateWord(word);
  };

  // Google Translate API ile çeviri
  const translateText = async (text) => {
    if (translating) return;

    setTranslating(true);
    setTranslation('');

    try {
      const response = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=tr&dt=t&q=${encodeURIComponent(text)}`
      );
      const data = await response.json();
      if (data && data[0]) {
        const translated = data[0].map(item => item[0]).join('');
        setTranslation(translated);
      } else {
        setTranslation('Çeviri bulunamadı');
      }
    } catch (error) {
      console.error('Çeviri hatası:', error);
      setTranslation('Çeviri yüklenemedi');
    } finally {
      setTranslating(false);
    }
  };

  // Modal açıldığında otomatik çeviri yap
  useEffect(() => {
    if (showTranslationModal && currentQuestion) {
      translateText(currentQuestion.sentence_en);
    }
  }, [showTranslationModal, currentQuestion]);

  // Google Translate'i yeni pencerede aç
  const openGoogleTranslate = (text) => {
    const encodedText = encodeURIComponent(text);
    const url = `https://translate.google.com/?sl=en&tl=tr&text=${encodedText}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Ortak telaffuz oynatma fonksiyonu
  const playPronunciation = (text, event) => {
    if (event) {
      event.stopPropagation();
    }
    if (speaking || !text) return;
    cancelPendingSpeech();
    setSpeaking(true);
    speak(text);
    setTimeout(() => setSpeaking(false), 1800);
  };

  // Kopyalama fonksiyonu
  const copyToClipboard = (text, event) => {
    if (event) {
      event.stopPropagation();
    }
    navigator.clipboard.writeText(text).then(() => {
      window.dispatchEvent(new CustomEvent('showToast', {
        detail: {
          message: '📋 Kopyalandı!',
          type: 'success'
        }
      }));
    }).catch(err => {
      console.error('Kopyalama hatası:', err);
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      window.dispatchEvent(new CustomEvent('showToast', {
        detail: {
          message: '📋 Kopyalandı!',
          type: 'success'
        }
      }));
    });
  };

  // Google Translate modal'ını açma
  const openTranslationModal = (event) => {
    if (event) {
      event.stopPropagation();
    }
    setShowTranslationModal(true);
  };

  useEffect(() => {
    setIsFinished(false);
  }, [userLevel]);

  useEffect(() => {
    if (currentQuestion) {
      setRevealed(false);
    }
  }, [currentQuestion]);

  useEffect(() => {
    if (
      !loading &&
      currentQuestion &&
      !answered &&
      !saving &&
      !speaking &&
      lastSpokenIdRef.current !== currentQuestion.id
    ) {
      lastSpokenIdRef.current = currentQuestion.id;
      playPronunciation(currentQuestion.sentence_en);
    }
  }, [currentQuestion, answered, saving, loading]);

  // onSelect
  const onSelect = (opt) => {
    if (answered || saving || isUpdatingRef.current) return;

    isUpdatingRef.current = true;

    const isCorrect = opt === currentQuestion.sentence_tr;
    const correctAnswer = currentQuestion.sentence_tr;

    handleSelect(opt, (isCorrectResult) => { });

    if (isCorrect) {
      window.dispatchEvent(new CustomEvent('showToast', {
        detail: {
          message: '✅ Doğru cevap! +1 coin kazandın!',
          type: 'success'
        }
      }));
      playCoinSound();
    } else {
      window.dispatchEvent(new CustomEvent('showToast', {
        detail: {
          message: `❌ Yanlış cevap. Doğrusu: "${correctAnswer}"`,
          type: 'error'
        }
      }));
    }

    (async () => {
      try {
        if (user) {
          await updateDailyStats(user.id, "sentence", isCorrect);
          if (isCorrect) {
            const { data: currentUser } = await supabase
              .from("en_users")
              .select("coins")
              .eq("id", user.id)
              .single();
            const newCoins = (currentUser?.coins || 0) + 1;
            await supabase
              .from("en_users")
              .update({ coins: newCoins })
              .eq("id", user.id);
            window.dispatchEvent(new CustomEvent('coinUpdated', {
              detail: { coins: newCoins }
            }));
          }
        }
      } catch (error) {
        console.error('İstatistik güncelleme hatası:', error);
      }
    })();

    isUpdatingRef.current = false;
  };

  const onNext = () => {
    if (handleNext() === null) {
      setIsFinished(true);
    } else {
      setRevealed(false);
    }
  };

  const handleRestart = () => {
    cancelPendingSpeech();
    setSpeaking(false);
    setIsFinished(false);
    setRevealed(false);
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
  const currentWord = {
    word: currentQuestion.sentence_en?.split(' ')[0] || 'Cümle',
    meaning: currentQuestion.sentence_tr,
    level: currentQuestion.level || 'A1'
  };
  const isCorrect = selected === correctAnswer;

  const handleCardClick = () => {
    if (currentQuestion && !speaking) {
      playPronunciation(currentQuestion.sentence_en);
    }
  };

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
      {revealed ? (
        <div
          className="relative rounded-2xl p-7 text-center mb-6
                     transition-all duration-200 select-none group cursor-pointer
                     border border-base-300 bg-base-200
                     hover:border-base-content/10 hover:scale-[1.02] active:scale-[0.99]"
          style={speaking ? { borderColor: `${levelColor}45`, backgroundColor: `${levelColor}08` } : {}}
          onClick={() => !speaking && playPronunciation(currentQuestion.sentence_en)}
          role="button"
          tabIndex={0}
          aria-label="Cümlenin telaffuzunu dinle"
          onKeyDown={(e) => e.key === "Enter" && !speaking && playPronunciation(currentQuestion.sentence_en)}
        >
          {/* Sağ üst: Kopyala butonu */}
          <button
            onClick={(e) => copyToClipboard(currentQuestion.sentence_en, e)}
            className="absolute top-3 right-3 p-1.5 rounded-lg 
                       text-base-content/40 hover:text-base-content/80 
                       hover:bg-base-300/50 transition-all duration-200
                       bg-base-200/80 backdrop-blur-sm
                       z-10"
            aria-label="Cümleyi kopyala"
            title="Cümleyi kopyala"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
          </button>

          {/* Sol alt: Google Translate butonu */}
          <button
            onClick={(e) => openTranslationModal(e)}
            className="absolute bottom-3 left-3 p-1.5 rounded-lg 
                       text-base-content/40 hover:text-blue-500 
                       hover:bg-blue-50/50 transition-all duration-200
                       bg-base-200/80 backdrop-blur-sm
                       dark:hover:bg-blue-900/20
                       z-10"
            aria-label="Google Translate'de aç"
            title="Google Translate'de aç"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
          </button>

          {/* Kelime tıklama ipucu */}
          <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <span className="text-[10px] font-medium text-base-content/20 bg-base-300/50 px-2 py-0.5 rounded-full">
              Kelimeye tıkla
            </span>
          </div>

          {/* Cümle içeriği - Her kelime ayrı ayrı tıklanabilir */}
          <div className="flex flex-wrap items-center justify-center gap-0.5">
            {wordParts.map((part, index) => {
              // Noktalama işaretleri mi kontrol et
              const isPunctuation = /^[.,!?;:]$/.test(part);

              if (isPunctuation) {
                return (
                  <span
                    key={index}
                    className="text-lg font-medium leading-relaxed text-base-content select-text"
                    style={speaking ? { color: levelColor } : {}}
                  >
                    {part}
                  </span>
                );
              }

              return (
                <span
                  key={index}
                  onClick={(e) => handleWordClick(part, e)}
                  className="text-lg font-medium leading-relaxed text-base-content select-text
                             hover:text-blue-500 dark:hover:text-blue-400
                             hover:bg-blue-50/50 dark:hover:bg-blue-900/20
                             cursor-pointer transition-all duration-200
                             px-1 rounded-lg"
                  style={speaking ? { color: levelColor } : {}}
                  title={`"${part}" kelimesinin çevirisine bak`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && handleWordClick(part, e)}
                >
                  {part}
                </span>
              );
            })}
          </div>

          {/* Seslendirme göstergesi */}
          <div className="mt-4 flex items-center justify-center gap-3">
            {speaking && (
              <div className="flex items-center gap-1.5">
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ backgroundColor: levelColor, animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div
          className="relative rounded-2xl p-7 text-center mb-6 cursor-pointer
                     border border-base-300 bg-base-200
                     hover:border-base-content/10 hover:scale-[1.02] active:scale-[0.99]"
          onClick={handleCardClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && handleCardClick()}
        >
          <div className="flex flex-col items-center gap-4 py-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${levelColor}15` }}
            >
              <svg
                className="w-7 h-7"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                style={{ color: levelColor }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"
                />
              </svg>
            </div>

            <div className="text-xs font-semibold text-base-content/40 tracking-wider">
              Önce cümleyi dinle
            </div>

            {speaking ? (
              <div className="flex items-center justify-center gap-1.5">
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ backgroundColor: levelColor, animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            ) : null}

            <button
              onClick={(e) => {
                e.stopPropagation();
                setRevealed(true);
              }}
              className="py-3 px-8 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] mt-1"
              style={{ backgroundColor: levelColor }}
            >
              Göster
            </button>
          </div>
        </div>
      )}

      {revealed && (
        <>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: levelColor }} />
            <span className="text-[11px] font-bold tracking-[0.12em] text-base-content/40 uppercase">
              Bu cümlenin Türkçesi nedir?
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {options.map((opt, i) => {
              const isCorrectOpt = opt === correctAnswer;
              const isSelectedOpt = opt === selected;

              let buttonStyle = "bg-base-200 border-base-300 hover:border-primary/30 text-base-content";
              if (answered && isCorrectOpt) {
                buttonStyle = "bg-success/10 border-success/40 text-success";
              } else if (answered && isSelectedOpt && !isCorrectOpt) {
                buttonStyle = "bg-error/10 border-error/40 text-error";
              } else if (isSelectedOpt && !answered) {
                buttonStyle = "bg-primary/10 border-primary/40 text-primary";
              }

              return (
                <button
                  key={i}
                  onClick={() => onSelect(opt)}
                  disabled={answered || saving}
                  className={`w-full py-3.5 px-5 rounded-xl border-2 text-sm font-medium transition-all duration-200 text-left ${buttonStyle} ${!answered && !saving ? 'hover:scale-[1.02] active:scale-[0.98]' : ''
                    }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Result */}
      {answered && (
        <div className="mt-6">
          <SentenceResult
            isCorrect={isCorrect}
            correctAnswer={correctAnswer}
            selectedAnswer={selected}
            currentWord={currentWord}
            onNext={onNext}
            onSpeak={playPronunciation}
            isSaving={saving}
            isLastQuestion={queueIndex + 1 >= queue.length}
            isDarkMode={isDarkMode}
          />
        </div>
      )}

      {/* Bottom hint */}
      {revealed && !answered && !saving && (
        <div className="mt-8 text-center pb-1">
          <span className="text-[10px] tracking-[0.22em] font-semibold text-base-content/15">
            BİR KART SEÇ
          </span>
        </div>
      )}

      {/* Google Translate Modal - TAM DARK MODE DESTEĞİ */}
      {showTranslationModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowTranslationModal(false)}
        >
          <div
            className="relative w-full max-w-2xl bg-base-100 rounded-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-base-300 bg-base-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-base-content">
                    Türkçe Çeviri
                  </h3>
                  <p className="text-xs text-base-content/50 truncate max-w-[180px]">
                    {currentQuestion.sentence_en}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => openGoogleTranslate(currentQuestion.sentence_en)}
                  className="p-1.5 rounded-lg hover:bg-base-200 transition-colors text-base-content/40 hover:text-blue-500"
                  aria-label="Google Translate'de aç"
                  title="Google Translate web sitesinde aç"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
                <button
                  onClick={() => setShowTranslationModal(false)}
                  className="p-1.5 rounded-lg hover:bg-base-200 transition-colors text-base-content/50 hover:text-base-content"
                  aria-label="Kapat"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content - daisyUI tema token'ları ile tam dark mode desteği */}
            <div className="p-6 min-h-[200px] flex flex-col items-center justify-center bg-base-200">
              {translating ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${levelColor}30`, borderTopColor: levelColor }} />
                  <p className="text-sm text-base-content/60">Çeviri yapılıyor...</p>
                </div>
              ) : translation ? (
                <div className="w-full">
                  <div className="mb-2 text-xs font-semibold text-base-content/40 uppercase tracking-wider">
                    🇹🇷 Türkçe Çeviri
                  </div>
                  <p className="text-xl font-medium text-base-content text-center leading-relaxed">
                    {translation}
                  </p>
                  <div className="mt-4 flex justify-center gap-3 flex-wrap">
                    <button
                      onClick={() => copyToClipboard(translation)}
                      className="px-4 py-2 rounded-lg text-xs font-medium 
                                 bg-base-300 
                                 hover:bg-base-content/10 
                                 transition-colors text-base-content/80"
                    >
                      📋 Kopyala
                    </button>
                    <button
                      onClick={() => playPronunciation(currentQuestion.sentence_en)}
                      className="px-4 py-2 rounded-lg text-xs font-medium 
                                 bg-base-300 
                                 hover:bg-base-content/10 
                                 transition-colors text-base-content/80"
                    >
                      🔊 İngilizce Dinle
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-base-content/40">Çeviri bulunamadı</p>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-base-300 bg-base-100 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-xs text-base-content/40">
                <span className="px-2 py-0.5 rounded-full bg-base-200 text-base-content/60">
                  EN → TR
                </span>
                <span className="text-base-content/30">•</span>
                <span className="truncate max-w-[150px] text-base-content/50">
                  {currentQuestion.sentence_en}
                </span>
              </div>
              <span
                className="px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0"
                style={{ color: levelColor, backgroundColor: `${levelColor}15` }}
              >
                {userLevel}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Kelime Çeviri Modal - daisyUI tema token'ları ile tam dark mode desteği */}
      {showWordModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowWordModal(false)}
        >
          <div
            className="relative w-full max-w-sm bg-base-100 rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-base-300 bg-base-100">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-base-content">
                    Kelime Çevirisi
                  </h3>
                  <p className="text-xs text-base-content/50">
                    İngilizce → Türkçe
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowWordModal(false)}
                className="p-1.5 rounded-lg hover:bg-base-200 transition-colors text-base-content/50 hover:text-base-content flex-shrink-0"
                aria-label="Kapat"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content - daisyUI tema token'ları ile tam dark mode desteği */}
            <div className="p-6 bg-base-200">
              {translating ? (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${levelColor}30`, borderTopColor: levelColor }} />
                  <p className="text-sm text-base-content/60">Çeviri yapılıyor...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-xs font-semibold text-base-content/40 uppercase tracking-wider mb-1">
                      İngilizce
                    </div>
                    <p className="text-xl font-bold text-base-content">
                      {selectedWord}
                    </p>
                  </div>
                  <div className="flex justify-center">
                    <svg className="w-6 h-6 text-base-content/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-semibold text-base-content/40 uppercase tracking-wider mb-1">
                      Türkçe
                    </div>
                    <p className="text-xl font-bold text-base-content">
                      {wordTranslation || 'Çeviri bulunamadı'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-base-300 bg-base-100 flex items-center justify-between">
              <button
                onClick={() => {
                  if (selectedWord) {
                    copyToClipboard(selectedWord);
                  }
                }}
                className="p-1.5 rounded-lg hover:bg-base-200 transition-colors text-base-content/40 hover:text-base-content"
                aria-label="Kopyala"
                title="Kopyala"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
              </button>
              <span
                className="px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ color: levelColor, backgroundColor: `${levelColor}15` }}
              >
                {userLevel}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <Toast />
    </div>
  );
}