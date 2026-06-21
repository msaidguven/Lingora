import SpeakerIcon from "../common/SpeakerIcon.jsx";

export default function WordResult({ 
  isCorrect, 
  correctAnswer, 
  selectedAnswer, 
  cardExamples, 
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

      {cardExamples && cardExamples.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>Örnek cümleler:</div>
          {cardExamples.slice(0, 2).map((ex, idx) => (
            <div key={idx} style={{ 
              marginBottom: idx < 1 ? 10 : 0,
              padding: "8px 10px",
              background: "#0f0f1a",
              borderRadius: 8,
              marginTop: idx > 0 ? 6 : 0
            }}>
              <div style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic", lineHeight: 1.4 }}>"{ex.sentence_en}"</div>
              {ex.sentence_tr && <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>"{ex.sentence_tr}"</div>}
              <button 
                onClick={() => onSpeak(ex.sentence_en)} 
                style={{ 
                  marginTop: 4, 
                  background: "none", 
                  border: "none", 
                  color: "#64748b", 
                  cursor: "pointer", 
                  fontSize: 10, 
                  display: "inline-flex", 
                  alignItems: "center", 
                  gap: 3, 
                  padding: 0 
                }}
              >
                <SpeakerIcon /> Cümleyi dinle
              </button>
            </div>
          ))}
        </div>
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