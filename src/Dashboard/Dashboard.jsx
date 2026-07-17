// src/Dashboard.jsx
import { useState, useEffect } from "react";
import { supabase } from "../config.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import {
  DOGEAR,
  SectionTitle,
  LegendDot,
  NotebookTheme,
} from "../theme/notebook";

const ITEMS_PER_PAGE = 25;

// ---------------------------------------------------------------------------
// Design language: HomeScreen ile aynı "graded notebook" dili — kırmızı kalem
// damgaları, kesik çizgili kartlar, dog-ear köşeler. Renkler NotebookTheme'in
// light-dark() CSS değişkenlerinden geliyor, tema adı burada hardcode değil.
// Mastery rozetleri (altın/gümüş/elmas vb.) bilinçli olarak temadan bağımsız
// sabit renkler kullanıyor — bunlar koleksiyon rozeti/sticker mantığında,
// logo rengi gibi her iki temada da aynı kalması gereken vurgular.
// ---------------------------------------------------------------------------

// Mastery seviyesi = rütbe/oyunlaştırma katmanı. Zamanlamayla (next_review_at)
// hiçbir ilgisi yok — sadece "bu kelimede ne kadar iyisin" sorusuna cevap verir.
// Config-tabanlı: yeni seviye eklemek veya eşik değiştirmek tek satırlık iş.
const MASTERY_STAMPS = [
  { minLevel: 9, emoji: "🏆", color: "#d97706", label: "Efsane Uzman" },
  { minLevel: 8, emoji: "💎", color: "#9333ea", label: "Elmas Uzman" },
  { minLevel: 7, emoji: "⭐", color: "#2563eb", label: "Altın Uzman" },
  { minLevel: 6, emoji: "🌟", color: "#059669", label: "Gümüş Uzman" },
  { minLevel: 5, emoji: "🔥", color: "#ea580c", label: "Bronz Uzman" },
  { minLevel: 3, emoji: "📘", color: "#4f46e5", label: "Bilgili" },
  { minLevel: 1, emoji: "📖", color: "#64748b", label: "Öğreniyor" },
];

const getMasteryStamp = (level, isMastered) => {
  if (!isMastered && level === 0) return null;

  const match = MASTERY_STAMPS.find((m) => level >= m.minLevel);
  if (match) return match;

  // level === 0 ama isMastered === true: seviye henüz atanmamış, işaretli.
  return { emoji: "📖", color: "#64748b", label: "Öğreniyor" };
};

// Gerçek tekrar zamanlaması: next_review_at, SM-2 algoritmasının çıktısı.
// "X gün sonra" burada gösterdiğimiz tek gerçek/canlı geri sayım.
const getReviewCountdown = (nextReviewAt) => {
  if (!nextReviewAt) return null;
  const diffMs = new Date(nextReviewAt).getTime() - Date.now();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (days <= 0) return { label: "Tekrar zamanı geldi", overdue: days < 0 };
  if (days === 1) return { label: "Yarın", overdue: false };
  return { label: `${days} gün sonra`, overdue: false };
};

// Bir sonraki rütbeye kaç seviye kaldığını hesaplar. mastery_level gerçek,
// veritabanında tutulan bir sayı olduğu için bu — önceki "days" tahmininin
// aksine — uydurma değil, doğrudan veriye dayalı bir gösterge.
const getNextTierProgress = (level) => {
  const idx = MASTERY_STAMPS.findIndex((m) => level >= m.minLevel);
  if (idx <= 0) return null; // seviye yok ya da zaten en üst rütbede

  const current = MASTERY_STAMPS[idx];
  const next = MASTERY_STAMPS[idx - 1];
  const span = next.minLevel - current.minLevel;
  const progress = level - current.minLevel;

  return {
    levelsToGo: next.minLevel - level,
    nextLabel: next.label,
    nextColor: next.color,
    pct: Math.min(100, Math.round((progress / span) * 100)),
  };
};

// Başarı oranına göre kalem rengi (notebook temasındaki CSS değişkenlerine bağlı)
const getAccuracyTone = (accuracy) => {
  if (accuracy >= 85) return "green";
  if (accuracy >= 60) return "gold";
  if (accuracy > 0) return "red";
  return "muted";
};

const TONE_VARS = {
  green: "var(--lg-green)",
  gold: "var(--lg-gold)",
  red: "var(--lg-red)",
  blue: "var(--lg-blue)",
  muted: "var(--lg-ink-muted)",
};

function StatPill({ value, label, tone }) {
  const colorVar = TONE_VARS[tone] || TONE_VARS.muted;
  return (
    <div
      className="rounded border px-1 py-2 text-center"
      style={{
        borderColor: `color-mix(in srgb, ${colorVar} 30%, transparent)`,
        backgroundColor: `color-mix(in srgb, ${colorVar} 8%, transparent)`,
      }}
    >
      <div className="font-mono text-base font-extrabold leading-none" style={{ color: colorVar }}>
        {value}
      </div>
      <div className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-[var(--lg-ink-muted)]">
        {label}
      </div>
    </div>
  );
}

// Header'daki seviye damgasıyla aynı dilde: kesik çizgili, hafif döndürülmüş daire.
// Sadece rütbeyi taşır — emoji + isim. Zamanlama bilgisi artık ayrı gösteriliyor.
function MasteryStamp({ stamp }) {
  if (!stamp) return null;
  return (
    <div
      className="flex h-9 w-9 shrink-0 -rotate-6 items-center justify-center rounded-full border-2 border-dashed bg-[var(--lg-bg)]"
      style={{ borderColor: stamp.color }}
      title={stamp.label}
    >
      <span className="text-[15px] leading-none">{stamp.emoji}</span>
    </div>
  );
}

// Öğreniyor → Efsane sırasıyla artan rütbe dizisi (MASTERY_STAMPS'in tersi)
const TIER_TIMELINE = [...MASTERY_STAMPS].reverse();

// Tüm rütbe yolculuğunu tek bakışta gösterir: kazanılanlar dolu/renkli,
// önündekiler soluk/boş nokta. Aradaki çizgi de kazanılmış segmentlerde dolu,
// mevcut segmentte tierProgress.pct kadar kısmi dolu, ilerideki segmentlerde
// soluk. Hiçbir sayı uydurulmuyor — sadece mastery_level'ın kendisi çiziliyor.
function MasteryTimeline({ level, tierProgress }) {
  const currentIdx = TIER_TIMELINE.reduce(
    (acc, tier, i) => (level >= tier.minLevel ? i : acc),
    -1
  );
  if (currentIdx === -1) return null;

  return (
    <div className="mb-3">
      <div className="flex items-center">
        {TIER_TIMELINE.map((tier, i) => {
          const achieved = i <= currentIdx;
          const isCurrent = i === currentIdx;
          const isLast = i === TIER_TIMELINE.length - 1;
          const segmentFillPct = i < currentIdx ? 100 : i === currentIdx ? tierProgress?.pct ?? 0 : 0;
          const segmentColor = TIER_TIMELINE[i + 1]?.color;

          return (
            <div key={tier.label} className="flex items-center" style={{ flex: isLast ? "0 0 auto" : "1 1 auto" }}>
              <div
                className={`h-3 w-3 shrink-0 rounded-full border-2 transition-colors ${isCurrent ? "scale-125" : ""}`}
                style={{
                  borderColor: achieved ? tier.color : "var(--lg-border-strong)",
                  backgroundColor: achieved ? tier.color : "transparent",
                  opacity: achieved ? 1 : 0.4,
                }}
                title={tier.label}
              />
              {!isLast && (
                <div className="mx-0.5 h-0.5 flex-1 overflow-hidden rounded-full bg-[var(--lg-border-strong)]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${segmentFillPct}%`, backgroundColor: segmentColor }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 text-[9px] font-semibold text-[var(--lg-ink-muted)]">
        {tierProgress
          ? `${tierProgress.nextLabel}'a ${tierProgress.levelsToGo} seviye kaldı`
          : "🏆 En yüksek rütbeye ulaştın"}
      </div>
    </div>
  );
}

export default function Dashboard() {
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
    filterAndSortData();
  }, [allWords, allSentences, searchTerm, sortBy]);

  const fetchStats = async () => {
    if (!userId) {
      console.error("❌ fetchStats: userId gereklidir!");
      return;
    }

    setLoading(true);

    try {
      // Kelime ve cümle sorguları birbirine bağımlı değil — paralel çalıştır.
      // (HomeScreen'deki 6 sıralı await'in tek await'e indirilmesiyle aynı mantık.)
      const [{ data: userWords }, { data: userSentences }] = await Promise.all([
        supabase
          .from("en_user_words")
          .select(`
            word_id,
            review_count,
            mastery_level,
            is_mastered,
            total_correct,
            total_wrong,
            next_review_at,
            en_words (word, meaning, part_of_speech)
          `)
          .eq("user_id", userId),
        supabase
          .from("en_user_sentences")
          .select(`
            sentence_id,
            review_count,
            total_correct,
            total_wrong,
            en_example_sentences (sentence_en, sentence_tr, word_id)
          `)
          .eq("user_id", userId),
      ]);

      const words = (userWords || [])
        .filter((uw) => uw.en_words)
        .map((uw) => {
          const totalCorrect = uw.total_correct || 0;
          const totalWrong = uw.total_wrong || 0;
          const totalReviews = totalCorrect + totalWrong;
          const accuracy = totalReviews > 0 ? Math.round((totalCorrect / totalReviews) * 100) : 0;

          return {
            id: uw.word_id,
            word: uw.en_words.word,
            meaning: uw.en_words.meaning,
            partOfSpeech: uw.en_words.part_of_speech || [],
            totalReviews,
            totalCorrect,
            totalWrong,
            accuracy,
            masteryLevel: uw.mastery_level || 0,
            isMastered: uw.is_mastered || false,
            reviewCount: uw.review_count || 0,
            nextReviewAt: uw.next_review_at,
          };
        });

      const sentences = (userSentences || [])
        .filter((us) => us.en_example_sentences)
        .map((us) => {
          const totalCorrect = us.total_correct || 0;
          const totalWrong = us.total_wrong || 0;
          const totalReviews = totalCorrect + totalWrong;
          const accuracy = totalReviews > 0 ? Math.round((totalCorrect / totalReviews) * 100) : 0;

          return {
            id: us.sentence_id,
            sentence: us.en_example_sentences.sentence_en,
            meaning: us.en_example_sentences.sentence_tr,
            wordId: us.en_example_sentences.word_id,
            totalReviews,
            totalCorrect,
            totalWrong,
            accuracy,
            reviewCount: us.review_count || 0,
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
    let filteredW = [...allWords];
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filteredW = filteredW.filter(
        (w) => w.word.toLowerCase().includes(term) || w.meaning.toLowerCase().includes(term)
      );
    }
    filteredW.sort((a, b) => {
      if (sortBy === "accuracy") return b.accuracy - a.accuracy;
      if (sortBy === "reviews") return b.totalReviews - a.totalReviews;
      if (sortBy === "mastered") return (b.isMastered ? 1 : 0) - (a.isMastered ? 1 : 0);
      return 0;
    });
    setFilteredWords(filteredW);

    let filteredS = [...allSentences];
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filteredS = filteredS.filter(
        (s) => s.sentence.toLowerCase().includes(term) || s.meaning.toLowerCase().includes(term)
      );
    }
    filteredS.sort((a, b) => {
      if (sortBy === "accuracy") return b.accuracy - a.accuracy;
      if (sortBy === "reviews") return b.totalReviews - a.totalReviews;
      return 0;
    });
    setFilteredSentences(filteredS);

    setCurrentPage(1);
  };

  const getCurrentItems = (items) => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return items.slice(startIndex, startIndex + ITEMS_PER_PAGE);
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
      <div className="mt-6 flex flex-wrap items-center justify-center gap-1.5">
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="rounded-md border border-dashed border-[var(--lg-border-strong)] bg-[var(--lg-card)] px-3 py-1.5 font-mono text-[11px] font-bold tracking-wide text-[var(--lg-red)] disabled:text-[var(--lg-ink-muted)] disabled:opacity-40"
        >
          ← ÖNCEKİ
        </button>

        <div className="flex items-center gap-1">
          {pageNumbers.map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => setCurrentPage(pageNum)}
              className={`flex h-7 w-7 items-center justify-center rounded-full border-2 font-mono text-[11px] font-bold ${currentPage === pageNum
                  ? "border-[var(--lg-red)] text-[var(--lg-red)]"
                  : "border-dashed border-[var(--lg-border-strong)] text-[var(--lg-ink-muted)]"
                }`}
            >
              {pageNum}
            </button>
          ))}
        </div>

        <button
          onClick={() => setCurrentPage((p) => Math.min(total, p + 1))}
          disabled={currentPage === total}
          className="rounded-md border border-dashed border-[var(--lg-border-strong)] bg-[var(--lg-card)] px-3 py-1.5 font-mono text-[11px] font-bold tracking-wide text-[var(--lg-red)] disabled:text-[var(--lg-ink-muted)] disabled:opacity-40"
        >
          SONRAKİ →
        </button>
      </div>
    );
  };

  const renderStatCard = (item, type) => {
    const accuracyTone = getAccuracyTone(item.accuracy);
    const stamp = type === "word" ? getMasteryStamp(item.masteryLevel, item.isMastered) : null;
    const countdown = type === "word" ? getReviewCountdown(item.nextReviewAt) : null;
    const tierProgress = type === "word" ? getNextTierProgress(item.masteryLevel) : null;
    const marginColor = stamp ? stamp.color : "var(--lg-red)";

    return (
      <div
        key={item.id}
        className={`rounded-md border border-[var(--lg-border)] border-l-4 bg-[var(--lg-card)] py-3.5 pl-4 pr-4 ${DOGEAR}`}
        style={{
          borderLeftColor: marginColor,
          backgroundImage:
            "repeating-linear-gradient(to bottom, transparent 0px, transparent 21px, var(--lg-rule) 22px)",
        }}
      >
        {/* Başlık satırı */}
        <div className="mb-3 flex items-start justify-between gap-2.5">
          <div className="min-w-0 flex-1">
            <div
              className={`overflow-hidden text-ellipsis whitespace-nowrap font-serif font-bold text-[var(--lg-ink)] ${type === "word" ? "text-[17px] tracking-tight" : "text-sm"
                }`}
            >
              {type === "word" ? item.word : `"${item.sentence}"`}
            </div>
            <div className="mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap text-xs italic text-[var(--lg-ink-muted)]">
              {item.meaning}
            </div>
          </div>

          {stamp && (
            <div className="flex shrink-0 flex-col items-center gap-1">
              <MasteryStamp stamp={stamp} />
              {countdown && (
                <span
                  className={`whitespace-nowrap font-mono text-[9px] font-bold ${countdown.overdue ? "text-[var(--lg-red)]" : "text-[var(--lg-ink-muted)]"
                    }`}
                >
                  🔁 {countdown.label}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Bir sonraki rütbeye ilerleme — sadece daha yükseği varsa gösterilir */}
        {type === "word" && <MasteryTimeline level={item.masteryLevel} tierProgress={tierProgress} />}

        {/* Stat pilleri */}
        <div className="mb-3 grid grid-cols-4 gap-1.5">
          <StatPill value={item.totalCorrect} label="Doğru" tone="green" />
          <StatPill value={item.totalWrong} label="Yanlış" tone="red" />
          <StatPill value={`%${item.accuracy}`} label="Başarı" tone={accuracyTone} />
          <StatPill value={item.totalReviews} label="Tekrar" tone="blue" />
        </div>

        {/* İlerleme çubuğu */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--lg-border-strong)]">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${item.accuracy}%`, backgroundColor: TONE_VARS[accuracyTone] }}
          />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="lg-notebook flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--lg-bg)]">
        <NotebookTheme />
        <span className="h-14 w-14 animate-spin rounded-full border-[3px] border-dashed border-[var(--lg-red)]" />
        <span className="font-mono text-[12px] font-semibold tracking-[4px] text-[var(--lg-ink-muted)]">
          VERİLER YÜKLENİYOR…
        </span>
      </div>
    );
  }

  const currentItems = activeTab === "words" ? getCurrentItems(filteredWords) : getCurrentItems(filteredSentences);
  const totalItems = activeTab === "words" ? filteredWords.length : filteredSentences.length;
  const currentTotalPages = totalPages(activeTab === "words" ? filteredWords : filteredSentences);

  return (
    <div className="lg-notebook relative min-h-screen overflow-hidden bg-[var(--lg-bg)] text-[var(--lg-ink)]">
      <NotebookTheme />

      {/* Ambient glow — HomeScreen ile aynı */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[34rem] -translate-x-1/2 rounded-full bg-[var(--lg-red)]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-20 h-80 w-[22rem] rounded-full bg-[var(--lg-gold)]/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-md px-5 pb-10 pt-5">
        {/* Header: cover label + sayfa başlığı */}
        <div className="mb-6 flex items-center justify-between">
          <div
            className="inline-flex items-center gap-2 bg-[var(--lg-card)] px-3 py-1.5 font-mono text-[11px] font-bold tracking-[3px] text-[var(--lg-ink)] shadow-sm"
            style={{ clipPath: "polygon(3% 0, 100% 0, 97% 100%, 0 100%)" }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--lg-red)]" />
            LINGORA
          </div>

          <div className="flex gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-[var(--lg-border-strong)] bg-[var(--lg-card)] px-2.5 py-1 font-mono text-[10px] font-bold text-[var(--lg-ink-muted)]">
              📖 {allWords.length}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-[var(--lg-border-strong)] bg-[var(--lg-card)] px-2.5 py-1 font-mono text-[10px] font-bold text-[var(--lg-ink-muted)]">
              📝 {allSentences.length}
            </span>
          </div>
        </div>

        <h1 className="mb-5 font-serif text-[26px] font-black tracking-tight text-[var(--lg-ink)]">
          İstatistik Defteri
        </h1>

        {/* Arama & sıralama — çizgili defter satırı gibi */}
        <div className="mb-4 flex gap-2">
          <label className="flex flex-1 items-center gap-2 border-b-2 border-dashed border-[var(--lg-border-strong)] bg-transparent px-1 py-2">
            <span className="text-sm text-[var(--lg-ink-muted)]">🔍</span>
            <input
              type="text"
              placeholder="Kelime veya anlam ara…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="grow bg-transparent font-serif text-[13px] text-[var(--lg-ink)] outline-none placeholder:text-[var(--lg-ink-muted)]"
            />
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="shrink-0 rounded-md border border-[var(--lg-border)] bg-[var(--lg-card)] px-2 py-2 font-mono text-[11px] font-semibold text-[var(--lg-ink)] outline-none"
          >
            <option value="accuracy">Başarı Oranı</option>
            <option value="reviews">Çözüm Sayısı</option>
            <option value="mastered">Ustalık</option>
          </select>
        </div>

        {/* Tabs — defter bölüm ayracı gibi */}
        <div className="mb-5 flex gap-1.5">
          {[
            { key: "words", icon: "📖", label: "Kelimeler", count: filteredWords.length },
            { key: "sentences", icon: "📝", label: "Cümleler", count: filteredSentences.length },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setCurrentPage(1);
                }}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-t-md border border-b-0 py-2.5 text-[13px] font-bold transition-transform ${isActive
                    ? "-translate-y-0.5 border-[var(--lg-red)] bg-[var(--lg-card)] text-[var(--lg-red)] shadow-sm"
                    : "border-transparent text-[var(--lg-ink-muted)]"
                  }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
                <span
                  className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] font-bold ${isActive ? "bg-[var(--lg-red)]/10 text-[var(--lg-red)]" : "text-[var(--lg-ink-muted)]"
                    }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
        <div className="-mt-5 mb-5 h-px bg-[var(--lg-border-strong)]" />

        {/* İçerik */}
        {totalItems === 0 ? (
          <div className={`rounded-md border border-[var(--lg-border)] bg-[var(--lg-card)] px-6 py-12 text-center ${DOGEAR}`}>
            <div className="mb-3.5 text-4xl">🌱</div>
            <div className="mb-2 font-serif text-[15px] font-bold text-[var(--lg-ink)]">
              {activeTab === "words" ? "Henüz kelime yok" : "Henüz cümle yok"}
            </div>
            <p className="m-0 text-[13px] leading-relaxed text-[var(--lg-ink-muted)]">
              {activeTab === "words"
                ? "Ana sayfadan yeni kelimeler ekleyerek istatistiklerini görmeye başla!"
                : "Kelime ekledikçe cümleler otomatik olarak eklenecek."}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-3 text-right font-mono text-[11px] font-semibold tracking-wide text-[var(--lg-ink-muted)]">
              {totalItems} {activeTab === "words" ? "kelime" : "cümle"} · Sayfa {currentPage}/{currentTotalPages}
            </div>

            <div className="flex flex-col gap-2.5">
              {currentItems.map((item) => renderStatCard(item, activeTab === "words" ? "word" : "sentence"))}
            </div>

            {renderPagination(activeTab === "words" ? filteredWords : filteredSentences)}
          </>
        )}
      </div>
    </div>
  );
}