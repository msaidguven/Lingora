import { useState, useEffect } from "react";
import { supabase } from "./config.js";

const FIXED_USER_ID = "302a3b6b-c1e9-49c4-98fe-52115bd7d204";

export default function StatsScreen({ userLevel }) {
  const [loading, setLoading] = useState(true);
  const [learnedWords, setLearnedWords] = useState([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    
    // Kullanıcının havuzundaki kelimeleri al
    const { data: userWords } = await supabase
      .from("en_user_words")
      .select(`
        word_id,
        review_count,
        last_score,
        en_words (word, meaning)
      `)
      .eq("user_id", FIXED_USER_ID);
    
    if (!userWords || userWords.length === 0) {
      setLearnedWords([]);
      setLoading(false);
      return;
    }
    
    const wordsWithStats = [];
    
    for (const uw of userWords) {
      if (!uw.en_words) continue;
      
      // Bu kelimeye ait quiz sorularını bul
      const { data: quizQuestions } = await supabase
        .from("en_quiz_questions")
        .select("id")
        .eq("word_id", uw.word_id);
      
      const questionIds = quizQuestions?.map(q => q.id) || [];
      
      let streak = 0;
      let totalCorrect = 0;
      let totalWrong = 0;
      
      if (questionIds.length > 0) {
        // Son cevapları al (art arda doğru için)
        const { data: recentAttempts } = await supabase
          .from("en_user_quiz_attempts")
          .select("is_correct")
          .eq("user_id", FIXED_USER_ID)
          .in("question_id", questionIds)
          .order("attempted_at", { ascending: false })
          .limit(20);
        
        // Art arda doğru hesapla
        if (recentAttempts) {
          for (let i = 0; i < recentAttempts.length; i++) {
            if (recentAttempts[i].is_correct) {
              streak++;
            } else {
              break;
            }
          }
        }
        
        // Tüm zamanların doğru/yanlış sayısı
        const { data: allAttempts } = await supabase
          .from("en_user_quiz_attempts")
          .select("is_correct")
          .eq("user_id", FIXED_USER_ID)
          .in("question_id", questionIds);
        
        if (allAttempts) {
          totalCorrect = allAttempts.filter(a => a.is_correct).length;
          totalWrong = allAttempts.filter(a => !a.is_correct).length;
        }
      }
      
      wordsWithStats.push({
        word: uw.en_words.word,
        meaning: uw.en_words.meaning,
        reviewCount: uw.review_count || 0,
        streak: streak,
        totalCorrect: totalCorrect,
        totalWrong: totalWrong
      });
    }
    
    setLearnedWords(wordsWithStats);
    setLoading(false);
  };

  const getStreakBadge = (streak) => {
    if (streak >= 10) return { emoji: "🏆", color: "#fbbf24", label: "Efsane" };
    if (streak >= 5) return { emoji: "⭐", color: "#10b981", label: "Usta" };
    if (streak >= 3) return { emoji: "🔥", color: "#f59e0b", label: "Ateşli" };
    if (streak >= 1) return { emoji: "👍", color: "#6366f1", label: "İyi" };
    return { emoji: "📖", color: "#64748b", label: "Başla" };
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
            const badge = getStreakBadge(item.streak);
            const totalAttempts = item.totalCorrect + item.totalWrong;
            const accuracy = totalAttempts > 0 ? Math.round((item.totalCorrect / totalAttempts) * 100) : 0;
            
            return (
              <div key={idx} style={{ 
                background: "#1a1a2e", 
                borderRadius: 16, 
                padding: 16,
                borderLeft: `4px solid ${badge.color}`
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div>
                    <span style={{ fontSize: 18, fontWeight: 800 }}>{item.word}</span>
                    <span style={{ fontSize: 13, color: "#64748b", marginLeft: 8 }}>{item.meaning}</span>
                  </div>
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: 6,
                    background: `${badge.color}22`,
                    padding: "4px 10px",
                    borderRadius: 20
                  }}>
                    <span style={{ fontSize: 14 }}>{badge.emoji}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: badge.color }}>{item.streak}</span>
                    <span style={{ fontSize: 10, color: badge.color }}>{badge.label}</span>
                  </div>
                </div>
                
                {item.streak > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#64748b", marginBottom: 4 }}>
                      <span>Art arda doğru</span>
                      <span style={{ color: badge.color }}>{item.streak} ✓</span>
                    </div>
                    <div style={{ height: 4, background: "#0f0f1a", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ width: `${Math.min(item.streak * 10, 100)}%`, height: "100%", background: badge.color, borderRadius: 99 }} />
                    </div>
                  </div>
                )}
                
                <div style={{ display: "flex", gap: 16, paddingTop: 8, borderTop: "1px solid #0f0f1a" }}>
                  <div style={{ textAlign: "center", flex: 1 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#10b981" }}>{item.totalCorrect}</div>
                    <div style={{ fontSize: 10, color: "#64748b" }}>Doğru</div>
                  </div>
                  <div style={{ textAlign: "center", flex: 1 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#ef4444" }}>{item.totalWrong}</div>
                    <div style={{ fontSize: 10, color: "#64748b" }}>Yanlış</div>
                  </div>
                  <div style={{ textAlign: "center", flex: 1 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: accuracy >= 70 ? "#10b981" : accuracy >= 40 ? "#f59e0b" : "#64748b" }}>
                      %{accuracy}
                    </div>
                    <div style={{ fontSize: 10, color: "#64748b" }}>Başarı</div>
                  </div>
                  <div style={{ textAlign: "center", flex: 1 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#6366f1" }}>{item.reviewCount}</div>
                    <div style={{ fontSize: 10, color: "#64748b" }}>Tekrar</div>
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