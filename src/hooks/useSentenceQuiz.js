import { useState, useEffect } from "react";
import { supabase } from "../config.js";
import { shuffle, buildSentenceOptions } from "../utils/quizHelpers.js";

const FIXED_USER_ID = "302a3b6b-c1e9-49c4-98fe-52115bd7d204";

export function useSentenceQuiz(userLevel) {
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

  const choiceCount = { A1: 3, A2: 3, B1: 4, B2: 4 }[userLevel];

  // Verileri yükle
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const { data: userSentences, error: usError } = await supabase
          .from("en_user_sentences")
          .select("sentence_id, next_review_at")
          .eq("user_id", FIXED_USER_ID)
          .lt("next_review_at", new Date().toISOString());
        
        if (usError) throw usError;
        
        if (!userSentences || userSentences.length === 0) {
          setQueue([]);
          setCurrentQuestion(null);
          setLoading(false);
          return;
        }
        
        const sentenceIds = userSentences.map(s => s.sentence_id);
        
        const { data: sentences, error: sError } = await supabase
          .from("en_example_sentences")
          .select("*, en_words(word, meaning, level, part_of_speech)")
          .in("id", sentenceIds)
          .eq("is_approved", true);
        
        if (sError) throw sError;
        
        const validSentences = (sentences || []).filter(s => s.sentence_en && s.sentence_tr && s.en_words);
        setAllSentences(validSentences);
        const shuffledQueue = shuffle(validSentences);
        setQueue(shuffledQueue);
        setCurrentQuestion(shuffledQueue[0] || null);
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
  }, [userLevel]);

  // Şıkları oluştur
  useEffect(() => {
    if (!currentQuestion) return;
    setOptions(buildSentenceOptions(currentQuestion, allSentences, currentQuestion.word_id, choiceCount));
    setSelected(null);
    setAnswered(false);
  }, [currentQuestion, allSentences, choiceCount]);

  // useSentenceQuiz.js - saveSentenceResult
const saveSentenceResult = async (sentenceId, isCorrect) => {
  const now = new Date();
  let nextReviewDate = new Date();
  
  const { data: existing } = await supabase
    .from("en_user_sentences")
    .select("id, review_count, total_correct, total_wrong")
    .eq("user_id", FIXED_USER_ID)
    .eq("sentence_id", sentenceId)
    .single();
  
  if (isCorrect) {
    const newReviewCount = (existing?.review_count || 0) + 1;
    const newTotalCorrect = (existing?.total_correct || 0) + 1;
    
    // Tekrar aralığını hesapla (cümleler için daha kısa aralıklar)
    if (newReviewCount === 1) nextReviewDate.setDate(now.getDate() + 1);
    else if (newReviewCount === 2) nextReviewDate.setDate(now.getDate() + 3);
    else if (newReviewCount === 3) nextReviewDate.setDate(now.getDate() + 7);
    else nextReviewDate.setDate(now.getDate() + 14);
    
    await supabase
      .from("en_user_sentences")
      .update({
        next_review_at: nextReviewDate.toISOString(),
        review_count: newReviewCount,
        total_correct: newTotalCorrect,     // ⬅️ YENİ
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
        total_wrong: newTotalWrong,        // ⬅️ YENİ
        last_score: 0,
        last_reviewed_at: now.toISOString()
      })
      .eq("id", existing.id);
  }
};

  const handleSelect = async (opt, onComplete) => {
    if (answered || saving || !currentQuestion) return;
    const correctAnswer = currentQuestion.sentence_tr;
    const isCorrect = opt === correctAnswer;
    
    setSelected(opt);
    setAnswered(true);
    setSaving(true);
    
    await saveSentenceResult(currentQuestion.id, isCorrect);
    setSaving(false);
    onComplete(isCorrect);
  };

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
    setSelected,
    setAnswered
  };
}