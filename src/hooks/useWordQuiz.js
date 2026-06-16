import { useState, useEffect } from "react";
import { supabase } from "../config.js";
import { shuffle, buildWordOptions } from "../utils/quizHelpers.js";
import { updateDailyStats } from "../utils/dailyStats.js";

const FIXED_USER_ID = "302a3b6b-c1e9-49c4-98fe-52115bd7d204";

export function useWordQuiz(userLevel) {
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

  const choiceCount = { A1: 3, A2: 3, B1: 4, B2: 4 }[userLevel];

  // Verileri yükle
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const { data: userWords, error: uwError } = await supabase
          .from("en_user_words")
          .select("word_id, next_review_at")
          .eq("user_id", FIXED_USER_ID)
          .lt("next_review_at", new Date().toISOString());
        
        if (uwError) throw uwError;
        
        if (!userWords || userWords.length === 0) {
          setQueue([]);
          setCurrentQuestion(null);
          setLoading(false);
          return;
        }
        
        const wordIds = userWords.map(w => w.word_id);
        
        const { data: words, error: wError } = await supabase
          .from("en_words")
          .select("*")
          .in("id", wordIds);
        
        if (wError) throw wError;
        
        setAllCards(words || []);
        const shuffledQueue = shuffle(words || []);
        setQueue(shuffledQueue);
        setCurrentQuestion(shuffledQueue[0] || null);
        setQueueIndex(0);
        
        if (words && words.length > 0) {
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
  }, [userLevel]);

  // Şıkları oluştur - HER SEFERİNDE FARKLI!
  useEffect(() => {
    if (!currentQuestion) return;
    setOptions(buildWordOptions(currentQuestion, allCards, choiceCount));
    setSelected(null);
    setAnswered(false);
  }, [currentQuestion, allCards, choiceCount]);

  // Kelime sonucunu kaydet - SADECE en_user_words GÜNCELLENİR
  // useWordQuiz.js - saveWordResult
const saveWordResult = async (wordId, isCorrect) => {
  const now = new Date();
  let nextReviewDate = new Date();
  
  const { data: existing } = await supabase
    .from("en_user_words")
    .select("id, review_count, total_correct, total_wrong")
    .eq("user_id", FIXED_USER_ID)
    .eq("word_id", wordId)
    .single();
  
  if (isCorrect) {
    const newReviewCount = (existing?.review_count || 0) + 1;
    const newTotalCorrect = (existing?.total_correct || 0) + 1;
    
    // Tekrar aralığını hesapla...
    if (newReviewCount === 1) nextReviewDate.setDate(now.getDate() + 1);
    else if (newReviewCount === 2) nextReviewDate.setDate(now.getDate() + 3);
    // ... devamı
    
    await supabase
      .from("en_user_words")
      .update({
        next_review_at: nextReviewDate.toISOString(),
        review_count: newReviewCount,
        total_correct: newTotalCorrect,     // ⬅️ YENİ
        last_score: 100,
        last_reviewed_at: now.toISOString(),
        mastery_level: Math.min(newReviewCount, 9),
        is_mastered: newReviewCount >= 9
      })
      .eq("id", existing.id);
  } else {
    const newTotalWrong = (existing?.total_wrong || 0) + 1;
    nextReviewDate.setTime(now.getTime() + 3 * 60 * 60 * 1000);
    
    await supabase
      .from("en_user_words")
      .update({
        next_review_at: nextReviewDate.toISOString(),
        review_count: 0,
        total_wrong: newTotalWrong,        // ⬅️ YENİ
        last_score: 0,
        last_reviewed_at: now.toISOString(),
        mastery_level: 0,
        is_mastered: false
      })
      .eq("id", existing.id);
  }
};

  // Cevap seçildiğinde
  const handleSelect = async (opt, onComplete) => {
    if (answered || saving || !currentQuestion) return;
    
    const isCorrect = opt === currentQuestion.meaning;
    
    setSelected(opt);
    setAnswered(true);
    setSaving(true);
    
    // Kelime sonucunu kaydet
    await saveWordResult(currentQuestion.id, isCorrect);

    // 🆕 Günlük istatistiği güncelle
    await updateDailyStats('word', isCorrect);
    
    setSaving(false);
    onComplete(isCorrect);
  };

  // Sonraki soruya geç
  const handleNext = () => {
    if (saving) return;
    const nextIndex = queueIndex + 1;
    if (nextIndex >= queue.length) {
      return null; // Kuyruk bitti
    } else {
      setQueueIndex(nextIndex);
      setCurrentQuestion(queue[nextIndex]);
      setSelected(null);
      setAnswered(false);
      return queue[nextIndex];
    }
  };

  // Hook'tan dönen değerler
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
    setSelected,
    setAnswered,
    setExamplesMap
  };
}