import { useState, useEffect } from "react";
import { supabase } from "./config.js";

const FIXED_USER_ID = "302a3b6b-c1e9-49c4-98fe-52115bd7d204";

export default function HomeScreen({ onStartQuiz, onOpenNewWord }) {
  const [loading, setLoading] = useState(true);
  const [totalWords, setTotalWords] = useState(0);
  const [myWordsCount, setMyWordsCount] = useState(0);
  const [dailyRemaining, setDailyRemaining] = useState(0);
  const [userLevel, setUserLevel] = useState("A1");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // Kullanıcı seviyesini al
    const { data: user } = await supabase
      .from("en_users")
      .select("level")
      .eq("id", FIXED_USER_ID)
      .single();
    
    const level = user?.level || "A1";
    setUserLevel(level);
    
    // Toplam kelime sayısı (seviyeye göre)
    const { count: total } = await supabase
      .from("en_words")
      .select("*", { count: "exact", head: true })
      .eq("level", level)
      .eq("type", "word");
    
    // Benim havuzumdaki kelime sayısı
    const { count: myWords } = await supabase
      .from("en_user_words")
      .select("*", { count: "exact", head: true })
      .eq("user_id", FIXED_USER_ID);
    
    // Günlük kalan hak
    const { data: daily } = await supabase
      .from("en_user_daily_limit")
      .select("remaining_today")
      .eq("user_id", FIXED_USER_ID)
      .single();
    
    setTotalWords(total || 0);
    setMyWordsCount(myWords || 0);
    setDailyRemaining(daily?.remaining_today ?? 5);
    setLoading(false);
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f0f1a", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#64748b" }}>Yükleniyor...</div>
      </div>
    );
  }

  const progress = totalWords > 0 ? (myWordsCount / totalWords) * 100 : 0;

  return (
    <div style={{ minHeight: "100vh", background: "#0f0f1a", color: "#e2e8f0", fontFamily: "'Inter', system-ui, sans-serif", maxWidth: 420, margin: "0 auto", padding: "24px 20px" }}>
      
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 10, letterSpacing: 3, color: "#6366f1", fontWeight: 700 }}>WordFlow</div>
        <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>{userLevel} Seviyesi</div>
      </div>

      {/* İlerleme çubuğu */}
      <div style={{ background: "#1a1a2e", borderRadius: 16, padding: 16, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: "#64748b" }}>Kelime Haznen</span>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{myWordsCount} / {totalWords}</span>
        </div>
        <div style={{ height: 8, background: "#0f0f1a", borderRadius: 99, overflow: "hidden" }}>
          <div style={{ width: `${progress}%`, height: "100%", background: "#6366f1", borderRadius: 99 }} />
        </div>
      </div>

      {/* Yeni kelime aç butonu */}
      {dailyRemaining > 0 && myWordsCount < totalWords && (
        <button 
          onClick={onOpenNewWord}
          style={{ 
            width: "100%", padding: "18px", borderRadius: 14, border: "none", 
            background: "#10b981", color: "#fff", fontWeight: 700, fontSize: 16, 
            cursor: "pointer", marginBottom: 12
          }}
        >
          🎁 Yeni Kelime Aç ({dailyRemaining} hak)
        </button>
      )}

      {/* Tekrar et butonu */}
      <button 
        onClick={onStartQuiz}
        style={{ 
          width: "100%", padding: "18px", borderRadius: 14, border: "none", 
          background: "#6366f1", color: "#fff", fontWeight: 700, fontSize: 16, 
          cursor: "pointer", marginBottom: 12
        }}
      >
        🔄 Tekrar Et
      </button>

      {/* İstatistik kartları */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8 }}>
        <div style={{ background: "#1a1a2e", borderRadius: 14, padding: 14, textAlign: "center" }}>
          <div style={{ fontSize: 24, marginBottom: 4 }}>📊</div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{Math.round(progress)}%</div>
          <div style={{ fontSize: 11, color: "#64748b" }}>Tamamlanma</div>
        </div>
        <div style={{ background: "#1a1a2e", borderRadius: 14, padding: 14, textAlign: "center" }}>
          <div style={{ fontSize: 24, marginBottom: 4 }}>⏳</div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{totalWords - myWordsCount}</div>
          <div style={{ fontSize: 11, color: "#64748b" }}>Kalan Kelime</div>
        </div>
      </div>
    </div>
  );
}