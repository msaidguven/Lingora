// hooks/useHomeData.js
import { useState, useEffect } from "react";
import { supabase } from "../config.js";
import { FIXED_USER_ID } from "../components/home/constants.js";

export function useHomeData() {
  const [loading, setLoading] = useState(true);
  const [totalWords, setTotalWords] = useState(0);
  const [myWordsCount, setMyWordsCount] = useState(0);
  const [dailyRemaining, setDailyRemaining] = useState(0);
  const [dueCount, setDueCount] = useState(0);
  const [dueSentenceCount, setDueSentenceCount] = useState(0);
  const [userLevel, setUserLevel] = useState("A1");
  const [recentLessons, setRecentLessons] = useState([]);
  const [lessonsLoading, setLessonsLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);

    const { data: user } = await supabase
      .from("en_users")
      .select("level")
      .eq("id", FIXED_USER_ID)
      .maybeSingle();

    const level = user?.level || "A1";
    setUserLevel(level);

    const { count: total } = await supabase
      .from("en_words")
      .select("*", { count: "exact", head: true })
      .eq("level", level)
      .eq("type", "word");

    const { count: myWords } = await supabase
      .from("en_user_words")
      .select("*", { count: "exact", head: true })
      .eq("user_id", FIXED_USER_ID);

    const { data: daily } = await supabase
      .from("en_user_daily_limit")
      .select("remaining_today")
      .eq("user_id", FIXED_USER_ID)
      .maybeSingle();

    const { count: due } = await supabase
      .from("en_user_words")
      .select("*", { count: "exact", head: true })
      .eq("user_id", FIXED_USER_ID)
      .lt("next_review_at", new Date().toISOString());

    const { count: dueSentences } = await supabase
      .from("en_user_sentences")
      .select("*", { count: "exact", head: true })
      .eq("user_id", FIXED_USER_ID)
      .lt("next_review_at", new Date().toISOString());

    setTotalWords(total || 0);
    setMyWordsCount(myWords || 0);
    setDailyRemaining(daily?.remaining_today ?? 5);
    setDueCount(due || 0);
    setDueSentenceCount(dueSentences || 0);
    setLoading(false);
  };

  const fetchRecentLessons = async () => {
    setLessonsLoading(true);
    try {
      const { data, error } = await supabase
        .from("en_lessons")
        .select("id, lesson_number, title, level")
        .order("level")
        .order("lesson_number")
        .limit(3);

      if (error) throw error;
      setRecentLessons(data || []);
    } catch (error) {
      console.error("Dersler çekilirken hata:", error);
    } finally {
      setLessonsLoading(false);
    }
  };

  const openNewWords = async () => {
    if (dailyRemaining === 0) {
      alert("Bugünlük hakkın kalmadı! Yarın tekrar dene.");
      return { success: false };
    }

    try {
      const { data: userWords } = await supabase
        .from("en_user_words")
        .select("word_id")
        .eq("user_id", FIXED_USER_ID);

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
        alert("Tüm kelimeleri açtınız!");
        return { success: false };
      }

      const now = new Date();
      const today = new Date();
      const newWordIds = newWords.map((w) => w.id);

      const wordInserts = newWords.map((word) => ({
        user_id: FIXED_USER_ID,
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

      const { data: sentences } = await supabase
        .from("en_example_sentences")
        .select("*")
        .in("word_id", newWordIds)
        .eq("is_approved", true);

      if (sentences && sentences.length > 0) {
        const sentenceInserts = sentences.map((sentence) => ({
          user_id: FIXED_USER_ID,
          sentence_id: sentence.id,
          added_at: now.toISOString(),
          next_review_at: today.toISOString(),
          review_count: 0,
          last_score: null,
          last_reviewed_at: null,
          ease_factor: 2.5,
        }));

        const { error: sentenceError } = await supabase
          .from("en_user_sentences")
          .insert(sentenceInserts);

        if (sentenceError) {
          console.error("Cümle ekleme hatası:", sentenceError);
        }
      }

      await supabase
        .from("en_user_daily_limit")
        .update({ remaining_today: 0 })
        .eq("user_id", FIXED_USER_ID);

      await fetchData();
      alert(`${newWords.length} yeni kelime eklendi!`);
      return { success: true };
    } catch (error) {
      console.error("Hata:", error);
      alert("Bir hata oluştu!");
      return { success: false };
    }
  };

  useEffect(() => {
    fetchData();
    fetchRecentLessons();
  }, []);

  return {
    loading,
    totalWords,
    myWordsCount,
    dailyRemaining,
    dueCount,
    dueSentenceCount,
    userLevel,
    recentLessons,
    lessonsLoading,
    fetchData,
    openNewWords,
  };
}