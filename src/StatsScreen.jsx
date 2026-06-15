import { useState, useEffect } from "react";
import { supabase } from "./config.js";

const FIXED_USER_ID = "302a3b6b-c1e9-49c4-98fe-52115bd7d204";

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
  const [learnedWords, setLearnedWords] = useState([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    
    // 1. Kullanıcının kelimelerini al
    const { data: userWords } = await supabase
      .from("en_user_words")
      .select(`
        word_id,
        review_count,
        mastery_level,
        is_mastered,
        en_words (word, meaning)
      `)
      .eq("user_id", FIXED_USER_ID);
    
    if (!userWords || userWords.length === 0) {
      setLearnedWords([]);
      setLoading(false);
      return;
    }
    
    // 2. Tüm quiz sorularını ve cevaplarını al
    const wordIds = userWords.map(uw => uw.word_id).filter(Boolean);
    
    const { data: quizQuestions } = await supabase
      .from("en_quiz_questions")
      .select("id, word_id")
      .in("word_id", wordIds);
    
    const questionIds = quizQuestions?.map(q => q.id) || [];
    
    let attemptsMap = {};
    if (questionIds.length > 0) {
      const { data: allAttempts } = await supabase
        .from("en_user_quiz_attempts")
        .select("is_correct, question_id")
        .eq("user_id", FIXED_USER_ID)
        .in("question_id", questionIds);
      
      // Soru ID -> kelime ID map'i
      const questionToWord = {};
      quizQuestions.forEach(q => {
        questionToWord[q.id] = q.word_id;
      });
      
      // Kelime bazında doğru/yanlış say
      allAttempts?.forEach(attempt => {
        const wordId = questionToWord[attempt.question_id];
        if (wordId) {
          if (!attemptsMap[wordId]) {
            attemptsMap[wordId] = { correct: 0, wrong: 0 };
          }
          if (attempt.is_correct) {
            attemptsMap[wordId].correct++;
          } else {
            attemptsMap[wordId].wrong++;
          }
        }
      });
    }
    
    // 3. Sonuçları düzenle
    const wordsWithStats = userWords
      .filter(uw => uw.en_words)
      .map(uw => {
        const stats = attemptsMap[uw.word_id] || { correct: 0, wrong: 0 };
        const totalAttempts = stats.correct + stats.wrong;
        const accuracy = totalAttempts > 0 ? Math.round((stats.correct / totalAttempts) * 100) : 0;
        
        // TOPLAM TEKRAR = doğru + yanlış
        const totalReviews = stats.correct + stats.wrong;
        
        return {
          word: uw.en_words.word,
          meaning: uw.en_words.meaning,
          totalReviews: totalReviews,  // TOPLAM TEKRAR
          masteryLevel: uw.mastery_level || 0,
          isMastered: uw.is_mastered || false,
          totalCorrect: stats.correct,
          totalWrong: stats.wrong,
          accuracy: accuracy
        };
      });
    
    setLearnedWords(wordsWithStats);
    setLoading(false);
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

  return (
    <div style={{ 
      background: "#0b0b14", 
      minHeight: "100vh", 
      color: "#f8fafc", 
      fontFamily: "system-ui, -apple-system, sans-serif",
      padding: "24px 16px"
    }}>
      <div style={{ maxWidth: 440, margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 12, letterSpacing: "3px", color: "#818cf8", fontWeight: 700, textTransform: "uppercase" }}>WordFlow</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginTop: 6, marginBottom: 4, color: "#ffffff", letterSpacing: "-0.5px" }}>Kelime İstatistiklerim</h1>
          <div style={{ 
            display: "inline-flex", 
            alignItems: "center", 
            background: "rgba(99, 102, 241, 0.08)", 
            padding: "4px 12px", 
            borderRadius: 100, 
            fontSize: 13, 
            color: "#a5b4fc",
            fontWeight: 500,
            border: "1px solid rgba(99, 102, 241, 0.15)"
          }}>
            ⚡ {learnedWords.length} kelime öğreniliyor
          </div>
        </div>

        {/* Word List or Empty State */}
        {learnedWords.length === 0 ? (
          <div style={{ 
            background: "#131324", 
            borderRadius: 20, 
            padding: "40px 24px", 
            textAlign: "center", 
            border: "1px solid #222240",
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3)"
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🌱</div>
            <div style={{ color: "#f1f5f9", fontWeight: 600, marginBottom: 6 }}>Henüz kelime yok</div>
            <p style={{ color: "#64748b", fontSize: 13, margin: 0, lineHeight: 1.5 }}>
              Henüz havuzunda kelime bulunmuyor. Ana sayfaya dönüp yeni kelimeler keşfetmeye başla!
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {learnedWords.map((item, idx) => {
              const badge = getMasteryBadge(item.masteryLevel, item.isMastered);
              
              // Doğruluk oranına göre dinamik renk belirleme
              const accuracyColor = item.accuracy >= 85 ? "#10b981" : item.accuracy >= 60 ? "#f59e0b" : item.accuracy > 0 ? "#ef4444" : "#64748b";
              
              return (
                <div key={idx} style={{ 
                  background: "#131324", 
                  borderRadius: 20, 
                  padding: "18px 20px",
                  border: "1px solid #1e1e38",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.2)",
                  position: "relative",
                  overflow: "hidden"
                }}>
                  {/* Badge sol çizgi tasarımı */}
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

                  {/* Üst Kısım: Kelime ve Anlamı */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ fontSize: 20, fontWeight: 700, color: "#ffffff", letterSpacing: "-0.3px" }}>{item.word}</span>
                        <span style={{ fontSize: 14, color: "#94a3b8", fontWeight: 400 }}>{item.meaning}</span>
                      </div>
                      
                      {badge && (
                        <div style={{ 
                          display: "inline-flex", 
                          alignItems: "center", 
                          gap: 4, 
                          background: `${badge.color}15`, 
                          padding: "6px 12px", 
                          borderRadius: 12,
                          border: `1px solid ${badge.color}30`,
                          whiteSpace: "nowrap"
                        }}>
                          <span style={{ fontSize: 13 }}>{badge.emoji}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: badge.color, letterSpacing: "0.2px" }}>{badge.label}</span>
                          <span style={{ fontSize: 10, color: badge.color, opacity: 0.8 }}>{badge.days}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* İstatistik Grid Yapısı */}
                  <div style={{ 
                    display: "grid", 
                    gridTemplateColumns: "repeat(4, 1fr)", 
                    gap: 8,
                    background: "#1a1a30",
                    padding: "12px 8px",
                    borderRadius: 14,
                    marginBottom: 12
                  }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#10b981" }}>{item.totalCorrect}</div>
                      <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, marginTop: 2, textTransform: "uppercase", letterSpacing: "0.5px" }}>Doğru</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#ef4444" }}>{item.totalWrong}</div>
                      <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, marginTop: 2, textTransform: "uppercase", letterSpacing: "0.5px" }}>Yanlış</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: accuracyColor }}>%{item.accuracy}</div>
                      <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, marginTop: 2, textTransform: "uppercase", letterSpacing: "0.5px" }}>Başarı</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#818cf8" }}>{item.totalReviews}</div>
                      <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, marginTop: 2, textTransform: "uppercase", letterSpacing: "0.5px" }}>Tekrar</div>
                    </div>
                  </div>

                  {/* Mini İlerleme Çubuğu (Görsel Zenginlik İçin) */}
                  <div style={{ width: "100%", height: 4, background: "#1a1a30", borderRadius: 2, overflow: "hidden" }}>
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
            })}
          </div>
        )}
      </div>
    </div>
  );
}