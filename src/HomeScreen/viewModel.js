// src/HomeScreen.viewModel.js
import { useState, useEffect } from "react";
import { supabase } from "../config.js";
import { useAuth } from '../contexts/AuthContext';

export function useHomeViewModel() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [totalWords, setTotalWords] = useState(0);
  const [myWordsCount, setMyWordsCount] = useState(0);
  const [coins, setCoins] = useState(0);
  const [dueCount, setDueCount] = useState(0);
  const [dueSentenceCount, setDueSentenceCount] = useState(0);
  const [userLevel, setUserLevel] = useState("A1");
  const [buying, setBuying] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [recentLessons, setRecentLessons] = useState([]);
  const [lessonsLoading, setLessonsLoading] = useState(true);

  // Günlük bonus kontrolü (her gün ilk girişte +100 coin)
  const checkDailyBonus = async () => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];

    const { data: userData } = await supabase
      .from("en_users")
      .select("coins, last_daily_bonus_at")
      .eq("id", user.id)
      .single();

    if (!userData) return;

    const lastBonusDate = userData.last_daily_bonus_at?.split('T')[0] || null;

    if (lastBonusDate !== today) {
      const newCoins = (userData.coins || 0) + 100;

      await supabase
        .from("en_users")
        .update({
          coins: newCoins,
          last_daily_bonus_at: today
        })
        .eq("id", user.id);

      setCoins(newCoins);
      console.log(`🎁 Günlük 100 coin bonusu eklendi! Yeni bakiye: ${newCoins}`);
    } else {
      setCoins(userData.coins || 0);
    }
  };

  // Verileri çek
  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data: userData } = await supabase
        .from("en_users")
        .select("level, coins, last_daily_bonus_at")
        .eq("id", user.id)
        .maybeSingle();

      const level = userData?.level || "A1";
      setUserLevel(level);
      setCoins(userData?.coins || 0);

      await checkDailyBonus();

      const [
        totalRes,
        myWordsRes,
        dueRes,
        dueSentencesRes,
      ] = await Promise.all([
        supabase
          .from("en_words")
          .select("*", { count: "exact", head: true })
          .eq("level", level)
          .eq("type", "word"),
        supabase
          .from("en_user_words")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("en_user_words")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .lt("next_review_at", new Date().toISOString()),
        supabase
          .from("en_user_sentences")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .lt("next_review_at", new Date().toISOString()),
      ]);

      setTotalWords(totalRes.count || 0);
      setMyWordsCount(myWordsRes.count || 0);
      setDueCount(dueRes.count || 0);
      setDueSentenceCount(dueSentencesRes.count || 0);
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

  // 5 Kelime Satın Al (50 Coin) - SADECE KELİME, CÜMLE YOK
  const handleBuyWords = async () => {
    if (!user) {
      alert("Lütfen giriş yapın!");
      return;
    }

    if (coins < 50) {
      alert("⚠️ Yetersiz coin! Daha fazla kelime çalışarak coin kazanabilirsin.");
      return;
    }

    setBuying(true);

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

      const { data: newWords } = await query.limit(5);

      if (!newWords || newWords.length === 0) {
        alert("Tüm kelimeleri açtınız! 🎉");
        setBuying(false);
        return;
      }

      const now = new Date();
      const today = new Date();

      // SADECE KELİMELERİ EKLE (cümle ekleme yok)
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

      // 50 coin düş
      const newCoins = coins - 50;
      await supabase
        .from("en_users")
        .update({ coins: newCoins })
        .eq("id", user.id);

      setCoins(newCoins);
      window.dispatchEvent(new CustomEvent('coinUpdated', { detail: { coins: newCoins } }));

      await fetchData();
      alert(`🎉 ${newWords.length} yeni kelime eklendi! Kalan coin: ${newCoins}`);
    } catch (error) {
      console.error("Hata:", error);
      alert("Bir hata oluştu! Lütfen tekrar deneyin.");
    }

    setBuying(false);
  };

// 5 Cümle Satın Al (50 Coin) - YENİ (level ile, JOIN yok)
const handleBuySentences = async () => {
  if (!user) {
    alert("Lütfen giriş yapın!");
    return;
  }

  if (coins < 50) {
    alert("⚠️ Yetersiz coin! Daha fazla kelime çalışarak coin kazanabilirsin.");
    return;
  }

  setBuying(true);

  try {
    // 1. Kullanıcının mevcut cümle ID'lerini al
    const { data: userSentences } = await supabase
      .from("en_user_sentences")
      .select("sentence_id")
      .eq("user_id", user.id);

    const learnedIds = userSentences?.map((s) => s.sentence_id) || [];

    // 2. Doğrudan level'e göre sorgu (JOIN YOK!)
    let query = supabase
      .from("en_example_sentences")
      .select("*")
      .eq("is_approved", true)
      .eq("level", userLevel);

    // Öğrenilmiş cümleleri hariç tut
    if (learnedIds.length > 0) {
      // chunk'lara böl (Supabase URL limiti için)
      const chunkSize = 500;
      let allSentences = [];
      
      for (let i = 0; i < learnedIds.length; i += chunkSize) {
        const chunk = learnedIds.slice(i, i + chunkSize);
        const { data, error } = await supabase
          .from("en_example_sentences")
          .select("*")
          .eq("is_approved", true)
          .eq("level", userLevel)
          .not("id", "in", `(${chunk.join(",")})`);
        
        if (error) throw error;
        if (data) {
          allSentences = [...allSentences, ...data];
        }
      }
      
      // Benzersiz yap (aynı cümle farklı chunk'larda gelebilir)
      const uniqueMap = {};
      allSentences.forEach(s => uniqueMap[s.id] = s);
      allSentences = Object.values(uniqueMap);
      
      const newSentences = allSentences.slice(0, 5);
      
      if (newSentences.length === 0) {
        alert(`Bu seviyede (${userLevel}) açılacak cümle kalmadı! 🎉`);
        setBuying(false);
        return;
      }
      
      // Cümleleri ekle
      const now = new Date();
      const today = new Date();
      
      const sentenceInserts = newSentences.map((sentence) => ({
        user_id: user.id,
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
      
      if (sentenceError) throw sentenceError;
      
    } else {
      // Hiç cümle öğrenilmemiş, doğrudan çek
      const { data: newSentences, error } = await supabase
        .from("en_example_sentences")
        .select("*")
        .eq("is_approved", true)
        .eq("level", userLevel)
        .limit(5);
      
      if (error) throw error;
      
      if (!newSentences || newSentences.length === 0) {
        alert(`Bu seviyede (${userLevel}) açılacak cümle kalmadı! 🎉`);
        setBuying(false);
        return;
      }
      
      const now = new Date();
      const today = new Date();
      
      const sentenceInserts = newSentences.map((sentence) => ({
        user_id: user.id,
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
      
      if (sentenceError) throw sentenceError;
    }

    // 50 coin düş
    const newCoins = coins - 50;
    await supabase
      .from("en_users")
      .update({ coins: newCoins })
      .eq("id", user.id);

    setCoins(newCoins);
    window.dispatchEvent(new CustomEvent('coinUpdated', { detail: { coins: newCoins } }));

    await fetchData();
    alert(`🎉 5 yeni cümle eklendi! Kalan coin: ${newCoins}`);
    
  } catch (error) {
    console.error("Hata:", error);
    alert("Bir hata oluştu! Lütfen tekrar deneyin.");
  }

  setBuying(false);
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
    coins,
    dueCount,
    dueSentenceCount,
    userLevel,
    buying,
    mounted,
    recentLessons,
    lessonsLoading,
    progress,
    remainingWords,
    handleBuyWords,
    handleBuySentences,
    onStartQuiz: null,
    onGoToLesson: null
  };
}