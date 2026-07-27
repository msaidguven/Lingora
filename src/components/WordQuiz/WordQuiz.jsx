// WordQuiz.jsx
import { useEffect, useState, useRef } from "react";
import { useWordQuiz } from "../../hooks/useWordQuiz.js";
import { speak, stopSpeaking, testSpeech } from "../../utils/speechUtils.js";
import { updateDailyStats } from "../../utils/dailyStats.js";
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Capacitor } from '@capacitor/core';
import ProgressBar from "../common/ProgressBar.jsx";
import ExampleModal from "./ExampleModal.jsx";
import FeedbackModal from "./FeedbackModal.jsx";
import { supabase } from "../../config.js";
import Toast from "../common/Toast.jsx";
import { useStudyTimer } from "../../hooks/useStudyTimer";

const LEVEL_COLOR = { A1: "#10b981", A2: "#3b82f6", B1: "#8b5cf6", B2: "#f59e0b" };

const isNative = Capacitor.isNativePlatform();

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

export default function WordQuiz({ userLevel, onChangeLevel }) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const isUpdatingRef = useRef(false);

  useStudyTimer();

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

  const lastSpokenIdRef = useRef(null);

  const [showExampleModal, setShowExampleModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedWordForExample, setSelectedWordForExample] = useState(null);
  const [selectedWordForFeedback, setSelectedWordForFeedback] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [ttsReady, setTtsReady] = useState(false);
  const menuRef = useRef(null);
  const speechTimeoutRef = useRef(null);

  const levelColor = LEVEL_COLOR[userLevel];

  // TTS'i başlat
  useEffect(() => {
    const initTTS = async () => {
      console.log('🔊 TTS başlatılıyor... Platform:', Capacitor.getPlatform());
      
      if (isNative) {
        // Native'de TTS'i test et
        try {
          // TTS'in hazır olmasını bekle
          await new Promise(resolve => setTimeout(resolve, 1000));
          setTtsReady(true);
          console.log('✅ Native TTS hazır');
        } catch (error) {
          console.error('❌ Native TTS başlatma hatası:', error);
          setTtsReady(true); // Yine de devam et
        }
      } else {
        // Web'de speech synthesis'i kontrol et
        if (typeof window !== 'undefined' && window.speechSynthesis) {
          // Seslerin yüklenmesini bekle
          const voices = window.speechSynthesis.getVoices();
          if (voices.length > 0) {
            setTtsReady(true);
          } else {
            window.speechSynthesis.onvoiceschanged = () => {
              setTtsReady(true);
            };
            // Timeout
            setTimeout(() => setTtsReady(true), 3000);
          }
        } else {
          setTtsReady(true);
        }
      }
    };
    
    initTTS();
    
    return () => {
      stopSpeaking();
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
    };
  }, []);

  // Ses çalma fonksiyonu
  const speakWord = async (word, callback) => {
    console.log('🔊 speakWord çağrıldı:', word, 'Platform:', Capacitor.getPlatform());
    
    if (!word) {
      console.log('⚠️ Konuşulacak kelime yok');
      return;
    }
    
    // Önceki konuşmayı durdur
    await stopSpeaking();
    
    // Timeout'u temizle
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
    }
    
    setSpeaking(true);
    
    try {
      await speak(word, {
        onStart: () => {
          console.log('🔊 Konuşma başladı');
        },
        onEnd: () => {
          console.log('✅ Konuşma bitti');
          setSpeaking(false);
          if (callback) callback();
        },
        language: 'en-US',
        rate: 0.85
      });
      
      // Fallback timeout (sadece web için)
      if (!isNative) {
        speechTimeoutRef.current = setTimeout(() => {
          console.log('⚠️ Fallback timeout - speaking false');
          setSpeaking(false);
          if (callback) callback();
        }, 5000);
      }
      
    } catch (error) {
      console.error('❌ speakWord hatası:', error);
      setSpeaking(false);
      if (callback) callback();
    }
  };

  // Telaffuzu çal
  const playPronunciation = () => {
    if (!currentQuestion) {
      console.log('⚠️ currentQuestion yok');
      return;
    }
    
    if (speaking) {
      console.log('⚠️ Zaten konuşuyor');
      return;
    }
    
    if (!ttsReady) {
      console.log('⚠️ TTS henüz hazır değil');
      return;
    }
    
    console.log('🔊 playPronunciation çağrıldı:', currentQuestion.word);
    speakWord(currentQuestion.word);
  };

  // Click handler
  const handleCardClick = (e) => {
    e?.stopPropagation();
    console.log('🖱️ Card tıklandı');
    
    if (currentQuestion && !speaking && ttsReady) {
      playPronunciation();
    } else {
      console.log('⚠️ Card tıklandı ama konuşma çalınamıyor', {
        hasQuestion: !!currentQuestion,
        speaking,
        ttsReady
      });
    }
  };

  // Hoparlör butonu click handler
  const handleSpeakerClick = (e) => {
    e?.stopPropagation();
    console.log('🔊 Hoparlör tıklandı');
    playPronunciation();
  };

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

  useEffect(() => {
    if (currentQuestion) {
      setRevealed(false);
    }
  }, [currentQuestion]);

  // Auto-speak (sadece web'de)
  useEffect(() => {
    if (
      !loading &&
      currentQuestion &&
      !answered &&
      !speaking &&
      ttsReady &&
      lastSpokenIdRef.current !== currentQuestion.id
    ) {
      console.log('🔊 Auto-speak tetiklendi:', currentQuestion.word);
      lastSpokenIdRef.current = currentQuestion.id;
      
      // Native'de auto-speak yapma, kullanıcı tıklasın
      if (!isNative) {
        speakWord(currentQuestion.word);
      }
    }
  }, [currentQuestion, answered, loading, ttsReady]);

  const onSelect = (opt) => {
    if (answered || saving || isUpdatingRef.current) return;

    isUpdatingRef.current = true;

    const isCorrect = opt === currentQuestion.meaning;
    const correctAnswer = currentQuestion.meaning;

    handleSelect(opt, (isCorrectResult) => {});

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
          await updateDailyStats(user.id, 'word', isCorrect);

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
    const nextQuestion = handleNext();
    if (nextQuestion === null) {
      setIsFinished(true);
    } else {
      setRevealed(false);
    }
  };

  const handleRestart = () => {
    stopSpeaking();
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
    }
    setSpeaking(false);
    setIsFinished(false);
    setShowExampleModal(false);
    setShowFeedbackModal(false);
    setSelectedWordForExample(null);
    setSelectedWordForFeedback(null);
    setRevealed(false);
    restartQuizSession();
  };

  // ... Loading, Error, Finished state'leri aynı kalacak

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
            10 Kelime Daha Çalış
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
      {/* Debug Info */}
      <div className="text-xs text-base-content/30 mb-2 p-2 bg-base-200/50 rounded-lg flex items-center justify-between">
        <span>
          {isNative ? '📱 Native' : '🌐 Web'} - 
          {ttsReady ? '✅ TTS hazır' : '⏳ TTS yükleniyor...'}
        </span>
        <button 
          onClick={async () => {
            const result = await testSpeech();
            console.log('Test sonucu:', result);
          }}
          className="px-3 py-1 bg-primary/20 rounded text-primary text-xs font-medium"
        >
          Test Ses
        </button>
      </div>

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
        className={`relative rounded-2xl p-8 text-center transition-all duration-300 bg-base-100 border border-base-200 shadow-lg hover:shadow-xl cursor-pointer ${
          revealed ? 'hover:scale-[1.02] hover:border-primary/20' : 'hover:scale-[1.02] hover:border-primary/20'
        }`}
        onClick={handleCardClick}
        style={{ marginTop: 20, marginBottom: 20 }}
      >
        {/* Menu Button */}
        {revealed && (
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
        )}

        {revealed ? (
          <>
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

            {/* Word with Speaker Icon */}
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="text-4xl font-extrabold tracking-tight leading-tight text-base-content">
                {currentQuestion.word}
              </span>
              <button
                onClick={handleSpeakerClick}
                className={`p-2 rounded-full transition-all duration-200 hover:scale-110 ${
                  speaking
                    ? 'bg-primary/20 text-primary animate-pulse'
                    : 'text-base-content/40 hover:text-primary hover:bg-primary/10'
                }`}
                aria-label="Telaffuzu dinle"
                title="Telaffuzu dinle"
                disabled={speaking}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              </button>
            </div>

            {/* Speaking indicator */}
            {speaking && (
              <div className="mt-1 flex items-center justify-center gap-2 text-xs font-medium text-primary">
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
                Dinleniyor...
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 py-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: isDark ? '#6366f122' : '#6366f110' }}
            >
              <span className="text-3xl">🔊</span>
            </div>

            <div className="text-xs font-semibold text-base-content/40 tracking-wider">
              {isNative ? '📱 Kelimeye tıkla dinle' : 'Önce kelimeyi dinle'}
            </div>

            {speaking ? (
              <div className="flex items-center justify-center gap-2 text-xs font-medium text-primary">
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
                Dinleniyor...
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  playPronunciation();
                }}
                className="text-xs font-semibold text-primary/70 hover:text-primary transition-all"
              >
                Tekrar dinle
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                setRevealed(true);
              }}
              className="btn btn-primary btn-md px-8 rounded-full shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all hover:scale-105 font-semibold mt-1"
            >
              Göster
            </button>
          </div>
        )}
      </div>

      {revealed && (
        <>
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

              let buttonStyle = "bg-base-100 border-base-200 hover:border-primary/30 text-base-content";
              if (answered && isCorrect) {
                buttonStyle = "bg-success/10 border-success/40 text-success";
              } else if (answered && isSelected && !isCorrect) {
                buttonStyle = "bg-error/10 border-error/40 text-error";
              } else if (isSelected && !answered) {
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

      {/* Answer Feedback */}
      {answered && (
        <div className={`mt-4 p-4 rounded-2xl border-2 transition-all duration-300 ${selected === correctAnswer
          ? 'bg-success/10 border-success/40 text-success'
          : 'bg-error/10 border-error/40 text-error'
          }`}>
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 font-bold text-sm">
              <span className="text-lg">
                {selected === correctAnswer ? '✅' : '❌'}
              </span>
              {selected === correctAnswer ? "Doğru!" : `Doğru cevap: "${correctAnswer}"`}
            </div>
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
      {revealed && !answered && !saving && (
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

      {/* Toast */}
      <Toast />
    </div>
  );
}