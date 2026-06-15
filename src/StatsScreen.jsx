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
      
      let totalCorrect = 0;
      let totalWrong = 0;
      
      if (questionIds.length > 0) {
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
        totalCorrect: totalCorrect,
        totalWrong: totalWrong
      });
    }
    
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
            const totalAttempts = item.totalCorrect + item.totalWrong;
            const accuracy = totalAttempts > 0 ? Math.round((item.totalCorrect / totalAttempts) * 100) : 0;
            
            return (
              <div key={idx} style={{ 
                background: "#1a1a2e", 
                borderRadius: 16, 
                padding: 16,
                borderBottom: "1px solid #0f0f1a"
              }}>
                <div style={{ marginBottom: 12 }}>
                  <span style={{ fontSize: 18, fontWeight: 800 }}>{item.word}</span>
                  <span style={{ fontSize: 13, color: "#64748b", marginLeft: 8 }}>{item.meaning}</span>
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
                    <div style={{ fontSize: 24, fontWeight: 700, color: accuracy >= 70 ? "#10b981" : accuracy >= 40 ? "#f59e0b" : "#64748b" }}>
                      %{accuracy}
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