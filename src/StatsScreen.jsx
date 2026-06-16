import { useState, useEffect } from "react";
import { supabase } from "./config.js";

const FIXED_USER_ID = "302a3b6b-c1e9-49c4-98fe-52115bd7d204";

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
    fetchStats();
  }, []);

  useEffect(() => {
    // Filtrele ve sırala
    filterAndSortData();
  }, [allWords, allSentences, searchTerm, sortBy]);

  const fetchStats = async () => {
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
        .eq("user_id", FIXED_USER_ID);
      
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
        .eq("user_id", FIXED_USER_ID);
      
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
    
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        gap: 8, 
        marginTop: 20,
        flexWrap: "wrap"
      }}>
        <button
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "1px solid #1e1e38",
            background: currentPage === 1 ? "#1a1a30" : "#131324",
            color: currentPage === 1 ? "#475569" : "#94a3b8",
            cursor: currentPage === 1 ? "not-allowed" : "pointer",
            fontSize: 13,
            fontWeight: 600
          }}
        >
          ← Önceki
        </button>
        
        <div style={{ 
          display: "flex", 
          gap: 4,
          alignItems: "center"
        }}>
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
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: "1px solid",
                  borderColor: currentPage === pageNum ? "#6366f1" : "#1e1e38",
                  background: currentPage === pageNum ? "#6366f1" : "#131324",
                  color: currentPage === pageNum ? "#fff" : "#94a3b8",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: currentPage === pageNum ? 700 : 400,
                  minWidth: 36
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
            padding: "8px 16px",
            borderRadius: 8,
            border: "1px solid #1e1e38",
            background: currentPage === total ? "#1a1a30" : "#131324",
            color: currentPage === total ? "#475569" : "#94a3b8",
            cursor: currentPage === total ? "not-allowed" : "pointer",
            fontSize: 13,
            fontWeight: 600
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
    
    const badge = type === "word" ? getMasteryBadge(item.masteryLevel, item.isMastered) : null;
    
    return (
      <div key={item.id} style={{ 
        background: "#131324", 
        borderRadius: 16, 
        padding: "16px 18px",
        border: "1px solid #1e1e38",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.2)",
        position: "relative",
        overflow: "hidden",
        transition: "all 0.2s ease"
      }}>
        {/* Badge sol çizgi */}
        {badge && (
          <div style={{ 
            position: "absolute", 
            left: 0, 
            top: 0, 
            bottom: 0, 
            width: 4, 
            background: badge.color 
          }} />
        )}
        
        {/* Başlık */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ 
              fontSize: type === "word" ? 18 : 15, 
              fontWeight: 700, 
              color: "#ffffff",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}>
              {type === "word" ? item.word : `"${item.sentence}"`}
            </div>
            <div style={{ 
              fontSize: 13, 
              color: "#94a3b8",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              marginTop: 2
            }}>
              {item.meaning}
            </div>
          </div>
          
          {badge && (
            <div style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              gap: 4, 
              background: `${badge.color}15`, 
              padding: "4px 10px", 
              borderRadius: 10,
              border: `1px solid ${badge.color}30`,
              whiteSpace: "nowrap",
              flexShrink: 0
            }}>
              <span style={{ fontSize: 12 }}>{badge.emoji}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: badge.color }}>{badge.label}</span>
            </div>
          )}
        </div>
        
        {/* İstatistik Grid */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(4, 1fr)", 
          gap: 6,
          background: "#1a1a30",
          padding: "10px 8px",
          borderRadius: 12,
          marginBottom: 10
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#10b981" }}>{item.totalCorrect}</div>
            <div style={{ fontSize: 9, color: "#64748b", fontWeight: 600, marginTop: 1 }}>Doğru</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#ef4444" }}>{item.totalWrong}</div>
            <div style={{ fontSize: 9, color: "#64748b", fontWeight: 600, marginTop: 1 }}>Yanlış</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: accuracyColor }}>%{item.accuracy}</div>
            <div style={{ fontSize: 9, color: "#64748b", fontWeight: 600, marginTop: 1 }}>Başarı</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#818cf8" }}>{item.totalReviews}</div>
            <div style={{ fontSize: 9, color: "#64748b", fontWeight: 600, marginTop: 1 }}>Tekrar</div>
          </div>
        </div>
        
        {/* İlerleme Çubuğu */}
        <div style={{ width: "100%", height: 3, background: "#1a1a30", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ 
            width: `${item.accuracy}%`, 
            height: "100%", 
            background: accuracyColor, 
            borderRadius: 2,
            transition: "width 0.3s ease"
          }} />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "70vh", background: "#0b0b14", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{ width: 28, height: 28, border: "3px solid #312e81", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
          <div style={{ color: "#94a3b8", fontSize: 14, fontWeight: 500 }}>Veriler yükleniyor...</div>
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
      background: "#0b0b14", 
      minHeight: "100vh", 
      color: "#f8fafc", 
      fontFamily: "system-ui, -apple-system, sans-serif",
      padding: "20px 16px 40px"
    }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 11, letterSpacing: "3px", color: "#818cf8", fontWeight: 700, textTransform: "uppercase" }}>WordFlow</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginTop: 4, marginBottom: 2, color: "#ffffff", letterSpacing: "-0.5px" }}>
            📊 İstatistikler
          </h1>
          <div style={{ 
            display: "inline-flex", 
            alignItems: "center", 
            gap: 8,
            background: "rgba(99, 102, 241, 0.08)", 
            padding: "4px 14px", 
            borderRadius: 100, 
            fontSize: 12, 
            color: "#a5b4fc",
            fontWeight: 500,
            border: "1px solid rgba(99, 102, 241, 0.15)"
          }}>
            <span>📖 {allWords.length} kelime</span>
            <span style={{ width: 1, height: 14, background: "#1e1e38" }} />
            <span>📝 {allSentences.length} cümle</span>
          </div>
        </div>

        {/* Arama ve Filtreleme */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="Kelime veya anlam ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                minWidth: 150,
                padding: "10px 14px",
                borderRadius: 12,
                border: "1px solid #1e1e38",
                background: "#131324",
                color: "#f8fafc",
                fontSize: 13,
                outline: "none",
                transition: "border-color 0.2s"
              }}
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                border: "1px solid #1e1e38",
                background: "#131324",
                color: "#f8fafc",
                fontSize: 13,
                outline: "none",
                cursor: "pointer"
              }}
            >
              <option value="accuracy">Başarı Oranı</option>
              <option value="reviews">Çözüm Sayısı</option>
              <option value="mastered">Ustalık</option>
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ 
          display: "flex", 
          background: "#131324", 
          padding: "4px", 
          borderRadius: 14,
          marginBottom: 16,
          border: "1px solid #1e1e38"
        }}>
          <button
            onClick={() => { setActiveTab("words"); setCurrentPage(1); }}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: 10,
              border: "none",
              background: activeTab === "words" ? "#6366f1" : "transparent",
              color: activeTab === "words" ? "#fff" : "#64748b",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6
            }}
          >
            <span>📖</span> Kelimeler
            <span style={{ 
              fontSize: 10, 
              background: activeTab === "words" ? "rgba(255,255,255,0.2)" : "rgba(99,102,241,0.15)",
              padding: "1px 8px",
              borderRadius: 99,
              color: activeTab === "words" ? "#fff" : "#818cf8"
            }}>
              {filteredWords.length}
            </span>
          </button>
          <button
            onClick={() => { setActiveTab("sentences"); setCurrentPage(1); }}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: 10,
              border: "none",
              background: activeTab === "sentences" ? "#6366f1" : "transparent",
              color: activeTab === "sentences" ? "#fff" : "#64748b",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6
            }}
          >
            <span>📝</span> Cümleler
            <span style={{ 
              fontSize: 10, 
              background: activeTab === "sentences" ? "rgba(255,255,255,0.2)" : "rgba(99,102,241,0.15)",
              padding: "1px 8px",
              borderRadius: 99,
              color: activeTab === "sentences" ? "#fff" : "#818cf8"
            }}>
              {filteredSentences.length}
            </span>
          </button>
        </div>

        {/* İçerik */}
        {totalItems === 0 ? (
          <div style={{ 
            background: "#131324", 
            borderRadius: 20, 
            padding: "40px 24px", 
            textAlign: "center", 
            border: "1px solid #222240"
          }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🌱</div>
            <div style={{ color: "#f1f5f9", fontWeight: 600, marginBottom: 6 }}>
              {activeTab === "words" ? "Henüz kelime yok" : "Henüz cümle yok"}
            </div>
            <p style={{ color: "#64748b", fontSize: 13, margin: 0, lineHeight: 1.5 }}>
              {activeTab === "words" 
                ? "Ana sayfadan yeni kelimeler ekleyerek istatistiklerini görmeye başla!" 
                : "Kelime ekledikçe cümleler otomatik olarak eklenecek."}
            </p>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10, textAlign: "right" }}>
              Toplam {totalItems} {activeTab === "words" ? "kelime" : "cümle"} • Sayfa {currentPage}/{currentTotalPages}
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