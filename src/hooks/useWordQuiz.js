// hooks/useWordQuiz.js
import { useState, useEffect } from "react";
import { supabase } from "../config.js";
import { shuffle, buildWordOptions } from "../utils/quizHelpers.js";
import { useAuth } from "../contexts/AuthContext";

const SESSION_WORD_LIMIT = 20;

export function useWordQuiz(userLevel) {
  const { user } = useAuth();
  const userId = user?.id;

  const [allCards, setAllCards] = useState([]);
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

  const choiceCount = { A1: 3, A2: 3, B1: 4, B2: 4 }[userLevel];

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
        const { data: userWords, error: uwError } = await supabase
          .from("en_user_words")
          .select("word_id, next_review_at")
          .eq("user_id", userId)
          .lt("next_review_at", new Date().toISOString());

        if (uwError) throw uwError;

        if (!userWords || userWords.length === 0) {
          setAllCards([]);
          setQueue([]);
          setCurrentQuestion(null);
          setQueueIndex(0);
          setLoading(false);
          return;
        }

        const wordIds = shuffle(userWords.map(w => w.word_id)).slice(0, SESSION_WORD_LIMIT);

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

  // Şıkları oluştur
  useEffect(() => {
    if (!currentQuestion) return;
    setOptions(buildWordOptions(currentQuestion, allCards, choiceCount));
    setSelected(null);
    setAnswered(false);
  }, [currentQuestion, allCards, choiceCount]);

  // 🔥 ARKA PLANDA KELİME KAYDETME — gerçek SM-2 (SuperMemo-2) algoritması
  //
  // İki bağımsız katman var:
  // 1) Zamanlama (SM-2'nin kendi işi): review_count = "repetitions",
  //    ease_factor, next_review_at. Bunlar SM-2'nin standart formülüyle
  //    hesaplanır — yanlışta repetitions sıfırlanır, bu algoritmanın kuralı.
  // 2) Rütbe (oyunlaştırma, SM-2'den bağımsız): mastery_level kendi başına
  //    +1/-1 ile ilerler, review_count'a bağımlı değil. Bir yanlış cevap
  //    zamanlamayı sıfırlasa da rütbeyi silmez, sadece bir basamak indirir.
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

      // --- SM-2: kalite puanı ---
      // Elimizde sadece doğru/yanlış var (dereceli "kolay/orta/zor" yok),
      // bu yüzden ikili SM-2 varyantlarında yaygın olan eşlemeyi kullanıyoruz:
      // doğru → q=5 (mükemmel), yanlış → q=2 (eşik olan 3'ün altında, "fail").
      const quality = isCorrect ? 5 : 2;
      const prevRepetitions = existing.review_count || 0;
      const prevEase = existing.ease_factor || 2.5;

      let repetitions;
      let intervalDays;

      if (quality < 3) {
        // Yanlış cevap: SM-2 kuralı gereği tekrar sayacı sıfırlanır,
        // kelime yakın zamanda tekrar gösterilir.
        repetitions = 0;
        intervalDays = 1;
      } else {
        if (prevRepetitions === 0) {
          intervalDays = 1;
        } else if (prevRepetitions === 1) {
          intervalDays = 6;
        } else {
          // Önceki aralığı, en son iki tekrar arasındaki gerçek gün farkından
          // türetiyoruz (ayrı bir "interval" sütunumuz yok, ama next_review_at
          // ile last_reviewed_at farkı bunu zaten taşıyor).
          const prevIntervalDays = existing.last_reviewed_at
            ? Math.max(
              1,
              Math.round(
                (new Date(existing.next_review_at) - new Date(existing.last_reviewed_at)) /
                (1000 * 60 * 60 * 24)
              )
            )
            : 1;
          intervalDays = Math.round(prevIntervalDays * prevEase);
        }
        repetitions = prevRepetitions + 1;
      }

      // --- SM-2: ease factor güncellemesi (standart formül) ---
      let newEase = prevEase + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
      newEase = Math.max(1.3, newEase); // SM-2'nin alt sınırı

      const nextReviewDate = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

      // --- Rütbe (mastery_level): SM-2'den bağımsız, kademeli +1/-1 ---
      const prevMasteryLevel = existing.mastery_level || 0;
      const newMasteryLevel = isCorrect
        ? Math.min(prevMasteryLevel + 1, 9)
        : Math.max(prevMasteryLevel - 1, 0);

      await supabase
        .from("en_user_words")
        .update({
          next_review_at: nextReviewDate.toISOString(),
          review_count: repetitions,
          ease_factor: newEase,
          total_correct: (existing.total_correct || 0) + (isCorrect ? 1 : 0),
          total_wrong: (existing.total_wrong || 0) + (isCorrect ? 0 : 1),
          last_score: isCorrect ? 100 : 0,
          last_reviewed_at: now.toISOString(),
          mastery_level: newMasteryLevel,
          is_mastered: newMasteryLevel >= 9,
        })
        .eq("id", existing.id);

      console.log(
        `✅ Kelime ${wordId} kaydedildi (${isCorrect ? "doğru" : "yanlış"}) · ` +
        `interval=${intervalDays}g, ease=${newEase.toFixed(2)}, rütbe=${newMasteryLevel}`
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