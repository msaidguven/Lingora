import { useState, useEffect } from "react";
import { supabase } from "./config.js";
import { useAuth } from "./contexts/AuthContext";

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

export default function StatsScreen({ userLevel }) {
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
    
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center",
        alignItems: "center",
        gap: 6, 
        marginTop: 28,
        flexWrap: "wrap"
      }}>
        <button
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          style={{
            padding: "8px 14px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.06)",
            background: currentPage === 1 ? "transparent" : "rgba(99,102,241,0.08)",
            color: currentPage === 1 ? "#2d2d50" : "#818cf8",
            cursor: currentPage === 1 ? "not-allowed" : "pointer",
            fontSize: 13,
            fontWeight: 600,
            transition: "all 0.15s ease",
            letterSpacing: "0.02em"
          }}
        >
          ← Önceki
        </button>
        
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {Array.from({ length: Math.min(total, 5) }, (_, i) => {
            let pageNum;
            if (total <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= total - 2) {
              pageNum = total - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  border: "1px solid",
                  borderColor: currentPage === pageNum ? "#6366f1" : "rgba(255,255,255,0.06)",
                  background: currentPage === pageNum 
                    ? "linear-gradient(135deg, #6366f1, #818cf8)" 
                    : "transparent",
                  color: currentPage === pageNum ? "#fff" : "#475569",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: currentPage === pageNum ? 700 : 500,
                  transition: "all 0.15s ease",
                  boxShadow: currentPage === pageNum ? "0 4px 12px rgba(99,102,241,0.35)" : "none"
                }}
              >
                {pageNum}
              </button>
            );
          })}
        </div>
        
        <button
          onClick={() => setCurrentPage(p => Math.min(total, p + 1))}
          disabled={currentPage === total}
          style={{
            padding: "8px 14px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.06)",
            background: currentPage === total ? "transparent" : "rgba(99,102,241,0.08)",
            color: currentPage === total ? "#2d2d50" : "#818cf8",
            cursor: currentPage === total ? "not-allowed" : "pointer",
            fontSize: 13,
            fontWeight: 600,
            transition: "all 0.15s ease",
            letterSpacing: "0.02em"
          }}
        >
          Sonraki →
        </button>
      </div>
    );
  };

  const renderStatCard = (item, type) => {
    const accuracyColor = item.accuracy >= 85 ? "#10b981" : 
                          item.accuracy >= 60 ? "#f59e0b" : 
                          item.accuracy > 0 ? "#ef4444" : "#64748b";

    const accuracyBg = item.accuracy >= 85 ? "rgba(16,185,129,0.07)" : 
                       item.accuracy >= 60 ? "rgba(245,158,11,0.07)" : 
                       item.accuracy > 0 ? "rgba(239,68,68,0.07)" : "rgba(100,116,139,0.07)";

    const accuracyBorder = item.accuracy >= 85 ? "rgba(16,185,129,0.12)" : 
                           item.accuracy >= 60 ? "rgba(245,158,11,0.12)" : 
                           item.accuracy > 0 ? "rgba(239,68,68,0.12)" : "rgba(100,116,139,0.12)";
    
    const badge = type === "word" ? getMasteryBadge(item.masteryLevel, item.isMastered) : null;
    const accentColor = badge ? badge.color : "#6366f1";
    
    return (
      <div key={item.id} style={{ 
        background: "linear-gradient(160deg, #14142a 0%, #111126 100%)",
        borderRadius: 18, 
        padding: "18px 20px",
        border: "1px solid rgba(255,255,255,0.05)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
        position: "relative",
        overflow: "hidden",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
      }}>

        {/* Sol mastery renk çizgisi */}
        <div style={{ 
          position: "absolute", 
          left: 0, top: 12, bottom: 12,
          width: 3,
          background: `linear-gradient(180deg, ${accentColor}, ${accentColor}55)`,
          borderRadius: "0 3px 3px 0",
        }} />

        {/* Sağ üst ambient ışık */}
        <div style={{
          position: "absolute",
          top: -20, right: -20,
          width: 80, height: 80,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accentColor}12 0%, transparent 70%)`,
          pointerEvents: "none"
        }} />
        
        {/* Başlık satırı */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 14, paddingLeft: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ 
              fontSize: type === "word" ? 17 : 14,
              fontWeight: 800,
              color: "#f1f5f9",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              letterSpacing: type === "word" ? "-0.3px" : "0",
            }}>
              {type === "word" ? item.word : `"${item.sentence}"`}
            </div>
            <div style={{ 
              fontSize: 12,
              color: "#475569",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              marginTop: 3,
              fontStyle: "italic"
            }}>
              {item.meaning}
            </div>
          </div>
          
          {badge && (
            <div style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              gap: 5,
              background: `${badge.color}12`,
              padding: "5px 10px", 
              borderRadius: 10,
              border: `1px solid ${badge.color}25`,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 11 }}>{badge.emoji}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: badge.color, letterSpacing: "0.03em" }}>{badge.label}</span>
            </div>
          )}
        </div>
        
        {/* Stat pilleri */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(4, 1fr)", 
          gap: 6,
          marginBottom: 12,
          paddingLeft: 10
        }}>
          {/* Doğru */}
          <div style={{
            background: "rgba(16,185,129,0.07)",
            border: "1px solid rgba(16,185,129,0.12)",
            borderRadius: 10,
            padding: "8px 4px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#10b981", lineHeight: 1 }}>{item.totalCorrect}</div>
            <div style={{ fontSize: 9, color: "#10b98170", fontWeight: 600, marginTop: 4, letterSpacing: "0.05em", textTransform: "uppercase" }}>Doğru</div>
          </div>

          {/* Yanlış */}
          <div style={{
            background: "rgba(239,68,68,0.07)",
            border: "1px solid rgba(239,68,68,0.12)",
            borderRadius: 10,
            padding: "8px 4px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#ef4444", lineHeight: 1 }}>{item.totalWrong}</div>
            <div style={{ fontSize: 9, color: "#ef444470", fontWeight: 600, marginTop: 4, letterSpacing: "0.05em", textTransform: "uppercase" }}>Yanlış</div>
          </div>

          {/* Başarı */}
          <div style={{
            background: accuracyBg,
            border: `1px solid ${accuracyBorder}`,
            borderRadius: 10,
            padding: "8px 4px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: accuracyColor, lineHeight: 1 }}>%{item.accuracy}</div>
            <div style={{ fontSize: 9, color: `${accuracyColor}70`, fontWeight: 600, marginTop: 4, letterSpacing: "0.05em", textTransform: "uppercase" }}>Başarı</div>
          </div>

          {/* Tekrar */}
          <div style={{
            background: "rgba(99,102,241,0.07)",
            border: "1px solid rgba(99,102,241,0.12)",
            borderRadius: 10,
            padding: "8px 4px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#818cf8", lineHeight: 1 }}>{item.totalReviews}</div>
            <div style={{ fontSize: 9, color: "#818cf870", fontWeight: 600, marginTop: 4, letterSpacing: "0.05em", textTransform: "uppercase" }}>Tekrar</div>
          </div>
        </div>
        
        {/* İlerleme çubuğu */}
        <div style={{ paddingLeft: 10 }}>
          <div style={{ width: "100%", height: 4, background: "rgba(255,255,255,0.04)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ 
              width: `${item.accuracy}%`, 
              height: "100%", 
              background: `linear-gradient(90deg, ${accuracyColor}99, ${accuracyColor})`,
              borderRadius: 4,
              transition: "width 0.4s ease",
              boxShadow: `0 0 8px ${accuracyColor}60`
            }} />
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "70vh", background: "#0a0a18", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div style={{ 
            width: 44, height: 44, 
            border: "3px solid rgba(99,102,241,0.15)", 
            borderTopColor: "#6366f1", 
            borderRadius: "50%", 
            animation: "spin 0.8s linear infinite",
            boxShadow: "0 0 20px rgba(99,102,241,0.2)"
          }} />
          <div style={{ color: "#475569", fontSize: 13, fontWeight: 500, letterSpacing: "0.05em" }}>Veriler yükleniyor...</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  const currentItems = activeTab === "words" ? getCurrentItems(filteredWords) : getCurrentItems(filteredSentences);
  const totalItems = activeTab === "words" ? filteredWords.length : filteredSentences.length;
  const currentTotalPages = totalPages(activeTab === "words" ? filteredWords : filteredSentences);

  return (
    <div style={{ 
      background: "#0a0a18", 
      minHeight: "100vh", 
      color: "#f8fafc", 
      fontFamily: "system-ui, -apple-system, sans-serif",
      padding: "24px 16px 48px"
    }}>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input[type="text"]::placeholder { color: #2d2d50; }
        input[type="text"]:focus { border-color: rgba(99,102,241,0.4) !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.08); }
        select option { background: #131324; }
      `}</style>

      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        
        {/* ── HEADER ── */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ 
            fontSize: 10, 
            letterSpacing: "4px", 
            color: "#6366f1", 
            fontWeight: 700, 
            textTransform: "uppercase",
            marginBottom: 8,
            opacity: 0.7
          }}>
            Lingora
          </div>
          <h1 style={{ 
            fontSize: 26, 
            fontWeight: 900, 
            margin: "0 0 14px", 
            color: "#f1f5f9", 
            letterSpacing: "-0.8px",
            background: "linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>
            İstatistikler
          </h1>

          {/* Özet pill'ler */}
          <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
            <div style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              gap: 7,
              background: "rgba(99,102,241,0.06)",
              padding: "7px 16px", 
              borderRadius: 12, 
              fontSize: 12, 
              color: "#818cf8",
              fontWeight: 600,
              border: "1px solid rgba(99,102,241,0.1)",
              letterSpacing: "0.01em"
            }}>
              <span>📖</span>
              <span>{allWords.length} kelime</span>
            </div>
            <div style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              gap: 7,
              background: "rgba(99,102,241,0.06)",
              padding: "7px 16px", 
              borderRadius: 12, 
              fontSize: 12, 
              color: "#818cf8",
              fontWeight: 600,
              border: "1px solid rgba(99,102,241,0.1)",
              letterSpacing: "0.01em"
            }}>
              <span>📝</span>
              <span>{allSentences.length} cümle</span>
            </div>
          </div>
        </div>

        {/* ── ARAMA & FİLTRE ── */}
        <div style={{ marginBottom: 14, display: "flex", gap: 8 }}>
          <div style={{ flex: 1, position: "relative" }}>
            <span style={{ 
              position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)",
              fontSize: 14, color: "#2d2d50", pointerEvents: "none"
            }}>🔍</span>
            <input
              type="text"
              placeholder="Kelime veya anlam ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "11px 14px 11px 36px",
                borderRadius: 13,
                border: "1px solid rgba(255,255,255,0.05)",
                background: "rgba(20,20,42,0.8)",
                color: "#e2e8f0",
                fontSize: 13,
                outline: "none",
                transition: "border-color 0.2s, box-shadow 0.2s",
                boxSizing: "border-box",
              }}
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: "11px 12px",
              borderRadius: 13,
              border: "1px solid rgba(255,255,255,0.05)",
              background: "rgba(20,20,42,0.8)",
              color: "#94a3b8",
              fontSize: 12,
              outline: "none",
              cursor: "pointer",
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            <option value="accuracy">Başarı Oranı</option>
            <option value="reviews">Çözüm Sayısı</option>
            <option value="mastered">Ustalık</option>
          </select>
        </div>

        {/* ── TABS ── */}
        <div style={{ 
          display: "flex", 
          background: "rgba(14,14,30,0.8)",
          padding: "5px", 
          borderRadius: 16,
          marginBottom: 18,
          border: "1px solid rgba(255,255,255,0.04)",
          gap: 4,
        }}>
          <button
            onClick={() => { setActiveTab("words"); setCurrentPage(1); }}
            style={{
              flex: 1,
              padding: "11px",
              borderRadius: 12,
              border: "none",
              background: activeTab === "words" 
                ? "linear-gradient(135deg, #6366f1, #818cf8)" 
                : "transparent",
              color: activeTab === "words" ? "#fff" : "#334155",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              boxShadow: activeTab === "words" ? "0 4px 16px rgba(99,102,241,0.3)" : "none",
              letterSpacing: "0.01em"
            }}
          >
            <span>📖</span>
            Kelimeler
            <span style={{ 
              fontSize: 10, 
              background: activeTab === "words" ? "rgba(255,255,255,0.18)" : "rgba(99,102,241,0.1)",
              padding: "2px 8px",
              borderRadius: 20,
              color: activeTab === "words" ? "#fff" : "#475569",
              fontWeight: 700
            }}>
              {filteredWords.length}
            </span>
          </button>
          <button
            onClick={() => { setActiveTab("sentences"); setCurrentPage(1); }}
            style={{
              flex: 1,
              padding: "11px",
              borderRadius: 12,
              border: "none",
              background: activeTab === "sentences" 
                ? "linear-gradient(135deg, #6366f1, #818cf8)" 
                : "transparent",
              color: activeTab === "sentences" ? "#fff" : "#334155",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              boxShadow: activeTab === "sentences" ? "0 4px 16px rgba(99,102,241,0.3)" : "none",
              letterSpacing: "0.01em"
            }}
          >
            <span>📝</span>
            Cümleler
            <span style={{ 
              fontSize: 10, 
              background: activeTab === "sentences" ? "rgba(255,255,255,0.18)" : "rgba(99,102,241,0.1)",
              padding: "2px 8px",
              borderRadius: 20,
              color: activeTab === "sentences" ? "#fff" : "#475569",
              fontWeight: 700
            }}>
              {filteredSentences.length}
            </span>
          </button>
        </div>

        {/* ── İÇERİK ── */}
        {totalItems === 0 ? (
          <div style={{ 
            background: "linear-gradient(160deg, #14142a 0%, #111126 100%)",
            borderRadius: 20, 
            padding: "48px 24px", 
            textAlign: "center", 
            border: "1px solid rgba(255,255,255,0.04)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)"
          }}>
            <div style={{ fontSize: 40, marginBottom: 14 }}>🌱</div>
            <div style={{ color: "#e2e8f0", fontWeight: 700, marginBottom: 8, fontSize: 15 }}>
              {activeTab === "words" ? "Henüz kelime yok" : "Henüz cümle yok"}
            </div>
            <p style={{ color: "#334155", fontSize: 13, margin: 0, lineHeight: 1.6 }}>
              {activeTab === "words" 
                ? "Ana sayfadan yeni kelimeler ekleyerek istatistiklerini görmeye başla!" 
                : "Kelime ekledikçe cümleler otomatik olarak eklenecek."}
            </p>
          </div>
        ) : (
          <>
            <div style={{ 
              fontSize: 11, 
              color: "#2d2d50", 
              marginBottom: 12, 
              textAlign: "right",
              fontWeight: 600,
              letterSpacing: "0.03em"
            }}>
              {totalItems} {activeTab === "words" ? "kelime" : "cümle"} · Sayfa {currentPage}/{currentTotalPages}
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {currentItems.map(item => renderStatCard(item, activeTab === "words" ? "word" : "sentence"))}
            </div>
            
            {renderPagination(activeTab === "words" ? filteredWords : filteredSentences)}
          </>
        )}
      </div>
    </div>
  );
}