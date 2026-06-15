import { useState, useEffect } from "react";
import { supabase } from "./config.js";

// Sabit kullanıcı (manuel girilecek)
const FIXED_USER_ID = "302a3b6b-c1e9-49c4-98fe-52115bd7d204";

function HomeScreen({ onStartQuiz }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dailyLimit, setDailyLimit] = useState(null);
  const [dueCount, setDueCount] = useState(0);
  const [newWordsCount, setNewWordsCount] = useState(0);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    
    // 1. Kullanıcı bilgilerini al
    const { data: userData } = await supabase
      .from("en_users")
      .select("*")
      .eq("id", FIXED_USER_ID)
      .single();
    
    // 2. Günlük limiti al
    const { data: limitData } = await supabase
      .from("en_user_daily_limit")
      .select("remaining_today, last_reset_date")
      .eq("user_id", FIXED_USER_ID)
      .single();
    
    // 3. Tekrar edilmesi gereken kelime sayısı (next_review_at < now)
    const { count: due } = await supabase
      .from("en_user_words")
      .select("*", { count: "exact", head: true })
      .eq("user_id", FIXED_USER_ID)
      .lt("next_review_at", new Date().toISOString());
    
    // 4. Yeni açılabilecek kelime sayısı (havuzda olmayanlar)
    const { data: userWords } = await supabase
      .from("en_user_words")
      .select("word_id")
      .eq("user_id", FIXED_USER_ID);
    
    const learnedWordIds = userWords?.map(w => w.word_id) || [];
    
    const { count: newWords } = await supabase
      .from("en_words")
      .select("*", { count: "exact", head: true })
      .not("id", "in", `(${learnedWordIds.join(",") || "''"})`)
      .eq("type", "word");
    
    setUser(userData);
    setDailyLimit(limitData?.remaining_today || 0);
    setDueCount(due || 0);
    setNewWordsCount(newWords || 0);
    setLoading(false);
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f0f1a", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#64748b" }}>Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0f0f1a", color: "#e2e8f0", fontFamily: "'Inter', system-ui, sans-serif", maxWidth: 420, margin: "0 auto", padding: "24px 20px" }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 3, color: "#6366f1", fontWeight: 700 }}>WordFlow</div>
          <div style={{ fontSize: 20, fontWeight: 800, marginTop: 2 }}>Merhaba, {user?.username}</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>Seviye: {user?.level}</div>
        </div>
        <div style={{ textAlign: "right", background: "#1a1a2e", padding: "8px 14px", borderRadius: 12 }}>
          <div style={{ fontSize: 11, color: "#64748b" }}>🔥 Streak</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#f59e0b" }}>{user?.streak_days || 0}</div>
        </div>
      </div>

      {/* Günlük Limit Kartı */}
      <div style={{ background: "linear-gradient(135deg, #1e293b, #0f0f1a)", borderRadius: 20, padding: 20, marginBottom: 20, border: "1px solid #1e293b" }}>
        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>Bugünkür Yeni Kelime Hakkı</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 36, fontWeight: 800, color: "#6366f1" }}>{dailyLimit}</span>
          <span style={{ fontSize: 14, color: "#475569" }}>/ 5 kaldı</span>
        </div>
        <div style={{ height: 6, background: "#1a1a2e", borderRadius: 99, marginTop: 12, overflow: "hidden" }}>
          <div style={{ width: `${(dailyLimit / 5) * 100}%`, height: "100%", background: "#6366f1", borderRadius: 99 }} />
        </div>
      </div>

      {/* Butonlar */}
      <button 
        onClick={() => onStartQuiz("new", dailyLimit)} 
        disabled={dailyLimit === 0 || newWordsCount === 0}
        style={{ 
          width: "100%", padding: "18px", borderRadius: 14, border: "none", 
          background: dailyLimit > 0 && newWordsCount > 0 ? "#6366f1" : "#1e1e30", 
          color: dailyLimit > 0 && newWordsCount > 0 ? "#fff" : "#475569", 
          fontWeight: 700, fontSize: 16, cursor: dailyLimit > 0 && newWordsCount > 0 ? "pointer" : "not-allowed",
          marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center"
        }}
      >
        <span>🆕 Yeni Kelime Öğren</span>
        <span style={{ background: "#ffffff22", padding: "4px 10px", borderRadius: 20, fontSize: 13 }}>{newWordsCount} yeni</span>
      </button>

      <button 
        onClick={() => onStartQuiz("review")} 
        disabled={dueCount === 0}
        style={{ 
          width: "100%", padding: "18px", borderRadius: 14, border: "none", 
          background: dueCount > 0 ? "#10b981" : "#1e1e30", 
          color: dueCount > 0 ? "#fff" : "#475569", 
          fontWeight: 700, fontSize: 16, cursor: dueCount > 0 ? "pointer" : "not-allowed",
          display: "flex", justifyContent: "space-between", alignItems: "center"
        }}
      >
        <span>🔄 Tekrar Et</span>
        <span style={{ background: "#ffffff22", padding: "4px 10px", borderRadius: 20, fontSize: 13 }}>{dueCount} kelime</span>
      </button>

      {/* İstatistik */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 24 }}>
        <div style={{ background: "#1a1a2e", borderRadius: 14, padding: 14, textAlign: "center" }}>
          <div style={{ fontSize: 24, marginBottom: 4 }}>📚</div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{newWordsCount}</div>
          <div style={{ fontSize: 11, color: "#64748b" }}>Kalan Kelime</div>
        </div>
        <div style={{ background: "#1a1a2e", borderRadius: 14, padding: 14, textAlign: "center" }}>
          <div style={{ fontSize: 24, marginBottom: 4 }}>✅</div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{dueCount}</div>
          <div style={{ fontSize: 11, color: "#64748b" }}>Tekrar Bekleyen</div>
        </div>
      </div>
    </div>
  );
}

export default HomeScreen;