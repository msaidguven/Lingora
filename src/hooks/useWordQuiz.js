// hooks/useWordQuiz.js
import { useState, useEffect } from "react";
import { supabase } from "../config.js";
import { shuffle, buildWordOptions } from "../utils/quizHelpers.js";
import { calculateNextReview, calculateNextMasteryLevel } from "../utils/spacedRepetition.js";
import { useAuth } from "../contexts/AuthContext";

const SESSION_WORD_LIMIT = 10;
const DISTRACTOR_POOL_LIMIT = 500;

export function useWordQuiz(userLevel) {
  const { user } = useAuth();
  const userId = user?.id;

  const [allCards, setAllCards] = useState([]);
  const [distractorPool, setDistractorPool] = useState([]);
  const [examplesMap, setExamplesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);

  // Tüm seviyelerde 5 şıklı soru gösteriliyor.
  const choiceCount = 5;

  // Yanlış şıkların çekileceği geniş havuz — session kuyruğundan (10
  // kelime) DEĞİL, aynı seviyedeki en_words tablosundan geliyor. Bu sayede
  // yanlış şıklar her seferinde farklı ve daha geniş bir kelime setinden
  // seçiliyor. Sadece userLevel değiştiğinde çekiliyor (her oturum
  // yeniden başlatıldığında değil) — gereksiz sorgu yükünü önlemek için.
  useEffect(() => {
    async function fetchDistractorPool() {
      if (!userLevel) return;
      try {
        const { data, error } = await supabase
          .from("en_words")
          .select("id, meaning")
          .eq("level", userLevel)
          .eq("type", "word")
          .limit(DISTRACTOR_POOL_LIMIT);

        if (error) throw error;
        setDistractorPool(data || []);
      } catch (err) {
        console.error("Yanlış şık havuzu yüklenemedi:", err);
        setDistractorPool([]);
      }
    }
    fetchDistractorPool();
  }, [userLevel]);

  // Verileri yükle
  useEffect(() => {
    async function fetchData() {
      if (!userId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setExamplesMap({});
      try {
        // en geciken next_review_at önce — useSentenceQuiz.js ile aynı
        // spaced-repetition önceliklendirmesi.
        const { data: userWords, error: uwError } = await supabase
          .from("en_user_words")
          .select("word_id, next_review_at")
          .eq("user_id", userId)
          .lt("next_review_at", new Date().toISOString())
          .order("next_review_at", { ascending: true })
          .limit(SESSION_WORD_LIMIT);

        if (uwError) throw uwError;

        if (!userWords || userWords.length === 0) {
          setAllCards([]);
          setQueue([]);
          setCurrentQuestion(null);
          setQueueIndex(0);
          setLoading(false);
          return;
        }

        // Seçim next_review_at'e göre yapıldı (DB tarafında); shuffle burada
        // sadece seçilen bu kelimelerin sunum sırasını karıştırıyor.
        const wordIds = shuffle(userWords.map(w => w.word_id));

        const { data: words, error: wError } = await supabase
          .from("en_words")
          .select("*")
          .in("id", wordIds);

        if (wError) throw wError;

        const wordsById = new Map((words || []).map(word => [word.id, word]));
        const sessionQueue = wordIds.map(id => wordsById.get(id)).filter(Boolean);

        setAllCards(sessionQueue);
        setQueue(sessionQueue);
        setCurrentQuestion(sessionQueue[0] || null);
        setQueueIndex(0);

        if (sessionQueue.length > 0) {
          const { data: examples } = await supabase
            .from("en_example_sentences")
            .select("*")
            .in("word_id", wordIds)
            .order("order_index");

          if (examples) {
            const map = {};
            examples.forEach(ex => {
              if (!map[ex.word_id]) map[ex.word_id] = [];
              map[ex.word_id].push(ex);
            });
            setExamplesMap(map);
          }
        }
      } catch (err) {
        console.error("Veri yükleme hatası:", err);
        setError("Veriler yüklenemedi.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    setSelected(null);
    setAnswered(false);
  }, [userLevel, sessionKey, userId]);

  // Şıkları oluştur — havuz (distractorPool) hazırsa oradan, henüz
  // yüklenmediyse (ör. ilk render sırasında bir yarış durumu) geçici
  // olarak session kuyruğundan (allCards) besleniyor.
  useEffect(() => {
    if (!currentQuestion) return;
    const pool = distractorPool.length > 0 ? distractorPool : allCards;
    setOptions(buildWordOptions(currentQuestion, pool, choiceCount));
    setSelected(null);
    setAnswered(false);
  }, [currentQuestion, distractorPool, allCards, choiceCount]);

  // 🔥 ARKA PLANDA KELİME KAYDETME
  // Zamanlama (review_count/ease_factor/next_review_at) ortak SM-2
  // fonksiyonundan geliyor. mastery_level ise SM-2'den bağımsız, ayrı bir
  // rütbe sayacı — bkz. utils/spacedRepetition.js.
  const saveWordInBackground = async (wordId, isCorrect) => {
    if (!userId) {
      console.error("❌ userId gereklidir!");
      return;
    }

    try {
      const now = new Date();

      const { data: existing, error: findError } = await supabase
        .from("en_user_words")
        .select(
          "id, review_count, total_correct, total_wrong, ease_factor, mastery_level, next_review_at, last_reviewed_at"
        )
        .eq("user_id", userId)
        .eq("word_id", wordId)
        .maybeSingle();

      if (findError) throw findError;

      if (!existing) {
        console.error("❌ Kelime bulunamadı:", wordId);
        return;
      }

      const { reviewCount, easeFactor, nextReviewAt, intervalDays } = calculateNextReview({
        isCorrect,
        reviewCount: existing.review_count,
        easeFactor: existing.ease_factor,
        nextReviewAt: existing.next_review_at,
        lastReviewedAt: existing.last_reviewed_at,
        now,
      });

      const newMasteryLevel = calculateNextMasteryLevel(existing.mastery_level, isCorrect);

      await supabase
        .from("en_user_words")
        .update({
          next_review_at: nextReviewAt.toISOString(),
          review_count: reviewCount,
          ease_factor: easeFactor,
          total_correct: (existing.total_correct || 0) + (isCorrect ? 1 : 0),
          total_wrong: (existing.total_wrong || 0) + (isCorrect ? 0 : 1),
          last_score: isCorrect ? 100 : 0,
          last_reviewed_at: now.toISOString(),
          mastery_level: newMasteryLevel,
          is_mastered: newMasteryLevel >= 7,
        })
        .eq("id", existing.id);

      console.log(
        `✅ Kelime ${wordId} kaydedildi (${isCorrect ? "doğru" : "yanlış"}) · ` +
        `interval=${intervalDays}g, ease=${easeFactor.toFixed(2)}, rütbe=${newMasteryLevel}`
      );
    } catch (err) {
      console.error("❌ Arka plan kaydetme hatası:", err);
    }
  };

  // ✅ Cevap seçildiğinde - SADECE UI GÜNCELLEME (SENKRON)
  const handleSelect = (opt, onComplete) => {
    if (answered || saving || !currentQuestion) return;

    const isCorrect = opt === currentQuestion.meaning;

    // 1️⃣ UI'ı HEMEN güncelle (SENKRON)
    setSelected(opt);
    setAnswered(true);

    // 2️⃣ Kelime kaydını ARKA PLANDA başlat (async - beklenmez)
    saveWordInBackground(currentQuestion.id, isCorrect);

    // 3️⃣ Callback'i çağır
    if (onComplete) {
      onComplete(isCorrect);
    }
  };

  // Sonraki soruya geç
  const handleNext = () => {
    if (saving) return;
    const nextIndex = queueIndex + 1;
    if (nextIndex >= queue.length) {
      return null;
    } else {
      setQueueIndex(nextIndex);
      setCurrentQuestion(queue[nextIndex]);
      setSelected(null);
      setAnswered(false);
      return queue[nextIndex];
    }
  };

  const restartQuizSession = () => {
    setSelected(null);
    setAnswered(false);
    setSessionKey(key => key + 1);
  };

  return {
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
    setSelected,
    setAnswered,
    setExamplesMap
  };
}