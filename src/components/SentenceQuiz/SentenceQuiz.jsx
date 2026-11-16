// pages/SentenceQuiz.jsx
import { useEffect, useState, useRef, useMemo } from "react";
import { useSentenceQuiz } from "../../hooks/useSentenceQuiz.js";
import { speak, stopSpeaking } from "../../utils/speechUtils.js";
import { updateDailyStats } from "../../utils/dailyStats.js";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import ProgressBar from "../common/ProgressBar.jsx";
import SentenceResult from "./SentenceResult.jsx";
import { supabase } from "../../config.js";
import Toast from "../common/Toast.jsx";

import { useStudyTimer } from "../../hooks/useStudyTimer";

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

// Saniyeyi 0:00 formatına çevirir
const formatTime = (seconds) => {
  const total = Math.max(0, Math.floor(seconds || 0));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

// Üst rozet için kısa süre gösterimi
const formatShortDuration = (seconds) => {
  const total = Math.max(0, Math.floor(seconds || 0));
  if (total < 60) return `${total}s`;
  return formatTime(total);
};

// YouTube video ID'sinden thumbnail URL'si oluşturur
const getYouTubeThumbnail = (videoId, quality = 'hqdefault') => {
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
};

export default function SentenceQuiz({ userLevel, onChangeLevel }) {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  const { user } = useAuth();
  const isUpdatingRef = useRef(false);
  const lastSpokenIdRef = useRef(null);

  useStudyTimer();

  const {
    loading, error,
    currentQuestion, options, selected, answered, saving,
    queue, queueIndex,
    handleSelect, handleNext, restartQuizSession,
  } = useSentenceQuiz(userLevel);

  const [speaking, setSpeaking] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // Cümle çevirisi
  const [showTranslationModal, setShowTranslationModal] = useState(false);
  const [translation, setTranslation] = useState('');
  const [translating, setTranslating] = useState(false);

  // Kelime çevirisi
  const [wordTranslations, setWordTranslations] = useState({});
  const [openWord, setOpenWord] = useState(null);

  // ── YouTube video oynatıcı state'leri ──
  const playerRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const [ytApiReady, setYtApiReady] = useState(
    typeof window !== "undefined" && !!window.YT?.Player
  );
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [playerReady, setPlayerReady] = useState(false);
  const [videoLoadAttempts, setVideoLoadAttempts] = useState(0);
  const retryTimerRef = useRef(null);

  // Kart dışına tıklanınca açık kelime dropdown'ını kapat
  useEffect(() => {
    if (openWord === null) return;
    const handleOutsideClick = () => setOpenWord(null);
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [openWord]);

  const levelColor = LEVEL_COLOR[userLevel] || "#8b5cf6";
  const levelLabel = LEVEL_LABEL[userLevel] || "Orta";

  // Cümleyi kelimelere ayırma
  const splitSentenceIntoWords = (sentence) => {
    if (!sentence) return [];
    const regex = /[\w']+|[.,!?;:]/g;
    const result = [];
    let match;
    while ((match = regex.exec(sentence)) !== null) {
      result.push({ text: match[0], start: match.index, end: match.index + match[0].length });
    }
    return result;
  };

  // Kelime listesini oluştur
  const wordParts = useMemo(() => {
    if (!currentQuestion?.sentence_en) return [];
    return splitSentenceIntoWords(currentQuestion.sentence_en);
  }, [currentQuestion]);

  const VALID_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];

  const IRREGULAR_VERBS = {
    saw: 'see', seen: 'see', went: 'go', gone: 'go', took: 'take', taken: 'take',
    ate: 'eat', eaten: 'eat', gave: 'give', given: 'give', came: 'come',
    made: 'make', said: 'say', got: 'get', gotten: 'get', knew: 'know', known: 'know',
    thought: 'think', felt: 'feel', found: 'find', told: 'tell', became: 'become',
    left: 'leave', brought: 'bring', began: 'begin', begun: 'begin', kept: 'keep',
    held: 'hold', wrote: 'write', written: 'write', stood: 'stand', heard: 'hear',
    meant: 'mean', met: 'meet', paid: 'pay', ran: 'run', sat: 'sit',
    spoke: 'speak', spoken: 'speak', broke: 'break', broken: 'break', chose: 'choose',
    chosen: 'choose', drove: 'drive', driven: 'drive', drew: 'draw', drawn: 'draw',
    fell: 'fall', fallen: 'fall', flew: 'fly', flown: 'fly', forgot: 'forget',
    forgotten: 'forget', grew: 'grow', grown: 'grow', hid: 'hide', hidden: 'hide',
    rode: 'ride', ridden: 'ride', rose: 'rise', risen: 'rise', sang: 'sing',
    sung: 'sing', sold: 'sell', sent: 'send', shook: 'shake', shaken: 'shake',
    swam: 'swim', swum: 'swim', threw: 'throw', thrown: 'throw', understood: 'understand',
    woke: 'wake', woken: 'wake', wore: 'wear', worn: 'wear', won: 'win',
  };

  const fetchGoogleMeanings = async (w) => {
    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=tr&dt=t&dt=bd&q=${encodeURIComponent(w)}`
    );
    const data = await response.json();

    const mainTranslation =
      data && data[0] ? data[0].map((item) => item[0]).join('') : '';

    let meanings = [];
    if (Array.isArray(data?.[1])) {
      data[1].forEach((entry) => {
        if (Array.isArray(entry?.[1])) {
          meanings.push(...entry[1]);
        }
      });
    }
    return { mainTranslation, meanings };
  };

  const lookupWordInDb = async (lookupKey) => {
    const { data } = await supabase
      .from('en_words')
      .select('meaning')
      .ilike('word', lookupKey)
      .maybeSingle();
    return data?.meaning || null;
  };

  const handleWordHover = async (word) => {
    const key = word.trim();
    if (!key || /^[.,!?;:]$/.test(key) || wordTranslations[key]) return;

    setWordTranslations((prev) => ({
      ...prev,
      [key]: { loading: true, text: '', foundInDb: null },
    }));

    try {
      const meaning = await lookupWordInDb(key.toLowerCase());
      setWordTranslations((prev) => ({
        ...prev,
        [key]: meaning
          ? { loading: false, text: meaning, foundInDb: true }
          : { loading: false, text: '', foundInDb: false },
      }));
    } catch (error) {
      setWordTranslations((prev) => ({
        ...prev,
        [key]: { loading: false, text: '', foundInDb: false },
      }));
    }
  };

  const translateWord = async (word, sentenceLevel) => {
    const key = word.trim();
    if (!key || /^[.,!?;:]$/.test(key)) return;
    const lookupKey = key.toLowerCase();
    const levelToSave = VALID_LEVELS.includes(sentenceLevel) ? sentenceLevel : null;

    const cached = wordTranslations[key];
    if (cached?.foundInDb && cached?.text) return;

    setWordTranslations((prev) => ({
      ...prev,
      [key]: { loading: true, text: prev[key]?.text || '' },
    }));

    try {
      const existingMeaning =
        cached?.foundInDb === false ? null : await lookupWordInDb(lookupKey);

      if (existingMeaning) {
        setWordTranslations((prev) => ({
          ...prev,
          [key]: { loading: false, text: existingMeaning, foundInDb: true },
        }));
        return;
      }

      const { mainTranslation, meanings: ownMeanings } = await fetchGoogleMeanings(key);

      let allMeanings = [...ownMeanings];

      const baseVerb = IRREGULAR_VERBS[lookupKey];
      if (baseVerb) {
        try {
          const { meanings: baseMeanings } = await fetchGoogleMeanings(baseVerb);
          allMeanings = [...baseMeanings, ...allMeanings];
        } catch (e) {
          // kök fiil çekilemezse sessizce devam
        }
      }

      allMeanings = [...new Set(allMeanings)].slice(0, 6);

      const translated =
        allMeanings.length > 0 ? allMeanings.join(', ') : mainTranslation;

      setWordTranslations((prev) => ({
        ...prev,
        [key]: { loading: false, text: translated || 'Çeviri bulunamadı', foundInDb: false },
      }));

      if (translated) {
        supabase
          .from('en_words')
          .upsert(
            { word: lookupKey, meaning: translated, type: 'word', level: levelToSave },
            { onConflict: 'word', ignoreDuplicates: true }
          )
          .then(({ error: upsertError }) => {
            if (upsertError) console.error('Kelime kaydetme hatası:', upsertError);
          });
      }
    } catch (error) {
      console.error('Kelime çeviri hatası:', error);
      setWordTranslations((prev) => ({
        ...prev,
        [key]: { loading: false, text: 'Çeviri yüklenemedi' },
      }));
    }
  };

  const handleWordClick = (index, word, e) => {
    e.preventDefault();
    e.stopPropagation();
    const key = word.trim();
    if (/^[.,!?;:]$/.test(key)) return;

    setOpenWord((prev) => (prev === index ? null : index));

    if (!wordTranslations[key]) {
      translateWord(key, currentQuestion?.level);
    }
  };

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

  useEffect(() => {
    if (showTranslationModal && currentQuestion) {
      translateText(currentQuestion.sentence_en);
    }
  }, [showTranslationModal, currentQuestion]);

  useEffect(() => {
    if (!currentQuestion?.sentence_en) return;

    const words = wordParts
      .filter((w) => !/^[.,!?;:]$/.test(w.text))
      .map((w) => w.text.trim())
      .filter(Boolean);

    if (words.length === 0) return;

    const uniqueLowerWords = [...new Set(words.map((w) => w.toLowerCase()))];

    (async () => {
      try {
        const { data } = await supabase
          .from('en_words')
          .select('word, meaning')
          .in('word', uniqueLowerWords);

        const foundMap = {};
        (data || []).forEach((row) => {
          foundMap[row.word.toLowerCase()] = row.meaning;
        });

        setWordTranslations((prev) => {
          const next = { ...prev };
          words.forEach((w) => {
            if (next[w]?.text) return;
            const meaning = foundMap[w.toLowerCase()];
            next[w] = meaning
              ? { loading: false, text: meaning, foundInDb: true }
              : { loading: false, text: '', foundInDb: false };
          });
          return next;
        });
      } catch (error) {
        console.error('Toplu kelime çekme hatası:', error);
      }
    })();
  }, [currentQuestion]);

  const openGoogleTranslate = (text) => {
    const encodedText = encodeURIComponent(text);
    const url = `https://translate.google.com/?sl=en&tl=tr&text=${encodedText}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Telaffuz - video varsa çalışmaz
  const playPronunciation = (text, event) => {
    if (event) {
      event.stopPropagation();
    }
    
    if (currentQuestion?.youtube_video_id) {
      return;
    }
    
    if (!text) return;

    setSpeaking(true);

    speak(text, {
      onEnd: () => {
        setSpeaking(false);
      },
    });
  };

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

  const openTranslationModal = (event) => {
    if (event) {
      event.stopPropagation();
    }
    setShowTranslationModal(true);
  };

  useEffect(() => {
    setIsFinished(false);
  }, [userLevel]);

  // Otomatik telaffuz - video varsa çalışmaz
  useEffect(() => {
    if (currentQuestion?.youtube_video_id) {
      return;
    }
    
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

  // ── YouTube IFrame API script'ini yükle ──
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setYtApiReady(true);
      return;
    }
    if (!document.getElementById('youtube-iframe-api')) {
      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
    }
    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof previousCallback === 'function') previousCallback();
      setYtApiReady(true);
    };
  }, []);

  // ── Video player'ı kur ve otomatik oynat (GELİŞTİRİLMİŞ) ──
  useEffect(() => {
    // Önceki player'ı temizle
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (playerRef.current) {
      try { playerRef.current.destroy(); } catch (e) { }
      playerRef.current = null;
    }
    
    setVideoPlaying(false);
    setVideoCurrentTime(0);
    setVideoDuration(0);
    setPlayerReady(false);
    setVideoLoadAttempts(0);

    if (!ytApiReady || !currentQuestion?.youtube_video_id) {
      return;
    }

    // Video elementinin DOM'da var olduğundan emin ol
    const elementId = `yt-player-${currentQuestion.id}`;
    
    // Player'ı oluşturma fonksiyonu
    const createPlayer = (attempt = 0) => {
      const element = document.getElementById(elementId);
      
      if (!element) {
        console.log(`Video elementi bulunamadı (deneme ${attempt + 1}):`, elementId);
        if (attempt < 5) {
          retryTimerRef.current = setTimeout(() => createPlayer(attempt + 1), 300);
        }
        return;
      }

      console.log(`Video player oluşturuluyor (deneme ${attempt + 1}):`, currentQuestion.youtube_video_id);
      
      try {
        playerRef.current = new window.YT.Player(elementId, {
          videoId: currentQuestion.youtube_video_id,
          playerVars: {
            controls: 0,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            disablekb: 1,
            fs: 0,
            iv_load_policy: 3,
            autohide: 1,
            color: 'white',
            showinfo: 0,
            autoplay: 1,
            mute: 0,
          },
          events: {
            onReady: (e) => {
              console.log('Video hazır, başlatılıyor...');
              setVideoDuration(e.target.getDuration());
              setPlayerReady(true);
              try {
                e.target.playVideo();
                console.log('Video oynatılıyor...');
              } catch (err) {
                console.log('Otomatik oynatma hatası:', err);
              }
            },
            onStateChange: (e) => {
              if (e.data === window.YT.PlayerState.PLAYING) {
                console.log('Video oynuyor');
                setVideoPlaying(true);
                setVideoDuration(e.target.getDuration());
                if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
                progressIntervalRef.current = setInterval(() => {
                  if (playerRef.current?.getCurrentTime) {
                    setVideoCurrentTime(playerRef.current.getCurrentTime());
                  }
                }, 250);
              } else if (e.data === window.YT.PlayerState.PAUSED) {
                console.log('Video duraklatıldı');
                setVideoPlaying(false);
                if (progressIntervalRef.current) {
                  clearInterval(progressIntervalRef.current);
                  progressIntervalRef.current = null;
                }
              } else if (e.data === window.YT.PlayerState.ENDED) {
                console.log('Video bitti, tekrar oynatılıyor');
                setVideoCurrentTime(e.target.getDuration());
                try {
                  e.target.playVideo();
                } catch (err) {
                  // ignore
                }
              } else if (e.data === window.YT.PlayerState.UNSTARTED) {
                console.log('Video başlamadı, oynatmayı dene');
                try {
                  e.target.playVideo();
                } catch (err) {
                  // ignore
                }
              }
            },
            onError: (e) => {
              console.error('Video hatası:', e.data);
              // Hata durumunda yeniden dene
              if (attempt < 3) {
                retryTimerRef.current = setTimeout(() => {
                  if (playerRef.current) {
                    try { playerRef.current.destroy(); } catch (err) {}
                    playerRef.current = null;
                  }
                  createPlayer(attempt + 1);
                }, 1000);
              }
            },
          },
        });
      } catch (error) {
        console.error('Player oluşturma hatası:', error);
        if (attempt < 3) {
          retryTimerRef.current = setTimeout(() => createPlayer(attempt + 1), 500);
        }
      }
    };

    // DOM render'ını bekle
    const timer = setTimeout(() => {
      createPlayer(0);
    }, 100);

    return () => {
      clearTimeout(timer);
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch (e) { }
        playerRef.current = null;
      }
    };
  }, [ytApiReady, currentQuestion]);

  // Video tıklama ile oynat/duraklat
  const toggleVideoPlay = (e) => {
    if (e) e.stopPropagation();
    if (!playerRef.current || !playerReady) {
      console.log('Player hazır değil');
      return;
    }
    if (videoPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

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
          message: '✅ Doğru cevap!',
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
    }
  };

  const handleRestart = () => {
    stopSpeaking();
    setSpeaking(false);
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
            10 Cümle Daha Çalış
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
  const videoProgressPercent = videoDuration > 0 ? (videoCurrentTime / videoDuration) * 100 : 0;
  
  const thumbnailUrl = getYouTubeThumbnail(currentQuestion.youtube_video_id);
  const hasVideo = !!currentQuestion.youtube_video_id;

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
      <div className="mb-5">
        <ProgressBar current={queueIndex} total={queue.length} color={levelColor} />
      </div>

      {/* ── Video Alanı ── */}
      <div
        className={`relative w-full aspect-video rounded-2xl overflow-hidden mb-4 bg-base-300 ${
          hasVideo && playerReady ? "cursor-pointer" : ""
        }`}
        onClick={hasVideo && playerReady ? toggleVideoPlay : undefined}
      >
        {hasVideo ? (
          <>
            <div className="yt-crop-wrapper absolute inset-0 overflow-hidden pointer-events-none">
              <div id={`yt-player-${currentQuestion.id}`} />
            </div>
            <style>{`
              .yt-crop-wrapper iframe {
                position: absolute;
                top: 50%;
                left: 50%;
                width: 150%;
                height: 150%;
                transform: translate(-50%, -50%);
                border: 0;
                pointer-events: none;
              }
            `}</style>

            {/* Video yüklenirken/yokken thumbnail */}
            {!videoPlaying && thumbnailUrl && (
              <div
                className="absolute inset-0 z-10 bg-cover bg-center transition-opacity duration-300"
                style={{ 
                  backgroundImage: `url(${thumbnailUrl})`,
                  opacity: playerReady ? 0 : 1
                }}
              />
            )}

            {/* Sağ üst: süre rozeti */}
            {videoDuration > 0 && (
              <div className="absolute top-3 right-3 z-20 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/55 backdrop-blur-sm text-white text-xs font-semibold">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="9" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3" />
                </svg>
                {formatShortDuration(videoDuration)}
              </div>
            )}

            {/* Alt: ilerleme çubuğu */}
            {videoDuration > 0 && (
              <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center gap-3 p-3 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none">
                <div className="flex-1 h-1.5 rounded-full bg-white/30 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-white transition-all duration-150"
                    style={{ width: `${videoProgressPercent}%` }}
                  />
                </div>
                <span className="text-white text-xs font-medium tabular-nums flex-shrink-0">
                  {formatTime(videoCurrentTime)} / {formatTime(videoDuration)}
                </span>
              </div>
            )}
          </>
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center bg-cover bg-center"
            style={thumbnailUrl ? { backgroundImage: `url(${thumbnailUrl})` } : {}}
          >
            {!thumbnailUrl && (
              <span className="text-base-content/30 text-xs font-medium tracking-wide">
                Video yakında
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Cümle / Ses satırı ── */}
      <div className="flex items-center gap-3 rounded-2xl border border-base-300 bg-base-200 px-4 py-3.5 mb-5">
        {!hasVideo && (
          <button
            onClick={() => playPronunciation(currentQuestion.sentence_en)}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-transform hover:scale-105 active:scale-95"
            style={{ backgroundColor: levelColor }}
            aria-label="Telaffuzu dinle"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"
              />
            </svg>
          </button>
        )}

        <div className="flex-1 flex flex-wrap items-center gap-0.5 min-w-0">
          {wordParts.map((part, index) => {
            const isPunctuation = /^[.,!?;:]$/.test(part.text);

            if (isPunctuation) {
              return (
                <span key={index} className="text-sm font-medium text-base-content select-text">
                  {part.text}
                </span>
              );
            }

            const key = part.text.trim();
            const wordState = wordTranslations[key];
            const isOpen = openWord === index;

            let tooltipText = `"${part.text}" kelimesinin çevirisine bak`;
            if (wordState?.loading) {
              tooltipText = 'Kontrol ediliyor...';
            } else if (wordState?.text) {
              tooltipText = wordState.text;
            } else if (wordState?.foundInDb === false) {
              tooltipText = 'Çevirisi için tıkla';
            }

            return (
              <div
                key={index}
                tabIndex={0}
                role="button"
                onClick={(e) => handleWordClick(index, part.text, e)}
                onMouseEnter={() => handleWordHover(part.text)}
                onKeyDown={(e) => e.key === "Enter" && handleWordClick(index, part.text, e)}
                className={`dropdown dropdown-top inline-block text-sm font-medium leading-relaxed
                           text-base-content select-text
                           hover:text-blue-500 dark:hover:text-blue-400
                           hover:bg-blue-50/50 dark:hover:bg-blue-900/20
                           cursor-pointer transition-all duration-200
                           px-0.5 rounded-md ${isOpen ? 'dropdown-open' : 'tooltip tooltip-top'}`}
                data-tip={!isOpen ? tooltipText : undefined}
              >
                {part.text}

                {isOpen && (
                  <div className="dropdown-content card card-sm bg-base-100 z-30 w-32 shadow-md border border-base-300">
                    <div className="card-body p-3 items-center text-center gap-1">
                      {wordState?.loading || !wordState ? (
                        <span
                          className="loading loading-spinner loading-xs"
                          style={{ color: levelColor }}
                        />
                      ) : (
                        <p className="text-sm font-semibold text-base-content leading-snug">
                          {wordState.text}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!hasVideo && (
          <button
            onClick={() => playPronunciation(currentQuestion.sentence_en)}
            className="flex flex-col items-center gap-0.5 flex-shrink-0 text-base-content/40 hover:text-base-content transition-colors"
            aria-label="Tekrar dinle"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M4 9a8 8 0 1013.4-5.7M4 9l3-3" />
            </svg>
            <span className="text-[10px] font-medium">Tekrar Dinle</span>
          </button>
        )}
      </div>

      {/* Cümleyi kopyala / Google Translate */}
      <div className="flex items-center justify-end gap-2 -mt-3 mb-4">
        <button
          onClick={(e) => copyToClipboard(currentQuestion.sentence_en, e)}
          className="p-1.5 rounded-lg text-base-content/30 hover:text-base-content/70 hover:bg-base-200 transition-all"
          aria-label="Cümleyi kopyala"
          title="Cümleyi kopyala"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
        </button>
        <button
          onClick={(e) => openTranslationModal(e)}
          className="p-1.5 rounded-lg text-base-content/30 hover:text-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all"
          aria-label="Google Translate'de aç"
          title="Google Translate'de aç"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
        </button>
      </div>

      {/* ── Cevap Şıkları ── */}
      <div className="flex flex-col gap-3">
        {options.map((opt, i) => {
          const isCorrectOpt = opt === correctAnswer;
          const isSelectedOpt = opt === selected;

          let containerStyle = "border-base-300 bg-base-100";
          let circleStyle = "border-base-300";
          let textStyle = "text-base-content";
          let showDot = false;

          if (answered && isCorrectOpt) {
            containerStyle = "border-success/40 bg-success/5";
            circleStyle = "border-success bg-success";
            textStyle = "text-success";
            showDot = true;
          } else if (answered && isSelectedOpt && !isCorrectOpt) {
            containerStyle = "border-error/40 bg-error/5";
            circleStyle = "border-error bg-error";
            textStyle = "text-error";
            showDot = true;
          } else if (isSelectedOpt && !answered) {
            containerStyle = "border-primary/40 bg-primary/5";
            circleStyle = "border-primary bg-primary";
            textStyle = "text-primary";
            showDot = true;
          }

          return (
            <button
              key={i}
              onClick={() => onSelect(opt)}
              disabled={answered || saving}
              className={`w-full flex items-center gap-3 py-3.5 px-4 rounded-2xl border-2 text-left transition-all duration-200 ${containerStyle} ${!answered && !saving ? 'hover:scale-[1.01] active:scale-[0.99]' : ''}`}
            >
              <span className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${circleStyle}`}>
                {showDot && <span className="w-2 h-2 rounded-full bg-white" />}
              </span>
              <span className={`text-sm font-medium ${textStyle}`}>{opt}</span>
            </button>
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
            onSpeak={playPronunciation}
            isSaving={saving}
            isLastQuestion={queueIndex + 1 >= queue.length}
            isDarkMode={isDarkMode}
          />

          {currentQuestion.learning_notes && currentQuestion.learning_notes.length > 0 && (
            <div className="mt-4 p-4 rounded-2xl border border-base-300 bg-base-200/50">
              <div className="flex items-center gap-1.5 mb-2.5">
                <span className="text-[11px] font-bold tracking-[0.1em] text-base-content/40 uppercase">
                  💡 Notlar
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                {currentQuestion.learning_notes.map((note, i) => (
                  <p key={i} className="text-xs text-base-content/60 leading-relaxed">
                    {note}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Google Translate Modal */}
      {showTranslationModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowTranslationModal(false)}
        >
          <div
            className="relative w-full max-w-2xl bg-base-100 rounded-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
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

      {/* Toast */}
      <Toast />
    </div>
  );
}