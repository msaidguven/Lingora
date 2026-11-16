// src/HomeScreen.viewModel.js
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../config.js";
import { useAuth } from '../contexts/AuthContext';
import { getTurkeyTodayString } from "../utils/turkeyDate";

export function useHomeViewModel() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [totalWords, setTotalWords] = useState(0);
  const [myWordsCount, setMyWordsCount] = useState(0);
  const [totalSentences, setTotalSentences] = useState(0);
  const [mySentencesCount, setMySentencesCount] = useState(0);
  const [dueCount, setDueCount] = useState(0);
  const [dueSentenceCount, setDueSentenceCount] = useState(0);
  const [userLevel, setUserLevel] = useState("A1");
  const [buying, setBuying] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [recentLessons, setRecentLessons] = useState([]);
  const [lessonsLoading, setLessonsLoading] = useState(true);

  // Günlük kota (coin sisteminin yerine geçti)
  const [dailyWordQuota, setDailyWordQuota] = useState(5);
  const [dailyWordQuotaUsed, setDailyWordQuotaUsed] = useState(0);
  const [dailySentenceQuota, setDailySentenceQuota] = useState(20);
  const [dailySentenceQuotaUsed, setDailySentenceQuotaUsed] = useState(0);
  const [bonusWordsToday, setBonusWordsToday] = useState(0);
  const [bonusSentencesToday, setBonusSentencesToday] = useState(0);

  // Günlük hedef (bugünkü kelime/cümle doğru-yanlış sayıları)
  const [dailyWordCorrect, setDailyWordCorrect] = useState(0);
  const [dailyWordWrong, setDailyWordWrong] = useState(0);
  const [dailySentenceCorrect, setDailySentenceCorrect] = useState(0);
  const [dailySentenceWrong, setDailySentenceWrong] = useState(0);
  const [dailyStudySeconds, setDailyStudySeconds] = useState(0);

  // Yeni satın alınan kelime/cümlelerin tanıtım ekranı için state
  const [introItems, setIntroItems] = useState([]);
  const [introKind, setIntroKind] = useState(null); // "word" | "sentence" | null

  // Kalan hak (kota + reklam bonusu - kullanılan)
  const remainingWordAllowance = Math.max(0, dailyWordQuota + bonusWordsToday - dailyWordQuotaUsed);
  const remainingSentenceAllowance = Math.max(0, dailySentenceQuota + bonusSentencesToday - dailySentenceQuotaUsed);

  // Reklam izleme ödülü — coin yerine doğrudan bonus hak ekliyor.
  // kind: "word" | "sentence"
  const handleWatchAd = useCallback(async (kind = "word") => {
    if (!user) return;

    const { error } = await supabase.rpc("grant_ad_bonus", {
      p_user_id: user.id,
      p_kind: kind,
    });

    if (error) {
      console.error("Reklam ödülü kaydedilemedi:", error);
      return null;
    }

    if (kind === "word") {
      setBonusWordsToday((prev) => prev + 5);
    } else {
      setBonusSentencesToday((prev) => prev + 5);
    }

    return { kind, reward: 5 };
  }, [user]);

  // Verileri çek - Ana veri yükleme fonksiyonu
  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Yeni günse kotayı sıfırla (idempotent — cron gerekmez)
      const { error: resetError } = await supabase.rpc("reset_daily_quota_if_needed", { p_user_id: user.id });
      if (resetError) {
        console.error("⚠️ reset_daily_quota_if_needed hata verdi:", resetError);
      }

      const { data: userData } = await supabase
        .from("en_users")
        .select(
          "level, daily_word_quota, daily_word_quota_used, daily_sentence_quota, daily_sentence_quota_used, bonus_words_today, bonus_sentences_today"
        )
        .eq("id", user.id)
        .maybeSingle();

      const level = userData?.level || "A1";
      setUserLevel(level);
      setDailyWordQuota(userData?.daily_word_quota ?? 5);
      setDailyWordQuotaUsed(userData?.daily_word_quota_used ?? 0);
      setDailySentenceQuota(userData?.daily_sentence_quota ?? 20);
      setDailySentenceQuotaUsed(userData?.daily_sentence_quota_used ?? 0);
      setBonusWordsToday(userData?.bonus_words_today ?? 0);
      setBonusSentencesToday(userData?.bonus_sentences_today ?? 0);

      // "Bugün" — Türkiye saatine göre (stat_date bir date kolonu)
      const today = getTurkeyTodayString();

      const [
        totalRes,
        myWordsRes,
        totalSentencesRes,
        mySentencesRes,
        dueRes,
        dueSentencesRes,
        dailyStatsRes,
      ] = await Promise.all([
        supabase
          .from("en_words")
          .select("*", { count: "exact", head: true })
          .eq("level", level)
          .eq("type", "word"),
        supabase
          .from("en_user_words")
          .select("word_id, en_words!inner(level, type)", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("en_words.level", level)
          .eq("en_words.type", "word"),
        supabase
          .from("en_example_sentences")
          .select("*", { count: "exact", head: true })
          .eq("level", level)
          .eq("is_approved", true),
        supabase
          .from("en_user_sentences")
          .select("sentence_id, en_example_sentences!inner(level)", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("en_example_sentences.level", level),
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
        supabase
          .from("en_user_daily_stats")
          .select("word_correct, word_wrong, sentence_correct, sentence_wrong, study_seconds")
          .eq("user_id", user.id)
          .eq("stat_date", today)
          .maybeSingle(),
      ]);

      setTotalWords(totalRes.count || 0);
      setMyWordsCount(myWordsRes.count || 0);
      setTotalSentences(totalSentencesRes.count || 0);
      setMySentencesCount(mySentencesRes.count || 0);
      setDueCount(dueRes.count || 0);
      setDueSentenceCount(dueSentencesRes.count || 0);

      const stats = dailyStatsRes.data;
      setDailyWordCorrect(stats?.word_correct || 0);
      setDailyWordWrong(stats?.word_wrong || 0);
      setDailySentenceCorrect(stats?.sentence_correct || 0);
      setDailySentenceWrong(stats?.sentence_wrong || 0);
      setDailyStudySeconds(stats?.study_seconds || 0);
    } catch (error) {
      console.error("Veri çekme hatası:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Dersleri çek
  const fetchRecentLessons = useCallback(async () => {
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
  }, [user]);

  // reloadData - Tüm verileri yeniden yükler (sayfa görünür olduğunda çağrılacak)
  const reloadData = useCallback(async () => {
    console.log('🔄 Veriler yeniden yükleniyor...');
    await Promise.all([fetchData(), fetchRecentLessons()]);
  }, [fetchData, fetchRecentLessons]);

  // Yeni kelime al — SADECE ADAY KELİMELERİ ÇEKER, henüz kaydetmez/kota düşmez.
  const handleBuyWords = useCallback(async () => {
    if (!user) {
      alert("Lütfen giriş yapın!");
      return;
    }

    if (remainingWordAllowance <= 0) {
      alert("⚠️ Günlük kelime hakkın bitti. Reklam izleyerek veya premium ile artırabilirsin.");
      return;
    }

    setBuying(true);

    try {
      const limit = Math.min(5, remainingWordAllowance);
      const { data: newWords, error } = await supabase.rpc("get_new_words", {
        p_user_id: user.id,
        p_level: userLevel,
        p_limit: limit,
      });

      if (error) throw error;

      if (!newWords || newWords.length === 0) {
        alert("Tüm kelimeleri açtınız! 🎉");
        setBuying(false);
        return;
      }

      setIntroKind("word");
      setIntroItems(newWords.map((w) => ({ id: w.id, front: w.word, back: w.meaning })));
    } catch (error) {
      console.error("Hata:", error);
      alert("Bir hata oluştu! Lütfen tekrar deneyin.");
    }

    setBuying(false);
  }, [user, userLevel, remainingWordAllowance]);

  // Yeni cümle al
  const handleBuySentences = useCallback(async () => {
    if (!user) {
      alert("Lütfen giriş yapın!");
      return;
    }

    if (remainingSentenceAllowance <= 0) {
      alert("⚠️ Günlük cümle hakkın bitti. Reklam izleyerek veya premium ile artırabilirsin.");
      return;
    }

    setBuying(true);

    try {
      const limit = Math.min(5, remainingSentenceAllowance);
      const { data: newSentences, error } = await supabase.rpc("get_new_sentences", {
        p_user_id: user.id,
        p_level: userLevel,
        p_limit: limit,
      });

      if (error) throw error;

      if (!newSentences || newSentences.length === 0) {
        alert(`Bu seviyede (${userLevel}) açılacak cümle kalmadı! 🎉`);
        setBuying(false);
        return;
      }

      setIntroKind("sentence");
      setIntroItems(
        newSentences.map((s) => ({ id: s.id, front: s.sentence_en, back: s.sentence_tr }))
      );
    } catch (error) {
      console.error("Hata:", error);
      alert("Bir hata oluştu! Lütfen tekrar deneyin.");
    }

    setBuying(false);
  }, [user, userLevel, remainingSentenceAllowance]);

  // Tanıtım ekranı bitince çağrılır. Kayıt ekleme + kota artırma sunucuda
  // tek işlemde yapılır (claim_new_items) — istemci kota değeri yazmaz.
  const finishIntro = useCallback(async () => {
    if (!user || introItems.length === 0) return;

    setBuying(true);

    try {
      const { data: added, error } = await supabase.rpc("claim_new_items", {
        p_kind: introKind,
        p_ids: introItems.map((item) => item.id),
      });
      if (error) throw error;
      if (!added) {
        alert("Günlük hakkın bitmiş olabilir. Yarın tekrar dene.");
      }

      setIntroItems([]);
      setIntroKind(null);
      await reloadData(); // Kota ve sayılar sunucudan yeniden okunur
    } catch (error) {
      console.error("Havuza eklenirken hata:", error);
      alert("Bir hata oluştu, tekrar dener misin?");
    }

    setBuying(false);
  }, [user, introItems, introKind, reloadData]);

  // Kullanıcı tanıtım ekranını yarıda bırakmak isterse
  const cancelIntro = useCallback(() => {
    setIntroItems([]);
    setIntroKind(null);
  }, []);

  // useEffect - user değiştiğinde çalış
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Verileri yükle
    Promise.all([fetchData(), fetchRecentLessons()]).finally(() => {
      setMounted(true);
    });

    // Her 5 dakikada bir verileri yenile (opsiyonel)
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        reloadData();
      }
    }, 300000); // 5 dakika

    return () => {
      clearInterval(intervalId);
    };
  }, [user, fetchData, fetchRecentLessons, reloadData]);

  // Hesaplamalar
  const progress = totalWords > 0 ? Math.min(100, (myWordsCount / totalWords) * 100) : 0;
  const remainingWords = Math.max(0, totalWords - myWordsCount);
  const sentenceProgress = totalSentences > 0 ? Math.min(100, (mySentencesCount / totalSentences) * 100) : 0;
  const remainingSentences = Math.max(0, totalSentences - mySentencesCount);

  return {
    loading,
    totalWords,
    myWordsCount,
    totalSentences,
    mySentencesCount,
    dueCount,
    dueSentenceCount,
    userLevel,
    buying,
    mounted,
    recentLessons,
    lessonsLoading,
    progress,
    remainingWords,
    sentenceProgress,
    remainingSentences,
    dailyWordCorrect,
    dailyWordWrong,
    dailySentenceCorrect,
    dailySentenceWrong,
    dailyStudySeconds,
    dailyWordGoal: 100,
    dailySentenceGoal: 100,
    // Kota alanları (coinlerin yerine geçti)
    dailyWordQuota,
    dailyWordQuotaUsed,
    dailySentenceQuota,
    dailySentenceQuotaUsed,
    bonusWordsToday,
    bonusSentencesToday,
    remainingWordAllowance,
    remainingSentenceAllowance,
    handleBuyWords,
    handleBuySentences,
    handleWatchAd,
    introItems,
    introKind,
    finishIntro,
    cancelIntro,
    reloadData,
    onStartQuiz: null,
    onGoToLesson: null
  };
}