import { useState, useEffect } from "react";
import { supabase } from "../config.js";
import { useAuth } from "../contexts/AuthContext.jsx";

const ITEMS_PER_PAGE = 25;

const getMasteryBadge = (level, isMastered) => {
  if (!isMastered && level === 0) return null;

  if (level >= 9) return { emoji: "🏆", color: "#fbbf24", label: "Efsane Uzman", days: "180 gün" };
  if (level >= 8) return { emoji: "💎", color: "#c084fc", label: "Diamond Uzman", days: "120 gün" };
  if (level >= 7) return { emoji: "⭐", color: "#60a5fa", label: "Gold Uzman", days: "90 gün" };
  if (level >= 6) return { emoji: "🌟", color: "#34d399", label: "Silver Uzman", days: "60 gün" };
  if (level >= 5) return { emoji: "🔥", color: "#fb923c", label: "Bronz Uzman", days: "30 gün" };
  if (level >= 3) return { emoji: "📘", color: "#818cf8", label: "Bilgili", days: `${level === 3 ? 7 : 14} gün` };
  return { emoji: "📖", color: "#94a3b8", label: "Öğreniyor", days: `${level === 1 ? 1 : 3} gün` };
};

// Başarı oranına göre daisyUI semantic tonu (light/dark temada otomatik uyumlu)
const getAccuracyTone = (accuracy) => {
  if (accuracy >= 85) return "success";
  if (accuracy >= 60) return "warning";
  if (accuracy > 0) return "error";
  return "neutral";
};

const TONE_PILL_CLASSES = {
  success: "border-success/20 bg-success/10 text-success",
  warning: "border-warning/20 bg-warning/10 text-warning",
  error: "border-error/20 bg-error/10 text-error",
  primary: "border-primary/20 bg-primary/10 text-primary",
  neutral: "border-base-300 bg-base-300/40 text-base-content/40",
};

const TONE_PROGRESS_CLASSES = {
  success: "progress-success",
  warning: "progress-warning",
  error: "progress-error",
  neutral: "progress-neutral",
};

function StatPill({ value, label, tone }) {
  return (
    <div className={`rounded-[10px] border px-1 py-2 text-center ${TONE_PILL_CLASSES[tone] || TONE_PILL_CLASSES.neutral}`}>
      <div className="text-base font-extrabold leading-none">{value}</div>
      <div className="mt-1 text-[9px] font-semibold uppercase tracking-wider opacity-70">
        {label}
      </div>
    </div>
  );
}

export default function Dashboard({ userLevel }) {
  const { user } = useAuth();
  const userId = user?.id;

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("words"); // "words" veya "sentences"
  const [allWords, setAllWords] = useState([]);
  const [allSentences, setAllSentences] = useState([]);
  const [filteredWords, setFilteredWords] = useState([]);
  const [filteredSentences, setFilteredSentences] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("accuracy"); // accuracy, reviews, mastered
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (userId) {
      fetchStats();
    }
  }, [userId]);

  useEffect(() => {
    // Filtrele ve sırala
    filterAndSortData();
  }, [allWords, allSentences, searchTerm, sortBy]);

  const fetchStats = async () => {
    if (!userId) {
      console.error("❌ fetchStats: userId gereklidir!");
      return;
    }

    setLoading(true);

    try {
      // 1. Kelime istatistikleri
      const { data: userWords } = await supabase
        .from("en_user_words")
        .select(`
          word_id,
          review_count,
          mastery_level,
          is_mastered,
          total_correct,
          total_wrong,
          en_words (word, meaning, part_of_speech)
        `)
        .eq("user_id", userId);

      // 2. Cümle istatistikleri
      const { data: userSentences } = await supabase
        .from("en_user_sentences")
        .select(`
          sentence_id,
          review_count,
          total_correct,
          total_wrong,
          en_example_sentences (sentence_en, sentence_tr, word_id)
        `)
        .eq("user_id", userId);

      // 3. Kelimeleri düzenle
      const words = (userWords || [])
        .filter(uw => uw.en_words)
        .map(uw => {
          const totalCorrect = uw.total_correct || 0;
          const totalWrong = uw.total_wrong || 0;
          const totalReviews = totalCorrect + totalWrong;
          const accuracy = totalReviews > 0 ? Math.round((totalCorrect / totalReviews) * 100) : 0;

          return {
            id: uw.word_id,
            word: uw.en_words.word,
            meaning: uw.en_words.meaning,
            partOfSpeech: uw.en_words.part_of_speech || [],
            totalReviews: totalReviews,
            totalCorrect: totalCorrect,
            totalWrong: totalWrong,
            accuracy: accuracy,
            masteryLevel: uw.mastery_level || 0,
            isMastered: uw.is_mastered || false,
            reviewCount: uw.review_count || 0
          };
        });

      // 4. Cümleleri düzenle
      const sentences = (userSentences || [])
        .filter(us => us.en_example_sentences)
        .map(us => {
          const totalCorrect = us.total_correct || 0;
          const totalWrong = us.total_wrong || 0;
          const totalReviews = totalCorrect + totalWrong;
          const accuracy = totalReviews > 0 ? Math.round((totalCorrect / totalReviews) * 100) : 0;

          return {
            id: us.sentence_id,
            sentence: us.en_example_sentences.sentence_en,
            meaning: us.en_example_sentences.sentence_tr,
            wordId: us.en_example_sentences.word_id,
            totalReviews: totalReviews,
            totalCorrect: totalCorrect,
            totalWrong: totalWrong,
            accuracy: accuracy,
            reviewCount: us.review_count || 0
          };
        });

      setAllWords(words);
      setAllSentences(sentences);
      setFilteredWords(words);
      setFilteredSentences(sentences);

    } catch (error) {
      console.error("Veri çekme hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortData = () => {
    // Kelimeleri filtrele
    let filteredW = [...allWords];
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filteredW = filteredW.filter(w =>
        w.word.toLowerCase().includes(term) ||
        w.meaning.toLowerCase().includes(term)
      );
    }

    // Kelimeleri sırala
    filteredW.sort((a, b) => {
      if (sortBy === "accuracy") return b.accuracy - a.accuracy;
      if (sortBy === "reviews") return b.totalReviews - a.totalReviews;
      if (sortBy === "mastered") return (b.isMastered ? 1 : 0) - (a.isMastered ? 1 : 0);
      return 0;
    });
    setFilteredWords(filteredW);

    // Cümleleri filtrele
    let filteredS = [...allSentences];
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filteredS = filteredS.filter(s =>
        s.sentence.toLowerCase().includes(term) ||
        s.meaning.toLowerCase().includes(term)
      );
    }

    // Cümleleri sırala
    filteredS.sort((a, b) => {
      if (sortBy === "accuracy") return b.accuracy - a.accuracy;
      if (sortBy === "reviews") return b.totalReviews - a.totalReviews;
      return 0;
    });
    setFilteredSentences(filteredS);

    // Sayfayı sıfırla
    setCurrentPage(1);
  };

  const getCurrentItems = (items) => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return items.slice(startIndex, endIndex);
  };

  const totalPages = (items) => Math.ceil(items.length / ITEMS_PER_PAGE);

  const renderPagination = (items) => {
    const total = totalPages(items);
    if (total <= 1) return null;

    const pageNumbers = Array.from({ length: Math.min(total, 5) }, (_, i) => {
      if (total <= 5) return i + 1;
      if (currentPage <= 3) return i + 1;
      if (currentPage >= total - 2) return total - 4 + i;
      return currentPage - 2 + i;
    });

    return (
      <div className="mt-7 flex flex-wrap items-center justify-center gap-1.5">
        <button
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="btn btn-sm rounded-xl border-none bg-primary/10 text-xs font-semibold text-primary disabled:bg-transparent disabled:text-base-content/20"
        >
          ← Önceki
        </button>

        <div className="flex items-center gap-1">
          {pageNumbers.map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => setCurrentPage(pageNum)}
              className={`btn btn-sm btn-circle border text-xs ${currentPage === pageNum
                ? "border-primary bg-gradient-to-br from-primary to-secondary text-primary-content shadow-lg shadow-primary/30"
                : "border-base-300 bg-transparent font-medium text-base-content/40"
                }`}
            >
              {pageNum}
            </button>
          ))}
        </div>

        <button
          onClick={() => setCurrentPage(p => Math.min(total, p + 1))}
          disabled={currentPage === total}
          className="btn btn-sm rounded-xl border-none bg-primary/10 text-xs font-semibold text-primary disabled:bg-transparent disabled:text-base-content/20"
        >
          Sonraki →
        </button>
      </div>
    );
  };

  const renderStatCard = (item, type) => {
    const accuracyTone = getAccuracyTone(item.accuracy);
    const badge = type === "word" ? getMasteryBadge(item.masteryLevel, item.isMastered) : null;

    return (
      <div
        key={item.id}
        className="relative overflow-hidden rounded-2xl border border-base-300 bg-base-200 p-4.5 shadow-lg shadow-black/5"
      >
        {/* Sol mastery renk çizgisi */}
        {badge ? (
          <div
            className="absolute bottom-3 left-0 top-3 w-[3px] rounded-r-full"
            style={{ background: `linear-gradient(180deg, ${badge.color}, ${badge.color}55)` }}
          />
        ) : (
          <div className="absolute bottom-3 left-0 top-3 w-[3px] rounded-r-full bg-gradient-to-b from-primary to-primary/30" />
        )}

        {/* Başlık satırı */}
        <div className="mb-3.5 flex items-start justify-between gap-2.5 pl-2.5">
          <div className="min-w-0 flex-1">
            <div
              className={`overflow-hidden text-ellipsis whitespace-nowrap font-bold ${type === "word" ? "text-[17px] tracking-tight" : "text-sm"
                }`}
            >
              {type === "word" ? item.word : `"${item.sentence}"`}
            </div>
            <div className="mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap text-xs italic text-base-content/40">
              {item.meaning}
            </div>
          </div>

          {badge && (
            <div
              className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[10px] border px-2.5 py-1"
              style={{ background: `${badge.color}12`, borderColor: `${badge.color}25` }}
            >
              <span className="text-[11px]">{badge.emoji}</span>
              <span className="text-[10px] font-bold tracking-wide" style={{ color: badge.color }}>
                {badge.label}
              </span>
            </div>
          )}
        </div>

        {/* Stat pilleri */}
        <div className="mb-3 grid grid-cols-4 gap-1.5 pl-2.5">
          <StatPill value={item.totalCorrect} label="Doğru" tone="success" />
          <StatPill value={item.totalWrong} label="Yanlış" tone="error" />
          <StatPill value={`%${item.accuracy}`} label="Başarı" tone={accuracyTone} />
          <StatPill value={item.totalReviews} label="Tekrar" tone="primary" />
        </div>

        {/* İlerleme çubuğu */}
        <div className="pl-2.5">
          <progress
            className={`progress h-1 w-full ${TONE_PROGRESS_CLASSES[accuracyTone] || TONE_PROGRESS_CLASSES.neutral}`}
            value={item.accuracy}
            max="100"
          />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-base-100">
        <span className="loading loading-spinner loading-lg text-primary" />
        <span className="text-[13px] font-medium tracking-wide text-base-content/50">
          Veriler yükleniyor...
        </span>
      </div>
    );
  }

  const currentItems = activeTab === "words" ? getCurrentItems(filteredWords) : getCurrentItems(filteredSentences);
  const totalItems = activeTab === "words" ? filteredWords.length : filteredSentences.length;
  const currentTotalPages = totalPages(activeTab === "words" ? filteredWords : filteredSentences);

  return (
    <div className="min-h-screen bg-base-100 px-4 pb-12 pt-6 text-base-content">
      <div className="mx-auto max-w-[480px]">

        {/* ── HEADER ── */}
        <div className="mb-7 text-center">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-[4px] text-primary/70">
            Lingora
          </div>
          <h1 className="mb-3.5 bg-gradient-to-br from-base-content to-base-content/40 bg-clip-text font-display text-[26px] font-extrabold tracking-tight text-transparent">
            İstatistikler
          </h1>

          {/* Özet pill'ler */}
          <div className="flex justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-primary/10 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
              <span>📖</span>
              <span>{allWords.length} kelime</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-primary/10 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
              <span>📝</span>
              <span>{allSentences.length} cümle</span>
            </span>
          </div>
        </div>

        {/* ── ARAMA & FİLTRE ── */}
        <div className="mb-3.5 flex gap-2">
          <label className="input input-bordered flex flex-1 items-center gap-2 border-base-300 bg-base-200">
            <span className="text-sm text-base-content/30">🔍</span>
            <input
              type="text"
              placeholder="Kelime veya anlam ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="grow bg-transparent text-[13px] outline-none placeholder:text-base-content/30"
            />
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="select select-bordered w-auto shrink-0 border-base-300 bg-base-200 text-xs font-semibold"
          >
            <option value="accuracy">Başarı Oranı</option>
            <option value="reviews">Çözüm Sayısı</option>
            <option value="mastered">Ustalık</option>
          </select>
        </div>

        {/* ── TABS ── */}
        <div className="mb-4.5 flex gap-1 rounded-2xl border border-base-300 bg-base-200 p-1.5">
          <button
            onClick={() => { setActiveTab("words"); setCurrentPage(1); }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] font-bold transition-all duration-200 ${activeTab === "words"
              ? "bg-gradient-to-br from-primary to-secondary text-primary-content shadow-lg shadow-primary/30"
              : "text-base-content/40 hover:text-base-content/60"
              }`}
          >
            <span>📖</span>
            Kelimeler
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${activeTab === "words" ? "bg-white/20 text-primary-content" : "bg-primary/10 text-base-content/50"
                }`}
            >
              {filteredWords.length}
            </span>
          </button>
          <button
            onClick={() => { setActiveTab("sentences"); setCurrentPage(1); }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] font-bold transition-all duration-200 ${activeTab === "sentences"
              ? "bg-gradient-to-br from-primary to-secondary text-primary-content shadow-lg shadow-primary/30"
              : "text-base-content/40 hover:text-base-content/60"
              }`}
          >
            <span>📝</span>
            Cümleler
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${activeTab === "sentences" ? "bg-white/20 text-primary-content" : "bg-primary/10 text-base-content/50"
                }`}
            >
              {filteredSentences.length}
            </span>
          </button>
        </div>

        {/* ── İÇERİK ── */}
        {totalItems === 0 ? (
          <div className="rounded-[20px] border border-base-300 bg-base-200 px-6 py-12 text-center shadow-lg shadow-black/5">
            <div className="mb-3.5 text-4xl">🌱</div>
            <div className="mb-2 text-[15px] font-bold">
              {activeTab === "words" ? "Henüz kelime yok" : "Henüz cümle yok"}
            </div>
            <p className="m-0 text-[13px] leading-relaxed text-base-content/40">
              {activeTab === "words"
                ? "Ana sayfadan yeni kelimeler ekleyerek istatistiklerini görmeye başla!"
                : "Kelime ekledikçe cümleler otomatik olarak eklenecek."}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-3 text-right text-[11px] font-semibold tracking-wide text-base-content/30">
              {totalItems} {activeTab === "words" ? "kelime" : "cümle"} · Sayfa {currentPage}/{currentTotalPages}
            </div>

            <div className="flex flex-col gap-2.5">
              {currentItems.map(item => renderStatCard(item, activeTab === "words" ? "word" : "sentence"))}
            </div>

            {renderPagination(activeTab === "words" ? filteredWords : filteredSentences)}
          </>
        )}
      </div>
    </div>
  );
}