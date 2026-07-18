// src/HomeScreen.viewModel.js
import { useState, useEffect } from "react";
import { supabase } from "../config.js";
import { useAuth } from '../contexts/AuthContext';
import { getTurkeyTodayString } from "../utils/turkeyDate";

// Basit Fisher-Yates karıştırma — satın alınan kelime/cümlelerin her
// seferinde farklı 5'ini göstermek için. Havuzdan geniş bir aday listesi
// çekip burada karıştırıyoruz, DB tarafında ORDER BY random() gerekmiyor.
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
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
        supabase
          .from("en_user_words")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("en_example_sentences")
          .select("*", { count: "exact", head: true })
          .eq("level", level)
          .eq("is_approved", true),
        supabase
          .from("en_user_sentences")
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
  // Asıl kayıt + coin düşme işlemi finishIntro'da, kullanıcı tanıtım
  // kartlarını bitirip "Havuza Ekle" dediği anda olur.
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

      const { data: candidateWords } = await query.limit(200);

      if (!candidateWords || candidateWords.length === 0) {
        alert("Tüm kelimeleri açtınız! 🎉");
        setBuying(false);
        return;
      }

      const newWords = shuffleArray(candidateWords).slice(0, 5);

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
  // (İki dal aynı işi yapıyordu, tek akışta birleştirdim.)
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
      const { data: userSentences } = await supabase
        .from("en_user_sentences")
        .select("sentence_id")
        .eq("user_id", user.id);

      const learnedIds = userSentences?.map((s) => s.sentence_id) || [];

      let selectedSentences = [];

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
          if (data) allSentences = [...allSentences, ...data];
        }

        // Benzersiz yap (aynı cümle farklı chunk'larda gelebilir), sonra karıştır
        const uniqueMap = {};
        allSentences.forEach((s) => (uniqueMap[s.id] = s));
        selectedSentences = shuffleArray(Object.values(uniqueMap)).slice(0, 5);
      } else {
        const { data, error } = await supabase
          .from("en_example_sentences")
          .select("*")
          .eq("is_approved", true)
          .eq("level", userLevel)
          .limit(200);

        if (error) throw error;
        selectedSentences = shuffleArray(data || []).slice(0, 5);
      }

      if (selectedSentences.length === 0) {
        alert(`Bu seviyede (${userLevel}) açılacak cümle kalmadı! 🎉`);
        setBuying(false);
        return;
      }

      // Tanıtım ekranını aç. Henüz hiçbir şey kaydedilmedi, coin düşmedi.
      setIntroKind("sentence");
      setIntroItems(
        selectedSentences.map((s) => ({ id: s.id, front: s.sentence_en, back: s.sentence_tr }))
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
    introItems,
    introKind,
    finishIntro,
    cancelIntro,
    onStartQuiz: null,
    onGoToLesson: null
  };
}