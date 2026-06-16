import { useState, useEffect } from "react";
import { supabase } from "./config.js";

const FIXED_USER_ID = "302a3b6b-c1e9-49c4-98fe-52115bd7d204";
const LEVEL_COLOR = { A1: "#10b981", A2: "#3b82f6", B1: "#8b5cf6", B2: "#fb923c" };

export default function Header({ currentScreen, onNavigate, userLevel, quizType = null }) {
  const [user, setUser] = useState(null);
  const levelColor = LEVEL_COLOR[userLevel] || "#6366f1";

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    const { data } = await supabase
      .from("en_users")
      .select("username, streak_days")
      .eq("id", FIXED_USER_ID)
      .single();
    if (data) setUser(data);
  };

  const getQuizTitle = () => {
    if (quizType === "word") return "📖 Kelime";
    if (quizType === "sentence") return "📝 Cümle";
    return "📝 Quiz";
  };

  const isActive = (screen) => {
    if (screen === "quiz" && currentScreen === "quiz") return true;
    return currentScreen === screen;
  };

  return (
    <div style={{ 
      background: "#0b0b14", 
      borderBottom: "1px solid #1e1e38",
      padding: "14px 16px",
      position: "sticky",
      top: 0,
      zIndex: 100,
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      fontFamily: "system-ui, -apple-system, sans-serif"
    }}>
      <div style={{ 
        maxWidth: 440, 
        margin: "0 auto", 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        gap: 12
      }}>
        
        {/* Sol Kısım: Kullanıcı Bilgisi */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#ffffff", letterSpacing: "-0.2px" }}>
            {user?.username || "Öğrenci"}
          </div>
          <div style={{ fontSize: 10, fontWeight: 600 }}>
            <a 
              href="https://lingora-phi.vercel.app/admin" 
              style={{ 
                color: "#64748b", 
                textDecoration: "none", 
                letterSpacing: "0.5px",
                transition: "color 0.2s"
              }}
              onMouseEnter={(e) => e.target.style.color = "#818cf8"}
              onMouseLeave={(e) => e.target.style.color = "#64748b"}
            >
              🛠️ Admin
            </a>
          </div>
        </div>
        
        {/* Orta Kısım: Navigasyon Butonları */}
        <div style={{ 
          display: "flex", 
          background: "#131324", 
          padding: "4px", 
          borderRadius: 12,
          border: "1px solid #1e1e38",
          gap: 2
        }}>
          <button
            onClick={() => onNavigate("home")}
            style={{
              background: isActive("home") ? levelColor : "transparent",
              border: "none",
              borderRadius: 9,
              padding: "6px 10px",
              color: isActive("home") ? "#ffffff" : "#64748b",
              fontSize: 12,
              cursor: "pointer",
              fontWeight: 600,
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: 4,
              whiteSpace: "nowrap"
            }}
          >
            <span>🏠</span> {isActive("home") && "Ana Sayfa"}
          </button>
          
          <button
            onClick={() => onNavigate("dashboard")}
            style={{
              background: isActive("dashboard") ? levelColor : "transparent",
              border: "none",
              borderRadius: 9,
              padding: "6px 10px",
              color: isActive("dashboard") ? "#ffffff" : "#64748b",
              fontSize: 12,
              cursor: "pointer",
              fontWeight: 600,
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: 4,
              whiteSpace: "nowrap"
            }}
          >
            <span>📊</span> {isActive("dashboard") && "Dashboard"}
          </button>
          
          <button
            onClick={() => onNavigate("quiz")}
            style={{
              background: isActive("quiz") ? levelColor : "transparent",
              border: "none",
              borderRadius: 9,
              padding: "6px 10px",
              color: isActive("quiz") ? "#ffffff" : "#64748b",
              fontSize: 12,
              cursor: "pointer",
              fontWeight: 600,
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: 4,
              whiteSpace: "nowrap"
            }}
          >
            <span>{isActive("quiz") && quizType === "word" ? "📖" : 
                   isActive("quiz") && quizType === "sentence" ? "📝" : "🎯"}</span> 
            {isActive("quiz") ? getQuizTitle() : "Quiz"}
          </button>
          
          <button
            onClick={() => onNavigate("stats")}
            style={{
              background: isActive("stats") ? levelColor : "transparent",
              border: "none",
              borderRadius: 9,
              padding: "6px 10px",
              color: isActive("stats") ? "#ffffff" : "#64748b",
              fontSize: 12,
              cursor: "pointer",
              fontWeight: 600,
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: 4,
              whiteSpace: "nowrap"
            }}
          >
            <span>📈</span> {isActive("stats") && "İstatistik"}
          </button>
        </div>
        
        {/* Sağ Kısım: Streak */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 6,
          background: "rgba(245, 158, 11, 0.08)",
          padding: "6px 10px",
          borderRadius: 12,
          border: "1px solid rgba(245, 158, 11, 0.15)"
        }}>
          <span style={{ fontSize: 14 }}>🔥</span>
          <span style={{ 
            fontSize: 13, 
            fontWeight: 800, 
            color: "#f59e0b",
            lineHeight: 1
          }}>
            {user?.streak_days || 0}
          </span>
        </div>

      </div>
    </div>
  );
}