import { useState, useEffect } from "react";
import { supabase } from "../config.js";

const FIXED_USER_ID = "302a3b6b-c1e9-49c4-98fe-52115bd7d204";

export default function StatsScreen({ userLevel }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalWords: 0,
    learnedWords: 0,
    totalSentences: 0,
    learnedSentences: 0,
    accuracy: 0,
    weakWords: [],
    recentActivity: []
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    
    // Toplam kelime sayısı
    const { count: totalWords } = await supabase
      .from("en_words")
      .select("*", { count: "exact", head: true })
      .eq("level", userLevel)
      .eq("type", "word");
    
    // Öğrenilen kelime sayısı
    const { count: learnedWords } = await supabase
      .from("en_user_words")
      .select("*", { count: "exact", head: true })
      .eq("user_id", FIXED_USER_ID);
    
    // Toplam cümle sayısı
    const { count: totalSentences } = await supabase
      .from("en_example_sentences")
      .select("*", { count: "exact", head: true })
      .eq("is_approved", true);
    
    // Öğrenilen cümle sayısı
    const { count: learnedSentences } = await supabase
      .from("en_user_sentences")
      .select("*", { count: "exact", head: true })
      .eq("user_id", FIXED_USER_ID);
    
    // Zorlanılan kelimeler (doğruluk oranı düşük olanlar)
    const { data: userWords } = await supabase
      .from("en_user_words")
      .select("word_id, review_count, last_score")
      .eq("user_id", FIXED_USER_ID)
      .eq("last_score", 0);
    
    let weakWords = [];
    if (userWords && userWords.length > 0) {
      const wordIds = userWords.map(w => w.word_id);
      const { data: words } = await supabase
        .from("en_words")
        .select("word, meaning")
        .in("id", wordIds);
      weakWords = words || [];
    }
    
    // Genel doğruluk
    const { data: attempts } = await supabase
      .from("en_user_quiz_attempts")
      .select("is_correct")
      .eq("user_id", FIXED_USER_ID);
    
    const totalAttempts = attempts?.length || 0;
    const correctAttempts = attempts?.filter(a => a.is_correct).length || 0;
    const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;
    
    setStats({
      totalWords: totalWords || 0,
      learnedWords: learnedWords || 0,
      totalSentences: totalSentences || 0,
      learnedSentences: learnedSentences || 0,
      accuracy,
      weakWords,
      totalAttempts
    });
    
    setLoading(false);
  };

  const wordProgress = stats.totalWords > 0 ? (stats.learnedWords / stats.totalWords) * 100 : 0;
  const sentenceProgress = stats.totalSentences > 0 ? (stats.learnedSentences / stats.totalSentences) * 100 : 0;

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <div style={{ color: "#64748b" }}>Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", padding: "20px" }}>
      {/* Genel İstatistikler */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        <div style={{ background: "#1a1a2e", borderRadius: 14, padding: 16, textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📚</div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>{stats.learnedWords}</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>Öğrenilen Kelime</div>
          <div style={{ fontSize: 11, color: "#10b981", marginTop: 4 }}>%{Math.round(wordProgress)}</div>
        </div>
        <div style={{ background: "#1a1a2e", borderRadius: 14, padding: 16, textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>{stats.learnedSentences}</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>Öğrenilen Cümle</div>
          <div style={{ fontSize: 11, color: "#10b981", marginTop: 4 }}>%{Math.round(sentenceProgress)}</div>
        </div>
      </div>

      {/* Doğruluk Oranı */}
      <div style={{ background: "#1a1a2e", borderRadius: 14, padding: 16, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: "#64748b" }}>Genel Doğruluk Oranı</span>
          <span style={{ fontSize: 18, fontWeight: 800, color: stats.accuracy >= 70 ? "#10b981" : stats.accuracy >= 40 ? "#f59e0b" : "#ef4444" }}>
            %{stats.accuracy}
          </span>
        </div>
        <div style={{ height: 8, background: "#0f0f1a", borderRadius: 99, overflow: "hidden" }}>
          <div style={{ width: `${stats.accuracy}%`, height: "100%", background: stats.accuracy >= 70 ? "#10b981" : stats.accuracy >= 40 ? "#f59e0b" : "#ef4444", borderRadius: 99 }} />
        </div>
        <div style={{ fontSize: 11, color: "#475569", marginTop: 8 }}>Toplam {stats.totalAttempts} cevap</div>
      </div>

      {/* Zorlanılan Kelimeler */}
      {stats.weakWords.length > 0 && (
        <div style={{ background: "#1a1a2e", borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <span>⚠️</span> Zorlandığın Kelimeler
          </div>
          {stats.weakWords.map((word, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: i < stats.weakWords.length - 1 ? "1px solid #0f0f1a" : "none" }}>
              <div>
                <div style={{ fontWeight: 600 }}>{word.word}</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>{word.meaning}</div>
              </div>
              <div style={{ fontSize: 11, color: "#ef4444", background: "#2d0e0e", padding: "2px 8px", borderRadius: 20 }}>Tekrar Et</div>
            </div>
          ))}
        </div>
      )}

      {/* Henüz veri yoksa */}
      {stats.weakWords.length === 0 && stats.learnedWords === 0 && (
        <div style={{ background: "#1a1a2e", borderRadius: 14, padding: 32, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Henüz istatistik yok</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>Kelime çalışmaya başladıkça istatistiklerin burada görünecek.</div>
        </div>
      )}
    </div>
  );
}