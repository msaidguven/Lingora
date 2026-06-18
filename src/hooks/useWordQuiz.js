// hooks/useWordQuiz.js
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../config.js";
import { shuffle, buildWordOptions } from "../utils/quizHelpers.js";
import { updateDailyStats } from "../utils/dailyStats.js";

const FIXED_USER_ID = "302a3b6b-c1e9-49c4-98fe-52115bd7d204";
const BATCH_SIZE = 20;

export function useWordQuiz(userLevel) {
  // Batch state'leri
  const [allWordIds, setAllWordIds] = useState([]);
  const [offset, setOffset] = useState(0);
  const [currentBatch, setCurrentBatch] = useState([]);
  const [totalBatches, setTotalBatches] = useState(0);
  const [currentBatchNumber, setCurrentBatchNumber] = useState(1);
  
  // Quiz state'leri
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [saving, setSaving] = useState(false);
  const [examplesMap, setExamplesMap] = useState({});
  
  // İstatistikler
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [isBatchComplete, setIsBatchComplete] = useState(false);
  const [isAllComplete, setIsAllComplete] = useState(false);

  const choiceCount = { A1: 3, A2: 3, B1: 4, B2: 4 }[userLevel] || 4;

  // 1. Önce tüm kelime ID'lerini çek (sadece ID'ler)
  useEffect(() => {
    async function fetchWordIds() {
      setLoading(true);
      setError(null);
      try {
        // Tekrar edilecek kelimeleri bul
        const { data: userWords, error: uwError } = await supabase
          .from("en_user_words")
          .select("word_id")
          .eq("user_id", FIXED_USER_ID)
          .lt("next_review_at", new Date().toISOString());
        
        if (uwError) throw uwError;
        
        if (!userWords || userWords.length === 0) {
          setAllWordIds([]);
          setTotalBatches(0);
          setLoading(false);
          return;
        }
        
        // ID'leri topla ve karıştır
        const ids = userWords.map(w => w.word_id);
        const shuffledIds = shuffle(ids);
        setAllWordIds(shuffledIds);
        
        // Toplam batch sayısını hesapla
        const total = Math.ceil(shuffledIds.length / BATCH_SIZE);
        setTotalBatches(total);
        setCurrentBatchNumber(1);
        setOffset(0);
        
        // İlk batch'i yükle
        await loadBatch(shuffledIds, 0);
        
      } catch (err) {
        console.error("Veri yükleme hatası:", err);
        setError("Veriler yüklenemedi.");
        setLoading(false);
      }
    }
    
    fetchWordIds();
  }, [userLevel]);

  // 2. Batch yükleme fonksiyonu
  const loadBatch = async (ids, startOffset) => {
    setLoading(true);
    try {
      const batchIds = ids.slice(startOffset, startOffset + BATCH_SIZE);
      
      if (batchIds.length === 0) {
        setQueue([]);
        setCurrentQuestion(null);
        setIsAllComplete(true);
        setLoading(false);
        return;
      }
      
      // Kelimeleri çek
      const { data: words, error: wError } = await supabase
        .from("en_words")
        .select("*")
        .in("id", batchIds);
      
      if (wError) throw wError;
      
      // Kelimeleri karıştır
      const shuffledWords = shuffle(words || []);
      setCurrentBatch(shuffledWords);
      setQueue(shuffledWords);
      setQueueIndex(0);
      setCurrentQuestion(shuffledWords[0] || null);
      setIsBatchComplete(false);
      setCorrectCount(0);
      setWrongCount(0);
      
      // Örnek cümleleri çek
      if (batchIds.length > 0) {
        const { data: examples } = await supabase
          .from("en_example_sentences")
          .select("*")
          .in("word_id", batchIds)
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
      
      setOffset(startOffset + BATCH_SIZE);
      setCurrentBatchNumber(Math.floor(startOffset / BATCH_SIZE) + 1);
      
    } catch (err) {
      console.error("Batch yükleme hatası:", err);
      setError("Kelimeler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Sonraki batch'i yükle
  const loadNextBatch = useCallback(async () => {
    if (offset >= allWordIds.length) {
      setIsAllComplete(true);
      return;
    }
    await loadBatch(allWordIds, offset);
  }, [allWordIds, offset]);

  // 4. Şıkları oluştur
  useEffect(() => {
    if (!currentQuestion) return;
    setOptions(buildWordOptions(currentQuestion, currentBatch, choiceCount));
    setSelected(null);
    setAnswered(false);
  }, [currentQuestion, currentBatch, choiceCount]);

  // 5. Kelime sonucunu kaydet
  const saveWordResult = async (wordId, isCorrect) => {
    const now = new Date();
    let nextReviewDate = new Date();
    
    const { data: existing, error: findError } = await supabase
      .from("en_user_words")
      .select("id, review_count, total_correct, total_wrong")
      .eq("user_id", FIXED_USER_ID)
      .eq("word_id", wordId)
      .single();
    
    if (findError) throw findError;
    if (!existing) return;
    
    if (isCorrect) {
      const newReviewCount = (existing.review_count || 0) + 1;
      const newTotalCorrect = (existing.total_correct || 0) + 1;
      
      // Tekrar aralığını hesapla
      if (newReviewCount === 1) nextReviewDate.setDate(now.getDate() + 1);
      else if (newReviewCount === 2) nextReviewDate.setDate(now.getDate() + 3);
      else if (newReviewCount === 3) nextReviewDate.setDate(now.getDate() + 7);
      else if (newReviewCount === 4) nextReviewDate.setDate(now.getDate() + 14);
      else if (newReviewCount >= 5) nextReviewDate.setDate(now.getDate() + 30);
      
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
      const newTotalWrong = (existing.total_wrong || 0) + 1;
      nextReviewDate.setTime(now.getTime() + 3 * 60 * 60 * 1000);
      
      await supabase
        .from("en_user_words")
        .update({
          next_review_at: nextReviewDate.toISOString(),
          review_count: 0,
          total_wrong: newTotalWrong,
          last_score: 0,
          last_reviewed_at: now.toISOString(),
          mastery_level: 0,
          is_mastered: false
        })
        .eq("id", existing.id);
    }
  };

  // 6. Cevap seçildiğinde
  const handleSelect = async (opt, onComplete) => {
    if (answered || saving || !currentQuestion) return;
    
    const isCorrect = opt === currentQuestion.meaning;
    
    setSelected(opt);
    setAnswered(true);
    setSaving(true);
    
    // İstatistikleri güncelle
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
    } else {
      setWrongCount(prev => prev + 1);
    }
    
    // Kelime sonucunu kaydet
    await saveWordResult(currentQuestion.id, isCorrect);
    
    // Günlük istatistiği güncelle
    await updateDailyStats('word', isCorrect);
    
    setSaving(false);
    onComplete(isCorrect);
  };

  // 7. Sonraki soruya geç veya batch'i bitir
  const handleNext = useCallback(() => {
    if (saving) return;
    
    const nextIndex = queueIndex + 1;
    
    // Batch bitti mi?
    if (nextIndex >= queue.length) {
      setIsBatchComplete(true);
      return null;
    }
    
    // Sonraki soruya geç
    setQueueIndex(nextIndex);
    setCurrentQuestion(queue[nextIndex]);
    setSelected(null);
    setAnswered(false);
    return queue[nextIndex];
  }, [queueIndex, queue, saving]);

  // 8. Batch'i yeniden başlat (tekrar deneme için)
  const resetBatch = useCallback(() => {
    const shuffled = shuffle(currentBatch);
    setQueue(shuffled);
    setQueueIndex(0);
    setCurrentQuestion(shuffled[0] || null);
    setIsBatchComplete(false);
    setCorrectCount(0);
    setWrongCount(0);
    setSelected(null);
    setAnswered(false);
  }, [currentBatch]);

  // 9. Sıradaki batch'e geç
  const goToNextBatch = useCallback(async () => {
    await loadNextBatch();
  }, [loadNextBatch]);

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
    correctCount,
    wrongCount,
    isBatchComplete,
    isAllComplete,
    currentBatchNumber,
    totalBatches,
    handleSelect,
    handleNext,
    resetBatch,
    goToNextBatch,
    setSelected,
    setAnswered,
    setExamplesMap,
    setCurrentQuestion,
  };
}