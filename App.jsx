import { useState } from "react";
import QuizScreen from "./QuizScreen.jsx";
import HomeScreen from "./HomeScreen.jsx";

const LEVELS = ["A1", "A2", "B1", "B2"];
const LEVEL_COLOR = { A1: "#10b981", A2: "#3b82f6", B1: "#8b5cf6", B2: "#f59e0b" };
const LEVEL_DESC = {
  A1: "Hiç bilmiyorum, sıfırdan başlıyorum",
  A2: "Temel kelimeler biliyorum",
  B1: "Günlük konuşmayı anlıyorum",
  B2: "Akıcı konuşabiliyorum",
};

function WelcomeScreen({ onSelect }) {
  const [selected, setSelected] = useState(null);
  return (
    <div style={{ minHeight: "100vh", background: "#0f0f1a", color: "#e2e8f0", fontFamily: "'Inter', system-ui, sans-serif", maxWidth: 420, margin: "0 auto", display: "flex", flexDirection: "column", justifyContent: "center", padding: "32px 24px" }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
        <div style={{ fontSize: 11, letterSpacing: 4, color: "#6366f1", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>WordFlow</div>
        <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.2, marginBottom: 8 }}>İngilizce Öğren</div>
        <div style={{ fontSize: 14, color: "#64748b" }}>Seviyeni seç, hemen başla.</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
        {LEVELS.map(lvl => {
          const isSelected = selected === lvl;
          const color = LEVEL_COLOR[lvl];
          return (
            <button key={lvl} onClick={() => setSelected(lvl)} style={{ padding: "16px 18px", borderRadius: 14, cursor: "pointer", textAlign: "left", border: `2px solid ${isSelected ? color : "#1e293b"}`, background: isSelected ? color + "18" : "#1a1a2e", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: isSelected ? color : "#1e293b", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: isSelected ? "#fff" : color, flexShrink: 0 }}>{lvl}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: isSelected ? "#e2e8f0" : "#94a3b8" }}>{lvl} Seviyesi</div>
                <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>{LEVEL_DESC[lvl]}</div>
              </div>
              {isSelected && <div style={{ marginLeft: "auto", color, fontSize: 18 }}>✓</div>}
            </button>
          );
        })}
      </div>
      <button onClick={() => selected && onSelect(selected)} disabled={!selected} style={{ padding: "16px", borderRadius: 14, border: "none", cursor: selected ? "pointer" : "not-allowed", background: selected ? "#6366f1" : "#1e1e30", color: selected ? "#fff" : "#475569", fontWeight: 700, fontSize: 16, transition: "all 0.2s" }}>
        {selected ? `${selected} Seviyesiyle Başla →` : "Seviye Seç"}
      </button>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("home");
  const [userLevel, setUserLevel] = useState(null);

  // Ana sayfadan quiz'e geçiş
  const handleStartQuiz = () => {
    setScreen("welcome");
  };

  // Seviye seçiminden sonra quiz'e geç
  const handleLevelSelect = (level) => {
    setUserLevel(level);
    setScreen("quiz");
  };

  // Quiz'den ana sayfaya dönüş
  const handleBackToHome = () => {
    setScreen("home");
    setUserLevel(null);
  };

  // Ana sayfa
  if (screen === "home") {
    return <HomeScreen onStartQuiz={handleStartQuiz} />;
  }

  // Seviye seçim ekranı
  if (screen === "welcome") {
    return <WelcomeScreen onSelect={handleLevelSelect} />;
  }

  // Quiz ekranı
  return <QuizScreen userLevel={userLevel} onChangeLevel={handleBackToHome} />;
}