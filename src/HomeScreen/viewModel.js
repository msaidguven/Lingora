// src/HomeScreen.viewModel.js
import { useState, useEffect } from "react";
import { supabase } from "../config.js";
import { useAuth } from '../contexts/AuthContext';

export function useHomeViewModel() {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [totalWords, setTotalWords] = useState(0);
  const [myWordsCount, setMyWordsCount] = useState(0);
  const [dailyRemaining, setDailyRemaining] = useState(0);
  const [dueCount, setDueCount] = useState(0);
  const [dueSentenceCount, setDueSentenceCount] = useState(0);
  const [userLevel, setUserLevel] = useState("A1");
  const [opening, setOpening] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [recentLessons, setRecentLessons] = useState([]);
  const [lessonsLoading, setLessonsLoading] = useState(true);

  // Verileri çek
  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Kullanıcı seviyesi
      const { data: userData } = await supabase
        .from("en_users")
        .select("level")
        .eq("id", user.id)
        .single();

      const level = userData?.level || "A1";
      setUserLevel(level);

      // Toplam kelimeler
      const { count: total } = await supabase
        .from("en_words")
        .select("*", { count: "exact", head: true })
        .eq("level", level)
        .eq("type", "word");

      // Kullanıcının kelimeleri
      const { count: myWords } = await supabase
        .from("en_user_words")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Günlük limit
      const { data: daily } = await supabase
        .from("en_user_daily_limit")
        .select("remaining_today")
        .eq("user_id", user.id)
        .single();

      // Vadesi geçmiş kelimeler
      const { count: due } = await supabase
        .from("en_user_words")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .lt("next_review_at", new Date().toISOString());

      // Vadesi geçmiş cümleler
      const { count: dueSentences } = await supabase
        .from("en_user_sentences")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .lt("next_review_at", new Date().toISOString());

      setTotalWords(total || 0);
      setMyWordsCount(myWords || 0);
      setDailyRemaining(daily?.remaining_today ?? 5);
      setDueCount(due || 0);
      setDueSentenceCount(dueSentences || 0);
    } catch (error) {
      console.error("Veri çekme hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  // Dersleri çek
  const fetchRecentLessons = async () => {
    if (!user) return;
    setLessonsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from("en_lessons")
        .select("id, lesson_number, title, level")
        .order("level")
        .order("lesson_number")
        .limit(3);

      if (error) throw error;
      
      const lessons = data || [];
      const lessonIds = lessons.map((lesson) => lesson.id);

      let progressByLessonId = {};
      if (lessonIds.length > 0) {
        const { data: progressData } = await supabase
          .from("en_user_lesson_progress")
          .select("lesson_id, completed, score")
          .eq("user_id", user.id)
          .in("lesson_id", lessonIds);

        progressByLessonId = (progressData || []).reduce((map, progress) => {
          map[progress.lesson_id] = progress;
          return map;
        }, {});
      }

      setRecentLessons(lessons.map((lesson) => ({
        ...lesson,
        progress: progressByLessonId[lesson.id] || null
      })));
    } catch (error) {
      console.error("Dersler çekilirken hata:", error);
    } finally {
      setLessonsLoading(false);
    }
  };

  // Yeni kelime aç
  const handleOpenNewWords = async () => {
    if (!user) {
      alert("Lütfen giriş yapın!");
      return;
    }

    if (dailyRemaining === 0) {
      alert("Bugünlük hakkın kalmadı! Yarın tekrar dene.");
      return;
    }

    setOpening(true);

    try {
      const { data: userWords } = await supabase
        .from("en_user_words")
        .select("word_id")
        .eq("user_id", user.id);

      const learnedIds = userWords?.map((w) => w.word_id) || [];

      let query = supabase
        .from("en_words")
        .select("*")
        .eq("level", userLevel)
        .eq("type", "word");

      if (learnedIds.length > 0) {
        query = query.not("id", "in", `(${learnedIds.join(",")})`);
      }

      const { data: newWords } = await query.limit(dailyRemaining);

      if (!newWords || newWords.length === 0) {
        alert("Tüm kelimeleri açtınız! 🎉");
        setOpening(false);
        return;
      }

      const now = new Date();
      const today = new Date();
      const newWordIds = newWords.map((w) => w.id);

      // Kelimeleri ekle
      const wordInserts = newWords.map((word) => ({
        user_id: user.id,
        word_id: word.id,
        added_at: now.toISOString(),
        next_review_at: today.toISOString(),
        review_count: 0,
        last_score: null,
        last_reviewed_at: null,
        ease_factor: 2.5,
        mastery_level: 0,
        is_mastered: false,
      }));

      const { error: wordError } = await supabase
        .from("en_user_words")
        .insert(wordInserts);

      if (wordError) throw wordError;

      // Cümleleri ekle
      const { data: sentences } = await supabase
        .from("en_example_sentences")
        .select("*")
        .in("word_id", newWordIds)
        .eq("is_approved", true);

      if (sentences && sentences.length > 0) {
        const sentenceInserts = sentences.map((sentence) => ({
          user_id: user.id,
          sentence_id: sentence.id,
          added_at: now.toISOString(),
          next_review_at: today.toISOString(),
          review_count: 0,
          last_score: null,
          last_reviewed_at: null,
          ease_factor: 2.5,
        }));

        await supabase
          .from("en_user_sentences")
          .insert(sentenceInserts);
      }

      // Günlük limiti güncelle
      await supabase
        .from("en_user_daily_limit")
        .update({ remaining_today: 0 })
        .eq("user_id", user.id);

      await fetchData();
      alert(`🎉 ${newWords.length} yeni kelime eklendi!`);
    } catch (error) {
      console.error("Hata:", error);
      alert("Bir hata oluştu! Lütfen tekrar deneyin.");
    }

    setOpening(false);
  };

  // useEffect - user değiştiğinde çalış
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    fetchData();
    fetchRecentLessons();
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, [user]);

  // Hesaplamalar
  const progress = totalWords > 0 ? (myWordsCount / totalWords) * 100 : 0;
  const remainingWords = totalWords - myWordsCount;

  return {
    loading,
    totalWords,
    myWordsCount,
    dailyRemaining,
    dueCount,
    dueSentenceCount,
    userLevel,
    opening,
    mounted,
    recentLessons,
    lessonsLoading,
    progress,
    remainingWords,
    handleOpenNewWords,
    onStartQuiz: null, // Parent'tan gelecek
    onGoToLesson: null // Parent'tan gelecek
  };
}