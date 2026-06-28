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
    shadow: "0 4px 16px rgba(0,0,0,0.2)",
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
    shadow: "0 4px 16px rgba(0,0,0,0.06)",
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
  isDarkMode = true,
  levelColor = "#6366f1"
}) {
  const theme = THEMES[isDarkMode ? 'dark' : 'light'];

  return (
    <div style={{ 
      marginTop: 16,
      padding: "18px 20px", 
      borderRadius: 14,
      background: theme.resultBg,
      border: `1px solid ${isCorrect ? '#10b981' : '#ef4444'}`,
      boxShadow: theme.shadow,
      animation: "slideUp 0.3s ease"
    }}>
      <style>
        {`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(12px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>

      {/* Sonuç Başlığı */}
      <div style={{ 
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 12
      }}>
        <span style={{ 
          fontSize: 22,
          color: isCorrect ? "#10b981" : "#ef4444"
        }}>
          {isCorrect ? "✅" : "❌"}
        </span>
        <div style={{ 
          fontWeight: 700, 
          fontSize: 15, 
          color: isCorrect ? "#10b981" : "#ef4444"
        }}>
          {isCorrect ? "Doğru!" : "Yanlış!"}
        </div>
      </div>

      {/* Doğru Cevap (yanlışsa) */}
      {!isCorrect && (
        <div style={{
          background: theme.wrongBg,
          border: `1px solid ${isDarkMode ? '#ef444440' : '#ef444430'}`,
          borderRadius: 8,
          padding: "12px 14px",
          marginBottom: 12
        }}>
          <div style={{
            fontSize: 11,
            color: theme.textSecondary,
            marginBottom: 4,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: 0.5
          }}>
            Doğru Cevap
          </div>
          <div style={{
            fontSize: 17,
            fontWeight: 700,
            color: "#10b981"
          }}>
            {correctAnswer}
          </div>
          {selectedAnswer && selectedAnswer !== correctAnswer && (
            <>
              <div style={{
                fontSize: 11,
                color: theme.textSecondary,
                marginTop: 8,
                marginBottom: 4,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 0.5
              }}>
                Senin Cevabın
              </div>
              <div style={{
                fontSize: 17,
                fontWeight: 700,
                color: "#ef4444"
              }}>
                {selectedAnswer}
              </div>
            </>
          )}
        </div>
      )}

      {/* Doğru Cevap (doğruysa) */}
      {isCorrect && selectedAnswer && (
        <div style={{
          background: theme.correctBg,
          border: `1px solid ${isDarkMode ? '#10b98140' : '#10b98130'}`,
          borderRadius: 8,
          padding: "12px 14px",
          marginBottom: 12
        }}>
          <div style={{
            fontSize: 11,
            color: theme.textSecondary,
            marginBottom: 4,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: 0.5
          }}>
            Cevabın
          </div>
          <div style={{
            fontSize: 17,
            fontWeight: 700,
            color: "#10b981"
          }}>
            {selectedAnswer}
          </div>
        </div>
      )}

      {/* Kelime Bilgisi */}
      {currentWord && (
        <div style={{ 
          background: isDarkMode ? "#1e293b" : "#f8fafc",
          borderRadius: 8,
          padding: "12px 14px",
          marginBottom: 12,
          border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`
        }}>
          <div style={{
            fontSize: 11,
            color: theme.textSecondary,
            marginBottom: 4,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: 0.5
          }}>
            Kelime
          </div>
          <div style={{
            fontSize: 18,
            fontWeight: 700,
            color: levelColor
          }}>
            {currentWord.word}
          </div>
          <div style={{
            fontSize: 14,
            color: theme.textSecondary,
            marginTop: 2
          }}>
            {currentWord.meaning}
          </div>
          {currentWord.part_of_speech && currentWord.part_of_speech.length > 0 && (
            <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
              {currentWord.part_of_speech.map(p => (
                <span key={p} style={{ 
                  fontSize: 10, 
                  color: theme.tagText,
                  background: theme.tagBg,
                  padding: "2px 10px", 
                  borderRadius: 4, 
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: 0.3
                }}>
                  {p}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Telaffuz Butonu */}
      {currentWord && (
        <button 
          onClick={() => onSpeak(currentWord.word)} 
          style={{ 
            border: "none",
            background: theme.buttonBg,
            color: theme.textSecondary,
            cursor: "pointer", 
            fontSize: 12,
            fontWeight: 600,
            display: "inline-flex", 
            alignItems: "center", 
            gap: 6,
            padding: "6px 14px",
            borderRadius: 8,
            marginBottom: 14,
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => {
            e.target.style.background = theme.buttonHover;
          }}
          onMouseLeave={(e) => {
            e.target.style.background = theme.buttonBg;
          }}
        >
          <SpeakerIcon size={16} /> Telaffuzu Dinle
        </button>
      )}
      
      {/* Devam Butonu */}
      <button 
        onClick={onNext} 
        disabled={isSaving} 
        style={{ 
          width: "100%", 
          padding: "13px",
          borderRadius: 12,
          border: "none",
          background: isSaving ? theme.textMuted : levelColor,
          color: "#fff",
          fontWeight: 700,
          fontSize: 15,
          cursor: isSaving ? "not-allowed" : "pointer",
          transition: "all 0.2s",
          opacity: isSaving ? 0.6 : 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8
        }}
        onMouseEnter={(e) => {
          if (!isSaving) {
            e.target.style.background = `${levelColor}dd`;
            e.target.style.transform = "scale(1.01)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isSaving) {
            e.target.style.background = levelColor;
            e.target.style.transform = "scale(1)";
          }
        }}
      >
        {isSaving ? (
          "⏳ Kaydediliyor..."
        ) : isLastQuestion ? (
          "🏁 Sonuçları Gör"
        ) : (
          "▶️ Devam Et"
        )}
      </button>
    </div>
  );
}