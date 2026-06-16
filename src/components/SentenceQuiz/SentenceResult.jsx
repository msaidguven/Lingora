import SpeakerIcon from "../common/SpeakerIcon.jsx";

export default function SentenceResult({ 
  isCorrect, 
  correctAnswer, 
  selectedAnswer, 
  currentWord, 
  onNext, 
  onSpeak, 
  isSaving, 
  isLastQuestion 
}) {
  return (
    <div style={{ 
      marginTop: 14, 
      padding: "14px 16px", 
      borderRadius: 14, 
      background: isCorrect ? "#0e2d1f" : "#2d0e0e", 
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
          <div style={{ fontSize: 11, color: "#64748b" }}>
            Kelime: <span style={{ color: "#6366f1", fontWeight: 600 }}>{currentWord.word}</span> — {currentWord.meaning}
          </div>
          {currentWord.part_of_speech && currentWord.part_of_speech.length > 0 && (
            <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
              {currentWord.part_of_speech.map(p => (
                <span key={p} style={{ 
                  fontSize: 9, 
                  color: "#6366f1", 
                  background: "#6366f122", 
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
            background: "none", 
            border: "none", 
            color: "#64748b", 
            cursor: "pointer", 
            fontSize: 11, 
            display: "inline-flex", 
            alignItems: "center", 
            gap: 4, 
            padding: "4px 8px",
            borderRadius: 6,
            background: "#1e293b",
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