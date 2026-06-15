import { useState, useEffect } from "react";
import { supabase } from "../config.js";

const FIXED_USER_ID = "302a3b6b-c1e9-49c4-98fe-52115bd7d204";
const LEVEL_COLOR = { A1: "#10b981", A2: "#3b82f6", B1: "#8b5cf6", B2: "#f59e0b" };

export default function Header({ currentScreen, onNavigate, userLevel }) {
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

  return (
    <div style={{ 
      background: "#0f0f1a", 
      borderBottom: "1px solid #1e293b",
      padding: "12px 20px",
      position: "sticky",
      top: 0,
      zIndex: 100
    }}>
      <div style={{ 
        maxWidth: 420, 
        margin: "0 auto", 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center" 
      }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 3, color: "#6366f1", fontWeight: 700 }}>WordFlow</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>
            Merhaba, {user?.username || "Öğrenci"}
          </div>
        </div>
        
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => onNavigate("home")}
            style={{
              background: currentScreen === "home" ? levelColor : "#1e293b",
              border: "none",
              borderRadius: 8,
              padding: "6px 12px",
              color: currentScreen === "home" ? "#fff" : "#64748b",
              fontSize: 12,
              cursor: "pointer",
              fontWeight: 600
            }}
          >
            🏠 Ana Sayfa
          </button>
          <button
            onClick={() => onNavigate("quiz")}
            style={{
              background: currentScreen === "quiz" ? levelColor : "#1e293b",
              border: "none",
              borderRadius: 8,
              padding: "6px 12px",
              color: currentScreen === "quiz" ? "#fff" : "#64748b",
              fontSize: 12,
              cursor: "pointer",
              fontWeight: 600
            }}
          >
            📝 Quiz
          </button>
          <button
            onClick={() => onNavigate("stats")}
            style={{
              background: currentScreen === "stats" ? levelColor : "#1e293b",
              border: "none",
              borderRadius: 8,
              padding: "6px 12px",
              color: currentScreen === "stats" ? "#fff" : "#64748b",
              fontSize: 12,
              cursor: "pointer",
              fontWeight: 600
            }}
          >
            📊 İstatistik
          </button>
        </div>
        
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: "#64748b" }}>🔥 Streak</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#f59e0b" }}>{user?.streak_days || 0}</div>
        </div>
      </div>
    </div>
  );
}