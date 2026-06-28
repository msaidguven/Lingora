import SpeakerIcon from "../common/SpeakerIcon.jsx";

const THEMES = {
  dark: {
    resultBg: "#1a1a2e",
    resultBorder: "#1e293b",
    textPrimary: "#e2e8f0",
    textSecondary: "#64748b",
    textMuted: "#475569",
    correctBg: "#10b98120",
    wrongBg: "#ef444420",
    buttonBg: "#1e293b",
    buttonHover: "#2d3a4f",
    tagBg: "#6366f122",
    tagText: "#818cf8",
  },
  light: {
    resultBg: "#ffffff",
    resultBorder: "#e2e8f0",
    textPrimary: "#0f172a",
    textSecondary: "#475569",
    textMuted: "#94a3b8",
    correctBg: "#10b98115",
    wrongBg: "#ef444415",
    buttonBg: "#f1f5f9",
    buttonHover: "#e2e8f0",
    tagBg: "#6366f115",
    tagText: "#6366f1",
  }
};

export default function SentenceResult({ 
  isCorrect, 
  correctAnswer, 
  selectedAnswer, 
  currentWord, 
  onNext, 
  onSpeak, 
  isSaving, 
  isLastQuestion,
  isDarkMode = true
}) {
  const theme = THEMES[isDarkMode ? 'dark' : 'light'];

  return (
    <div style={{ 
      marginTop: 14, 
      padding: "14px 16px", 
      borderRadius: 14, 
      background: isCorrect ? (isDarkMode ? "#0e2d1f" : "#ecfdf5") : (isDarkMode ? "#2d0e0e" : "#fef2f2"),
      border: `1px solid ${isCorrect ? "#10b981" : "#ef4444"}` 
    }}>
      <div style={{ 
        fontWeight: 700, 
        fontSize: 13, 
        color: isCorrect ? "#10b981" : "#ef4444", 
        marginBottom: 8 
      }}>
        {isCorrect ? "✓ Doğru!" : `✗ Doğru cevap: "${correctAnswer}"`}
      </div>

      {currentWord && (
        <div style={{ marginTop: 8, marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: theme.textSecondary }}>
            Kelime: <span style={{ color: "#6366f1", fontWeight: 600 }}>{currentWord.word}</span> — {currentWord.meaning}
          </div>
          {currentWord.part_of_speech && currentWord.part_of_speech.length > 0 && (
            <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
              {currentWord.part_of_speech.map(p => (
                <span key={p} style={{ 
                  fontSize: 9, 
                  color: theme.tagText, 
                  background: theme.tagBg, 
                  padding: "1px 8px", 
                  borderRadius: 4, 
                  fontWeight: 600 
                }}>
                  {p}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {currentWord && (
        <button 
          onClick={() => onSpeak(currentWord.word)} 
          style={{ 
            border: "none", 
            color: theme.textSecondary, 
            cursor: "pointer", 
            fontSize: 11, 
            display: "inline-flex", 
            alignItems: "center", 
            gap: 4, 
            padding: "4px 8px",
            borderRadius: 6,
            background: theme.buttonBg,
            marginBottom: 12,
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => {
            e.target.style.background = theme.buttonHover;
          }}
          onMouseLeave={(e) => {
            e.target.style.background = theme.buttonBg;
          }}
        >
          <SpeakerIcon /> {currentWord.word} telaffuzunu dinle
        </button>
      )}
      
      <button 
        onClick={onNext} 
        disabled={isSaving} 
        style={{ 
          width: "100%", 
          padding: 12, 
          borderRadius: 12, 
          border: "none", 
          background: isSaving ? "#475569" : "#6366f1", 
          color: "#fff", 
          fontWeight: 600, 
          fontSize: 14, 
          cursor: isSaving ? "not-allowed" : "pointer",
          transition: "all 0.2s"
        }}
        onMouseEnter={(e) => {
          if (!isSaving) {
            e.target.style.background = "#4f46e5";
          }
        }}
        onMouseLeave={(e) => {
          if (!isSaving) {
            e.target.style.background = "#6366f1";
          }
        }}
      >
        {isSaving ? "Kaydediliyor..." : isLastQuestion ? "🏁 Bitir" : "Sonraki →"}
      </button>
    </div>
  );
}