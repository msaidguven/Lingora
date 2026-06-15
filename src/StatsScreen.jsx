import { useState, useEffect } from "react";
import { supabase } from "./config.js";

const FIXED_USER_ID = "302a3b6b-c1e9-49c4-98fe-52115bd7d204";

export default function StatsScreen({ userLevel }) {
  const [loading, setLoading] = useState(true);
  const [learnedWords, setLearnedWords] = useState([]);
  const [streak, setStreak] = useState(0);
  const [totalStats, setTotalStats] = useState({ correct: 0, wrong: 0 });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    
    // 1. Kullanıcının havuzundaki kelimeleri ve istatistiklerini al
    const { data: userWords } = await supabase
      .from("en_user_words")
      .select(`
        word_id,
        review_count,
        last_score,
        en_words (word, meaning)
      `)
      .eq("user_id", FIXED_USER_ID);
    
    // 2. Son 10 cevaptaki art arda doğru sayısını bul
    const { data: recentAttempts } = await supabase
      .from("en_user_quiz_attempts")
      .select("is_correct")
      .eq("user_id", FIXED_USER_ID)
      .order("attempted_at", { ascending: false })
      .limit(20);
    
    let currentStreak = 0;
    if (recentAttempts) {
      for (let i =0; i < recentAttempts.length; i++) {
        if (recentAttempts[i].is_correct) {
          currentStreak++;
        } else {
          break;
        }
      }
    }
    
    // 3. Toplam doğru/yanlış
    const { data: allAttempts } = await supabase
      .from("en_user_quiz_attempts")
      .select("is_correct")
      .eq("user_id", FIXED_USER_ID);
    
    const totalCorrect = allAttempts?.filter(a => a.is_correct).length || 0;
    const totalWrong = allAttempts?.filter(a => !a.is_correct).length || 0;
    
    // 4. Kelime bazlı istatistikleri düzenle
    const wordsWithStats = (userWords || [])
      .filter(uw => uw.en_words)
      .map(uw => ({
        word: uw.en_words.word,
        meaning: uw.en_words.meaning,
        reviewCount: uw.review_count || 0,
        lastScore: uw.last_score || 0,
        // Doğruluk yüzdesi (son skor 100 ise doğru, 0 ise yanlış)
        isCorrect: uw.last_score === 100
      }));
    
    setLearnedWords(wordsWithStats);
    setStreak(currentStreak);
    setTotalStats({ correct: totalCorrect, wrong: totalWrong });
    setLoading(false);
  };

  // Rozet ve renk belirleme
  const getStreakBadge = () => {
    if (streak >= 20) return { emoji: "🏆", color: "#fbbf24", label: "Efsane!" };
    if (streak >= 10) return { emoji: "⭐", color: "#10b981", label: "Harika!" };
    if (streak >= 5) return { emoji: "🔥", color: "#f59e0b", label: "Ateşlisin!" };
    if (streak >= 3) return { emoji: "👍", color: "#6366f1", label: "İyi Gidiyorsun" };
    if (streak > 0) return { emoji: "✅", color: "#64748b", label: "Devam Et" };
    return { emoji: "😔", color: "#ef4444", label: "Yeni Başla" };
  };

  const streakBadge = getStreakBadge();

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <div style={{ color: "#64748b" }}>Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", padding: "20px" }}>
      
      {/* Streak Kartı */}
      <div style={{ 
        background: "linear-gradient(135deg, #1a1a2e, #16213e)", 
        borderRadius: 20, 
        padding: 24, 
        marginBottom: 20, 
        textAlign: "center",
        border: `2px solid ${streakBadge.color}44`
      }}>
        <div style={{ fontSize: 64, marginBottom: 8 }}>{streakBadge.emoji}</div>
        <div style={{ fontSize: 42, fontWeight: 800, color: streakBadge.color }}>
          {streak}
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: streakBadge.color, marginBottom: 4 }}>
          {streakBadge.label}
        </div>
        <div style={{ fontSize: 11, color: "#64748b" }}>
          Art arda doğru cevap sayısı
        </div>
        {streak === 0 && (
          <div style={{ marginTop: 10, fontSize: 11, color: "#475569" }}>
            Bir sonraki doğru cevabında rozet kazanmaya başla!
          </div>
        )}
      </div>

      {/* Toplam Doğru/Yanlış */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        <div style={{ background: "#0e2d1f", borderRadius: 14, padding: 16, textAlign: "center", border: "1px solid #10b98144" }}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>✓</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#10b981" }}>{totalStats.correct}</div>
          <div style={{ fontSize: 11, color: "#64748b" }}>Doğru Cevap</div>
        </div>
        <div style={{ background: "#2d0e0e", borderRadius: 14, padding: 16, textAlign: "center", border: "1px solid #ef444444" }}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>✗</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#ef4444" }}>{totalStats.wrong}</div>
          <div style={{ fontSize: 11, color: "#64748b" }}>Yanlış Cevap</div>
        </div>
      </div>

      {/* Kelime Bazlı İstatistikler */}
      <div style={{ background: "#1a1a2e", borderRadius: 16, padding: 16, marginBottom: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <span>📋</span> Kelime Havuzum
          <span style={{ fontSize: 11, color: "#64748b", fontWeight: 400 }}>({learnedWords.length} kelime)</span>
        </div>
        
        {learnedWords.length === 0 ? (
          <div style={{ textAlign: "center", padding: 32, color: "#64748b" }}>
            Henüz havuzunda kelime yok. Ana sayfadan yeni kelime aç!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {learnedWords.map((item, idx) => {
              const totalAttempts = item.reviewCount;
              const successRate = totalAttempts > 0 
                ? Math.round((item.isCorrect ? 1 : 0) * 100) 
                : 0;
              
              return (
                <div key={idx} style={{ 
                  background: "#0f0f1a", 
                  borderRadius: 12, 
                  padding: 12,
                  borderLeft: `4px solid ${item.isCorrect ? "#10b981" : "#ef4444"}`
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{item.word}</span>
                      <span style={{ fontSize: 12, color: "#64748b", marginLeft: 8 }}>{item.meaning}</span>
                    </div>
                    <div style={{ 
                      fontSize: 11, 
                      fontWeight: 600, 
                      color: item.isCorrect ? "#10b981" : "#ef4444",
                      background: item.isCorrect ? "#10b98122" : "#ef444422",
                      padding: "2px 8px",
                      borderRadius: 20
                    }}>
                      {item.isCorrect ? "✓ Başarılı" : "✗ Zorlanıyor"}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 16, fontSize: 11, color: "#475569" }}>
                    <span>📊 {item.reviewCount} tekrar</span>
                    <span>📈 %{successRate} başarı</span>
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