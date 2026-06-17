// HomeScreen.jsx
import { useState, useEffect } from "react";
import { supabase } from "./config.js";

export default function HomeScreen({ onStartQuiz, onNavigate, onGoToLesson }) {
  const [recentLessons, setRecentLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentLessons();
  }, []);

  const fetchRecentLessons = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("en_lessons")
        .select("id, lesson_number, title, level")
        .order("level")
        .order("lesson_number")
        .limit(5);

      if (error) throw error;
      setRecentLessons(data || []);
    } catch (error) {
      console.error("Dersler çekilirken hata:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      maxWidth: 800, 
      margin: "0 auto", 
      padding: "40px 20px",
      color: "#e2e8f0"
    }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <h1 style={{ 
          fontSize: 42, 
          fontWeight: 800,
          background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          margin: 0
        }}>
          İngilizce Öğren
        </h1>
        <p style={{ color: "#64748b", fontSize: 18, marginTop: 8 }}>
          A1 seviyesinden başlayarak İngilizceni geliştir
        </p>
      </div>

      {/* Ders Listesi */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: "#f1f5f9" }}>
          📚 Dersler
        </h2>
        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
            ⏳ Dersler yükleniyor...
          </div>
        ) : recentLessons.length > 0 ? (
          <div style={{ display: "grid", gap: 12 }}>
            {recentLessons.map((lesson) => (
              <div 
                key={lesson.id}
                onClick={() => onGoToLesson?.(lesson.id)}
                style={{
                  background: "#1a1a2e",
                  borderRadius: 12,
                  padding: "16px 20px",
                  border: "1px solid #1e293b",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#6366f1";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#1e293b";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ 
                      fontSize: 12, 
                      background: "#6366f122", 
                      color: "#6366f1", 
                      padding: "2px 10px", 
                      borderRadius: 4,
                      fontWeight: 600
                    }}>
                      #{lesson.lesson_number}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: 16 }}>{lesson.title}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                    {lesson.level} seviyesi
                  </div>
                </div>
                <div style={{ 
                  color: "#6366f1", 
                  fontSize: 20,
                  transition: "transform 0.2s"
                }}>
                  →
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ 
            textAlign: "center", 
            padding: 40, 
            color: "#64748b",
            background: "#1a1a2e",
            borderRadius: 12,
            border: "1px solid #1e293b"
          }}>
            <p>Henüz ders eklenmemiş.</p>
          </div>
        )}
        
        {recentLessons.length > 0 && (
          <button
            onClick={() => onNavigate?.("dashboard")}
            style={{
              marginTop: 12,
              background: "transparent",
              border: "1px solid #1e293b",
              borderRadius: 8,
              padding: "8px 16px",
              color: "#64748b",
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "inherit"
            }}
          >
            Tüm Dersleri Gör →
          </button>
        )}
      </div>

      {/* Quiz Butonları */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <button
          onClick={() => onStartQuiz?.("word")}
          style={{
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            border: "none",
            borderRadius: 16,
            padding: "24px",
            color: "#fff",
            cursor: "pointer",
            transition: "all 0.2s",
            textAlign: "left"
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>📝</div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>Kelime Testi</div>
          <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>
            Kelime bilgini test et
          </div>
        </button>

        <button
          onClick={() => onStartQuiz?.("sentence")}
          style={{
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            border: "none",
            borderRadius: 16,
            padding: "24px",
            color: "#fff",
            cursor: "pointer",
            transition: "all 0.2s",
            textAlign: "left"
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>Cümle Testi</div>
          <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>
            Cümle kurma becerini test et
          </div>
        </button>
      </div>

      {/* İstatistikler */}
      <button
        onClick={() => onNavigate?.("stats")}
        style={{
          marginTop: 16,
          width: "100%",
          background: "#1a1a2e",
          border: "1px solid #1e293b",
          borderRadius: 12,
          padding: "16px",
          color: "#94a3b8",
          cursor: "pointer",
          fontFamily: "inherit",
          fontSize: 14,
          fontWeight: 600,
          transition: "all 0.2s"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "#334155";
          e.currentTarget.style.color = "#e2e8f0";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "#1e293b";
          e.currentTarget.style.color = "#94a3b8";
        }}
      >
        📊 İstatistikleri Gör
      </button>
    </div>
  );
}