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

  // 🔥 ARKA PLANDA KELİME KAYDETME
  const saveWordInBackground = async (wordId, isCorrect) => {
    if (!userId) {
      console.error("❌ userId gereklidir!");
      return;
    }

    try {
      const now = new Date();
      let nextReviewDate = new Date();

      const { data: existing, error: findError } = await supabase
        .from("en_user_words")
        .select("id, review_count, total_correct, total_wrong")
        .eq("user_id", userId)
        .eq("word_id", wordId)
        .maybeSingle();

      if (findError) throw findError;

      if (!existing) {
        console.error("❌ Kelime bulunamadı:", wordId);
        return;
      }

      if (isCorrect) {
        const newReviewCount = (existing?.review_count || 0) + 1;
        const newTotalCorrect = (existing?.total_correct || 0) + 1;

        if (newReviewCount === 1) nextReviewDate.setDate(now.getDate() + 1);
        else if (newReviewCount === 2) nextReviewDate.setDate(now.getDate() + 3);
        else if (newReviewCount === 3) nextReviewDate.setDate(now.getDate() + 7);
        else nextReviewDate.setDate(now.getDate() + 14);

        await supabase
          .from("en_user_words")
          .update({
            next_review_at: nextReviewDate.toISOString(),
            review_count: newReviewCount,
            total_correct: newTotalCorrect,
            last_score: 100,
            last_reviewed_at: now.toISOString(),
            mastery_level: Math.min(newReviewCount, 9),
            is_mastered: newReviewCount >= 9
          })
          .eq("id", existing.id);
      } else {
        const newTotalWrong = (existing?.total_wrong || 0) + 1;

        // 🔽 Kademeli düşüş: yanlışta review_count (dolayısıyla mastery_level)
        // sıfırlanmıyor, bir seviye geri iniyor. review_count 9'un üzerindeyse
        // (mastery_level zaten 9'da sabitlenmiş "Efsane" kullanıcılar) tek bir
        // yanlış rütbeyi hemen düşürmez — bu bir tampon görevi görüyor.
        const newReviewCount = Math.max(0, (existing?.review_count || 0) - 1);

        nextReviewDate.setTime(now.getTime() + 3 * 60 * 60 * 1000);

        await supabase
          .from("en_user_words")
          .update({
            next_review_at: nextReviewDate.toISOString(),
            review_count: newReviewCount,
            total_wrong: newTotalWrong,
            last_score: 0,
            last_reviewed_at: now.toISOString(),
            mastery_level: Math.min(newReviewCount, 9),
            is_mastered: newReviewCount >= 9
          })
          .eq("id", existing.id);
      }

      console.log(`✅ Kelime ${wordId} arka planda kaydedildi (${isCorrect ? 'doğru' : 'yanlış'})`);
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