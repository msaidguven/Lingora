// hooks/useSentenceQuiz.js
import { useState, useEffect } from "react";
import { supabase } from "../config.js";
import { shuffle, buildSentenceOptions } from "../utils/quizHelpers.js";
import { calculateNextReview } from "../utils/spacedRepetition.js";
import { useAuth } from "../contexts/AuthContext";

const SESSION_SENTENCE_LIMIT = 10;

export function useSentenceQuiz(userLevel) {
  const { user } = useAuth();
  const userId = user?.id;

  const [allSentences, setAllSentences] = useState([]);
  const [allCards, setAllCards] = useState([]);
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

  const choiceCount = { A1: 3, A2: 3, B1: 4, B2: 4, C1: 4 }[userLevel] || 3;

  // Verileri yükle
  useEffect(() => {
    async function fetchData() {
      if (!userId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const { data: userSentences, error: usError } = await supabase
          .from("en_user_sentences")
          .select("sentence_id, next_review_at")
          .eq("user_id", userId)
          .lt("next_review_at", new Date().toISOString())
          .order("next_review_at", { ascending: true })
          .limit(SESSION_SENTENCE_LIMIT);

        if (usError) throw usError;

        if (!userSentences || userSentences.length === 0) {
          setAllSentences([]);
          setQueue([]);
          setCurrentQuestion(null);
          setQueueIndex(0);
          setLoading(false);
          return;
        }

        const sentenceIds = shuffle(userSentences.map(s => s.sentence_id));

        const { data: sentences, error: sError } = await supabase
          .from("en_example_sentences")
          .select("*")
          .in("id", sentenceIds)
          .eq("is_approved", true);

        if (sError) throw sError;

        const sentencesById = new Map(
          (sentences || [])
            .filter(s => s.sentence_en && s.sentence_tr)
            .map(sentence => [sentence.id, sentence])
        );
        const sessionQueue = sentenceIds.map(id => sentencesById.get(id)).filter(Boolean);

        setAllSentences(sessionQueue);
        setQueue(sessionQueue);
        setCurrentQuestion(sessionQueue[0] || null);
        setQueueIndex(0);

        const { data: words } = await supabase
          .from("en_words")
          .select("*")
          .eq("type", "word");
        setAllCards(words || []);
      } catch (err) {
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
    setOptions(buildSentenceOptions(currentQuestion, allSentences, currentQuestion.id, choiceCount));
    setSelected(null);
    setAnswered(false);
  }, [currentQuestion, allSentences, choiceCount]);

  // 🔥 ARKA PLANDA CÜMLE KAYDETME
  // Zamanlama (review_count/ease_factor/next_review_at) ortak SM-2
  // fonksiyonundan geliyor — bkz. utils/spacedRepetition.js. en_user_sentences'ta
  // mastery_level yok, o yüzden burada sadece SM-2 katmanı var.
  const saveSentenceInBackground = async (sentenceId, isCorrect) => {
    if (!userId) {
      console.error("❌ userId gereklidir!");
      return;
    }

    try {
      const now = new Date();

      const { data: existing, error: findError } = await supabase
        .from("en_user_sentences")
        .select("id, review_count, total_correct, total_wrong, ease_factor, next_review_at, last_reviewed_at")
        .eq("user_id", userId)
        .eq("sentence_id", sentenceId)
        .maybeSingle();

      if (findError) throw findError;

      if (!existing) {
        console.error("❌ Cümle bulunamadı:", sentenceId);
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

      await supabase
        .from("en_user_sentences")
        .update({
          next_review_at: nextReviewAt.toISOString(),
          review_count: reviewCount,
          ease_factor: easeFactor,
          total_correct: (existing.total_correct || 0) + (isCorrect ? 1 : 0),
          total_wrong: (existing.total_wrong || 0) + (isCorrect ? 0 : 1),
          last_score: isCorrect ? 100 : 0,
          last_reviewed_at: now.toISOString(),
        })
        .eq("id", existing.id);

      console.log(
        `✅ Cümle ${sentenceId} kaydedildi (${isCorrect ? "doğru" : "yanlış"}) · ` +
        `interval=${intervalDays}g, ease=${easeFactor.toFixed(2)}`
      );
    } catch (err) {
      console.error("❌ Arka plan kaydetme hatası:", err);
    }
  };

  // ✅ Cevap seçildiğinde - SADECE UI GÜNCELLEME (SENKRON)
  const handleSelect = (opt, onComplete) => {
    if (answered || saving || !currentQuestion) return;

    const isCorrect = opt === currentQuestion.sentence_tr;

    // 1️⃣ UI'ı HEMEN güncelle (SENKRON)
    setSelected(opt);
    setAnswered(true);

    // 2️⃣ Cümle kaydını ARKA PLANDA başlat (async - beklenmez)
    saveSentenceInBackground(currentQuestion.id, isCorrect);

    // 3️⃣ Callback'i çağır
    if (onComplete) {
      onComplete(isCorrect);
    }
  };

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
    allCards,
    handleSelect,
    handleNext,
    restartQuizSession,
    setSelected,
    setAnswered
  };
}