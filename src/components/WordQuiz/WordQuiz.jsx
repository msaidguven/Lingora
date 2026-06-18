// components/quiz/QuizScreen.jsx
import { useState } from "react";
import WordQuiz from "./WordQuiz.jsx";
import SentenceQuiz from "./SentenceQuiz.jsx"; // Varsa

export default function QuizScreen({ userLevel, onChangeLevel, onBack, initialMode }) {
  const [mode, setMode] = useState(initialMode || null);

  // Eğer mode seçilmemişse menüyü göster
  if (!mode) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        background: "#0f0f1a", 
        color: "#e2e8f0",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        fontFamily: "'Inter', system-ui, sans-serif"
      }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>Quiz</h1>
          <p style={{ fontSize: 14, color: "#64748b" }}>
            Hangi quiz'e başlamak istersin?
          </p>
        </div>

        <div style={{ 
          display: "flex", 
          flexDirection: "column", 
          gap: 14, 
          width: "100%", 
          maxWidth: 320 
        }}>
          <button 
            onClick={() => setMode("word")}
            style={{ 
              padding: "20px", 
              borderRadius: 16, 
              border: "none", 
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)", 
              color: "#fff", 
              fontSize: 17, 
              fontWeight: 700, 
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              boxShadow: "0 4px 15px rgba(99, 102, 241, 0.3)"
            }}
          >
            <span style={{ fontSize: 24 }}>📖</span>
            <div style={{ textAlign: "left" }}>
              <div>Kelime Çalış</div>
              <div style={{ fontSize: 12, fontWeight: 400, opacity: 0.8 }}>
                Kelime tekrarı ve öğrenme
              </div>
            </div>
            <span style={{ fontSize: 20, marginLeft: "auto" }}>→</span>
          </button>

          <button 
            onClick={() => setMode("sentence")}
            style={{ 
              padding: "20px", 
              borderRadius: 16, 
              border: "none", 
              background: "linear-gradient(135deg, #3b82f6, #6366f1)", 
              color: "#fff", 
              fontSize: 17, 
              fontWeight: 700, 
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              boxShadow: "0 4px 15px rgba(59, 130, 246, 0.3)"
            }}
          >
            <span style={{ fontSize: 24 }}>📝</span>
            <div style={{ textAlign: "left" }}>
              <div>Cümle Çalış</div>
              <div style={{ fontSize: 12, fontWeight: 400, opacity: 0.8 }}>
                Cümle tekrarı ve öğrenme
              </div>
            </div>
            <span style={{ fontSize: 20, marginLeft: "auto" }}>→</span>
          </button>

          <button 
            onClick={onBack}
            style={{ 
              padding: "12px", 
              borderRadius: 12, 
              border: "1px solid #1e293b", 
              background: "transparent", 
              color: "#64748b", 
              fontSize: 14, 
              fontWeight: 500, 
              cursor: "pointer",
              marginTop: 8,
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              e.target.style.color = "#e2e8f0";
              e.target.style.borderColor = "#6366f1";
            }}
            onMouseLeave={(e) => {
              e.target.style.color = "#64748b";
              e.target.style.borderColor = "#1e293b";
            }}
          >
            ← Geri Dön
          </button>
        </div>

        <div style={{ 
          marginTop: 40, 
          fontSize: 12, 
          color: "#475569",
          textAlign: "center",
          maxWidth: 300
        }}>
          💡 Kelime ve cümle tekrarları spaced repetition yöntemi ile yapılır.
        </div>
      </div>
    );
  }

  // Kelime Quiz
  if (mode === "word") {
    return (
      <WordQuiz 
        userLevel={userLevel} 
        onChangeLevel={() => {
          setMode(null);
          onChangeLevel();
        }} 
      />
    );
  }

  // Cümle Quiz (benzer şekilde düzenlenecek)
  if (mode === "sentence") {
    return (
      <SentenceQuiz 
        userLevel={userLevel} 
        onChangeLevel={() => {
          setMode(null);
          onChangeLevel();
        }} 
      />
    );
  }

  return null;
}