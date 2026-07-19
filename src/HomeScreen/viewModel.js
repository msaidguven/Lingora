// src/HomeScreen.viewModel.js
import { useState, useEffect } from "react";
import { supabase } from "../config.js";
import { useAuth } from '../contexts/AuthContext';
import { getTurkeyTodayString } from "../utils/turkeyDate";

// Reklam merdiveni — hesap ömrü boyunca izlenen TOPLAM reklam sayısına göre
// ödül belirler (günlük sıfırlanmıyor, limit yok; kullanıcı istediği kadar
// izleyebilir). adNumber = bu reklam kaçıncı reklam (1'den başlar).
// 12. reklamdan itibaren sabit 100 coin.
const AD_REWARD_LADDER = [1000, 700, 500, 500, 300, 300, 300, 300, 300, 200, 100];
const AD_REWARD_STANDARD = 100;

function getAdReward(adNumber) {
  if (adNumber >= 1 && adNumber <= AD_REWARD_LADDER.length) {
    return AD_REWARD_LADDER[adNumber - 1];
  }
  return AD_REWARD_STANDARD;
}

export function useHomeViewModel() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [totalWords, setTotalWords] = useState(0);
  const [myWordsCount, setMyWordsCount] = useState(0);
  const [totalSentences, setTotalSentences] = useState(0);
  const [mySentencesCount, setMySentencesCount] = useState(0);
  const [coins, setCoins] = useState(0);
  const [dueCount, setDueCount] = useState(0);
  const [dueSentenceCount, setDueSentenceCount] = useState(0);
  const [userLevel, setUserLevel] = useState("A1");
  const [buying, setBuying] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [recentLessons, setRecentLessons] = useState([]);
  const [lessonsLoading, setLessonsLoading] = useState(true);

  // Günlük hedef (bugünkü kelime/cümle doğru-yanlış sayıları)
  const [dailyWordCorrect, setDailyWordCorrect] = useState(0);
  const [dailyWordWrong, setDailyWordWrong] = useState(0);
  const [dailySentenceCorrect, setDailySentenceCorrect] = useState(0);
  const [dailySentenceWrong, setDailySentenceWrong] = useState(0);
  const [dailyStudySeconds, setDailyStudySeconds] = useState(0);

  // Yeni satın alınan kelime/cümlelerin tanıtım ekranı için state
  const [introItems, setIntroItems] = useState([]);
  const [introKind, setIntroKind] = useState(null); // "word" | "sentence" | null

  // Günlük bonus kontrolü (her gün ilk girişte +100 coin)
  const checkDailyBonus = async () => {
    if (!user) return;

    const today = getTurkeyTodayString();

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

  // Reklam izleme ödülü — reklam SDK'sının "reklam başarıyla tamamlandı"
  // callback'i içinden çağrılmalı. Günlük limit yok; her reklam, hesap
  // ömrü boyunca kaçıncı reklam olduğuna göre merdivenden ödül alır.
  const handleWatchAd = async () => {
    if (!user) return;

    const { data: userData } = await supabase
      .from("en_users")
      .select("coins, total_ads_watched")
      .eq("id", user.id)
      .single();

    if (!userData) return;

    const nextAdNumber = (userData.total_ads_watched || 0) + 1;
    const reward = getAdReward(nextAdNumber);
    const newCoins = (userData.coins || 0) + reward;

    const { error } = await supabase
      .from("en_users")
      .update({
        coins: newCoins,
        total_ads_watched: nextAdNumber,
      })
      .eq("id", user.id);

    if (error) {
      console.error("Reklam ödülü kaydedilemedi:", error);
      return;
    }

    setCoins(newCoins);
    window.dispatchEvent(new CustomEvent('coinUpdated', { detail: { coins: newCoins } }));

    return { reward, adNumber: nextAdNumber };
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
        // NOT: en_words ile inner join yapıp sadece MEVCUT SEVİYEDEKİ
        // kelimeleri sayıyoruz. Önceden burada seviye filtresi yoktu,
        // bu yüzden kullanıcı birden fazla seviyede kelime öğrenmişse
        // (örn. A1'den B1'e geçmişse) ilerleme yüzdesi (myWordsCount/
        // totalWords) yanlış hesaplanıyor, hatta %100'ü aşabiliyordu.
        supabase
          .from("en_user_words")
          .select("word_id, en_words!inner(level)", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("en_words.level", level),
        supabase
          .from("en_example_sentences")
          .select("*", { count: "exact", head: true })
          .eq("level", level)
          .eq("is_approved", true),
        // Aynı düzeltme cümleler için de geçerli — en_example_sentences
        // ile inner join yapıp sadece mevcut seviyedeki cümleleri sayıyoruz.
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

  // 5 Kelime Al — SADECE ADAY KELİMELERİ ÇEKER, henüz kaydetmez/coin düşmez.
  // Filtreleme ve rastgele seçim artık sunucu tarafında (get_new_words RPC,
  // NOT EXISTS + ORDER BY random()) yapılıyor. Client'tan öğrenilen id
  // listesi göndermiyoruz — büyük id listelerinde URL uzunluk limitine
  // takılma (400 Bad Request) sorunu tamamen ortadan kalktı.
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
      const { data: newWords, error } = await supabase.rpc("get_new_words", {
        p_user_id: user.id,
        p_level: userLevel,
        p_limit: 5,
      });

      if (error) throw error;

      if (!newWords || newWords.length === 0) {
        alert("Tüm kelimeleri açtınız! 🎉");
        setBuying(false);
        return;
      }

      // Tanıtım ekranını aç. Henüz hiçbir şey kaydedilmedi, coin düşmedi —
      // kullanıcı sayfayı şimdi kapatsa bile hiçbir şey kaybetmez.
      setIntroKind("word");
      setIntroItems(newWords.map((w) => ({ id: w.id, front: w.word, back: w.meaning })));
    } catch (error) {
      console.error("Hata:", error);
      alert("Bir hata oluştu! Lütfen tekrar deneyin.");
    }

    setBuying(false);
  };

  // 5 Cümle Al — SADECE ADAY CÜMLELERİ ÇEKER, henüz kaydetmez/coin düşmez.
  // Filtreleme ve rastgele seçim artık sunucu tarafında (get_new_sentences
  // RPC) yapılıyor.
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
      const { data: newSentences, error } = await supabase.rpc("get_new_sentences", {
        p_user_id: user.id,
        p_level: userLevel,
        p_limit: 5,
      });

      if (error) throw error;

      if (!newSentences || newSentences.length === 0) {
        alert(`Bu seviyede (${userLevel}) açılacak cümle kalmadı! 🎉`);
        setBuying(false);
        return;
      }

      // Tanıtım ekranını aç. Henüz hiçbir şey kaydedilmedi, coin düşmedi.
      setIntroKind("sentence");
      setIntroItems(
        newSentences.map((s) => ({ id: s.id, front: s.sentence_en, back: s.sentence_tr }))
      );
    } catch (error) {
      console.error("Hata:", error);
      alert("Bir hata oluştu! Lütfen tekrar deneyin.");
    }

    setBuying(false);
  };

  // Tanıtım ekranı bitince çağrılır — kelimeleri/cümleleri GERÇEKTEN burada
  // kaydediyoruz ve coin'i şimdi düşüyoruz. Bu ana kadar hiçbir şey
  // kalıcı değildi, yani kullanıcı buraya gelmeden vazgeçtiyse (cancelIntro)
  // veya sayfayı kapattıysa hiçbir kayıp/artık veri olmuyor.
  const finishIntro = async () => {
    if (!user || introItems.length === 0) return;

    // Akış sırasında coin durumu değişmiş olabilir (başka sekme vb.),
    // son anda tekrar kontrol edelim.
    if (coins < 50) {
      alert("⚠️ Coin yetersiz kaldı. Daha fazla çalışıp coin kazanman gerekiyor.");
      setIntroItems([]);
      setIntroKind(null);
      return;
    }

    setBuying(true);

    try {
      const now = new Date().toISOString();

      if (introKind === "word") {
        const inserts = introItems.map((item) => ({
          user_id: user.id,
          word_id: item.id,
          added_at: now,
          next_review_at: now,
          review_count: 0,
          last_score: null,
          last_reviewed_at: null,
          ease_factor: 2.5,
          mastery_level: 0,
          is_mastered: false,
        }));
        const { error } = await supabase.from("en_user_words").insert(inserts);
        if (error) throw error;
      } else if (introKind === "sentence") {
        const inserts = introItems.map((item) => ({
          user_id: user.id,
          sentence_id: item.id,
          added_at: now,
          next_review_at: now,
          review_count: 0,
          last_score: null,
          last_reviewed_at: null,
          ease_factor: 2.5,
        }));
        const { error } = await supabase.from("en_user_sentences").insert(inserts);
        if (error) throw error;
      }

      const newCoins = coins - 50;
      await supabase.from("en_users").update({ coins: newCoins }).eq("id", user.id);
      setCoins(newCoins);
      window.dispatchEvent(new CustomEvent('coinUpdated', { detail: { coins: newCoins } }));

      setIntroItems([]);
      setIntroKind(null);
      await fetchData();
    } catch (error) {
      console.error("Havuza eklenirken hata:", error);
      alert("Bir hata oluştu, tekrar dener misin?");
    }

    setBuying(false);
  };

  // Kullanıcı tanıtım ekranını yarıda bırakmak isterse — hiçbir şey
  // kaydedilmediği ve coin düşmediği için tamamen güvenli, sadece
  // ekranı kapatıyoruz.
  const cancelIntro = () => {
    setIntroItems([]);
    setIntroKind(null);
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
  const sentenceProgress = totalSentences > 0 ? (mySentencesCount / totalSentences) * 100 : 0;
  const remainingSentences = totalSentences - mySentencesCount;

  return {
    loading,
    totalWords,
    myWordsCount,
    totalSentences,
    mySentencesCount,
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
    sentenceProgress,
    remainingSentences,
    dailyWordCorrect,
    dailyWordWrong,
    dailySentenceCorrect,
    dailySentenceWrong,
    dailyStudySeconds,
    dailyWordGoal: 100,
    dailySentenceGoal: 100,
    handleBuyWords,
    handleBuySentences,
    handleWatchAd,
    introItems,
    introKind,
    finishIntro,
    cancelIntro,
    onStartQuiz: null,
    onGoToLesson: null
  };
}