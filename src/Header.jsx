import { useState, useEffect } from "react";
import { supabase } from "./config.js";

const FIXED_USER_ID = "302a3b6b-c1e9-49c4-98fe-52115bd7d204";
const LEVEL_COLOR = {
  A1: "#10b981",
  A2: "#2563eb",
  B1: "#7c3aed",
  B2: "#ea580c",
};

const NAV_ITEMS = [
  { key: "home",      icon: "ti-home",             label: "ANA"   },
  { key: "dashboard", icon: "ti-layout-dashboard",  label: "PANEL" },
  { key: "quiz",      icon: "ti-tournament",        label: "QUIZ"  },
  { key: "stats",     icon: "ti-chart-line",        label: "İSTAT" },
];

export default function Header({ currentScreen, onNavigate, userLevel, quizType = null }) {
  const [user, setUser] = useState(null);
  const levelColor = LEVEL_COLOR[userLevel] || "#4f46e5";

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase
        .from("en_users")
        .select("username, streak_days")
        .eq("id", FIXED_USER_ID)
        .single();
      if (data) setUser(data);
    };

    fetchUser();
  }, []);

  const isActive = (key) => currentScreen === key;

  // Quiz aktifken özel label gösterimi
  const getQuizLabel = () => {
    if (quizType === "word") return "📖 KELİME";
    if (quizType === "sentence") return "📝 CÜMLE";
    return "QUIZ";
  };

  // Quiz aktifken özel ikon gösterimi
  const getQuizIcon = () => {
    if (quizType === "word") return "ti-book";
    if (quizType === "sentence") return "ti-message";
    return "ti-tournament";
  };

  return (
    <div style={{
      background: "#0d0d1a",
      borderBottom: "0.5px solid rgba(255,255,255,0.08)",
      padding: "10px 16px",
      position: "sticky",
      top: 0,
      zIndex: 100,
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      <div style={{
        maxWidth: 480,
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}>

        {/* Kullanıcı */}
        <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 60 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e2f0", letterSpacing: "-0.3px" }}>
            {user?.username || "Öğrenci"}
          </div>
          <a
            href="https://lingora-phi.vercel.app/admin"
            style={{ fontSize: 10, color: "#4a4a6a", textDecoration: "none", letterSpacing: "0.3px", display: "flex", alignItems: "center", gap: 3 }}
            onMouseEnter={e => (e.currentTarget.style.color = "#818cf8")}
            onMouseLeave={e => (e.currentTarget.style.color = "#4a4a6a")}
          >
            ⚙ Admin
          </a>
        </div>

        {/* Nav */}
        <div style={{
          display: "flex",
          flex: 1,
          background: "#080812",
          border: "0.5px solid rgba(255,255,255,0.07)",
          borderRadius: 12,
          padding: 4,
          gap: 3,
        }}>
          {NAV_ITEMS.map(({ key, icon, label }) => {
            const active = isActive(key);
            
            // Quiz butonu özel durumu
            const isQuiz = key === "quiz";
            const displayIcon = isQuiz && active ? getQuizIcon() : icon;
            const displayLabel = isQuiz && active ? getQuizLabel() : label;
            
            return (
              <button
                key={key}
                onClick={() => {
                  // Quiz butonuna tıklandığında quizType'ı sıfırla
                  if (key === "quiz") {
                    onNavigate(key, null);
                  } else {
                    onNavigate(key);
                  }
                }}
                style={{
                  flex: 1,
                  border: "none",
                  borderRadius: 9,
                  padding: "8px 4px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 3,
                  background: active ? levelColor : "transparent",
                  color: active ? "#ffffff" : "#4a4a7a",
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                <i className={`ti ${displayIcon}`} style={{ fontSize: 17 }} aria-hidden="true" />
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.5px" }}>{displayLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Streak */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          background: "rgba(245,158,11,0.1)",
          border: "0.5px solid rgba(245,158,11,0.25)",
          borderRadius: 10,
          padding: "8px 10px",
        }}>
          <i className="ti ti-flame" style={{ fontSize: 16, color: "#f59e0b" }} aria-hidden="true" />
          <span style={{ fontSize: 14, fontWeight: 800, color: "#f59e0b", lineHeight: 1 }}>
            {user?.streak_days || 0}
          </span>
        </div>

      </div>
    </div>
  );
}