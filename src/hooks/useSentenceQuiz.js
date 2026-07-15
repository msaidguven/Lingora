// hooks/useSentenceQuiz.js
import { useState, useEffect } from "react";
import { supabase } from "../config.js";
import { shuffle, buildSentenceOptions } from "../utils/quizHelpers.js";
import { useAuth } from "../contexts/AuthContext";

const SESSION_SENTENCE_LIMIT = 20;

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
  const saveSentenceInBackground = async (sentenceId, isCorrect) => {
    if (!userId) {
      console.error("❌ userId gereklidir!");
      return;
    }

    try {
      const now = new Date();
      let nextReviewDate = new Date();

      const { data: existing, error: findError } = await supabase
        .from("en_user_sentences")
        .select("id, review_count, total_correct, total_wrong")
        .eq("user_id", userId)
        .eq("sentence_id", sentenceId)
        .maybeSingle();

      if (findError) throw findError;

      if (!existing) {
        console.error("❌ Cümle bulunamadı:", sentenceId);
        return;
      }

      if (isCorrect) {
        const newReviewCount = (existing?.review_count || 0) + 1;
        const newTotalCorrect = (existing?.total_correct || 0) + 1;

        // Tekrar aralığını hesapla
        if (newReviewCount === 1) nextReviewDate.setDate(now.getDate() + 1);
        else if (newReviewCount === 2) nextReviewDate.setDate(now.getDate() + 3);
        else if (newReviewCount === 3) nextReviewDate.setDate(now.getDate() + 7);
        else nextReviewDate.setDate(now.getDate() + 14);

        await supabase
          .from("en_user_sentences")
          .update({
            next_review_at: nextReviewDate.toISOString(),
            review_count: newReviewCount,
            total_correct: newTotalCorrect,
            last_score: 100,
            last_reviewed_at: now.toISOString()
          })
          .eq("id", existing.id);
      } else {
        const newTotalWrong = (existing?.total_wrong || 0) + 1;
        nextReviewDate.setTime(now.getTime() + 3 * 60 * 60 * 1000);

        await supabase
          .from("en_user_sentences")
          .update({
            next_review_at: nextReviewDate.toISOString(),
            review_count: 0,
            total_wrong: newTotalWrong,
            last_score: 0,
            last_reviewed_at: now.toISOString()
          })
          .eq("id", existing.id);
      }

      console.log(`✅ Cümle ${sentenceId} arka planda kaydedildi (${isCorrect ? 'doğru' : 'yanlış'})`);
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