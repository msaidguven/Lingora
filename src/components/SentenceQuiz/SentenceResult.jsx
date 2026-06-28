import SpeakerIcon from "../common/SpeakerIcon.jsx";

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
  // Sadece tema renkleri
  const colors = {
    bg: isCorrect 
      ? (isDarkMode ? "#0e2d1f" : "#ecfdf5") 
      : (isDarkMode ? "#2d0e0e" : "#fef2f2"),
    textSecondary: isDarkMode ? "#64748b" : "#475569",
    tagBg: isDarkMode ? "#6366f122" : "#6366f115",
    tagText: isDarkMode ? "#818cf8" : "#6366f1",
    buttonBg: isDarkMode ? "#1e293b" : "#f1f5f9",
    buttonHover: isDarkMode ? "#2d3a4f" : "#e2e8f0"
  };

  return (
    <div style={{ 
      marginTop: 14, 
      padding: "14px 16px", 
      borderRadius: 14, 
      background: colors.bg, 
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
          <div style={{ fontSize: 11, color: colors.textSecondary }}>
            Kelime: <span style={{ color: "#6366f1", fontWeight: 600 }}>{currentWord.word}</span> — {currentWord.meaning}
          </div>
          {currentWord.part_of_speech && currentWord.part_of_speech.length > 0 && (
            <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
              {currentWord.part_of_speech.map(p => (
                <span key={p} style={{ 
                  fontSize: 9, 
                  color: colors.tagText, 
                  background: colors.tagBg, 
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
            color: colors.textSecondary, 
            cursor: "pointer", 
            fontSize: 11, 
            display: "inline-flex", 
            alignItems: "center", 
            gap: 4, 
            padding: "4px 8px",
            borderRadius: 6,
            background: colors.buttonBg,
            marginBottom: 12
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
          cursor: isSaving ? "not-allowed" : "pointer" 
        }}
      >
        {isSaving ? "Kaydediliyor..." : isLastQuestion ? "🏁 Bitir" : "Sonraki →"}
      </button>
    </div>
  );
}