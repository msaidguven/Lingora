import { useState, useEffect } from "react";
import { supabase } from "./config.js";

const FIXED_USER_ID = "302a3b6b-c1e9-49c4-98fe-52115bd7d204";

const getMasteryBadge = (level, isMastered) => {
  if (!isMastered && level === 0) return null;
  
  if (level >= 9) return { emoji: "🏆", color: "#fbbf24", label: "Efsane Uzman", days: "180 gün" };
  if (level >= 8) return { emoji: "💎", color: "#a855f7", label: "Diamond Uzman", days: "120 gün" };
  if (level >= 7) return { emoji: "⭐", color: "#3b82f6", label: "Gold Uzman", days: "90 gün" };
  if (level >= 6) return { emoji: "🌟", color: "#10b981", label: "Silver Uzman", days: "60 gün" };
  if (level >= 5) return { emoji: "🔥", color: "#f59e0b", label: "Bronz Uzman", days: "30 gün" };
  if (level >= 3) return { emoji: "📘", color: "#6366f1", label: "Bilgili", days: `${level === 3 ? 7 : 14} gün` };
  return { emoji: "📖", color: "#64748b", label: "Öğreniyor", days: `${level === 1 ? 1 : 3} gün` };
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
        
        return {
          word: uw.en_words.word,
          meaning: uw.en_words.meaning,
          reviewCount: uw.review_count || 0,
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
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <div style={{ color: "#64748b" }}>Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", padding: "20px" }}>
      
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 11, letterSpacing: 3, color: "#6366f1", fontWeight: 700 }}>WordFlow</div>
        <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>Kelime İstatistiklerim</div>
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{learnedWords.length} kelime öğreniliyor</div>
      </div>

      {learnedWords.length === 0 ? (
        <div style={{ background: "#1a1a2e", borderRadius: 16, padding: 32, textAlign: "center", color: "#64748b" }}>
          Henüz havuzunda kelime yok. Ana sayfadan yeni kelime aç!
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {learnedWords.map((item, idx) => {
            const badge = getMasteryBadge(item.masteryLevel, item.isMastered);
            
            return (
              <div key={idx} style={{ 
                background: "#1a1a2e", 
                borderRadius: 16, 
                padding: 16,
                borderLeft: badge ? `4px solid ${badge.color}` : "none",
                borderBottom: "1px solid #0f0f1a"
              }}>
                <div style={{ marginBottom: 12, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                  <span style={{ fontSize: 18, fontWeight: 800 }}>{item.word}</span>
                  <span style={{ fontSize: 13, color: "#64748b" }}>{item.meaning}</span>
                  
                  {badge && (
                    <div style={{ 
                      display: "inline-flex", 
                      alignItems: "center", 
                      gap: 4, 
                      background: `${badge.color}22`, 
                      padding: "4px 10px", 
                      borderRadius: 20
                    }}>
                      <span style={{ fontSize: 12 }}>{badge.emoji}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: badge.color }}>{badge.label}</span>
                      <span style={{ fontSize: 9, color: badge.color }}>({badge.days})</span>
                    </div>
                  )}
                </div>
                
                <div style={{ display: "flex", gap: 16 }}>
                  <div style={{ textAlign: "center", flex: 1 }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: "#10b981" }}>{item.totalCorrect}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>Doğru</div>
                  </div>
                  <div style={{ textAlign: "center", flex: 1 }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: "#ef4444" }}>{item.totalWrong}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>Yanlış</div>
                  </div>
                  <div style={{ textAlign: "center", flex: 1 }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: item.accuracy >= 70 ? "#10b981" : item.accuracy >= 40 ? "#f59e0b" : "#64748b" }}>
                      %{item.accuracy}
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>Başarı</div>
                  </div>
                  <div style={{ textAlign: "center", flex: 1 }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: "#6366f1" }}>{item.reviewCount}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>Tekrar</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}