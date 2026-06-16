export default function OptionButton({ index, label, isAnswered, isCorrect, isSelected, onClick, disabled }) {
  let bg = "#1a1a2e", border = "#1e293b", color = "#e2e8f0";
  
  if (isAnswered) {
    if (isCorrect) { 
      bg = "#0e2d1f"; 
      border = "#10b981"; 
      color = "#10b981"; 
    } else if (isSelected) { 
      bg = "#2d0e0e"; 
      border = "#ef4444"; 
      color = "#ef4444"; 
    } else { 
      color = "#2d3748"; 
    }
  }

  return (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      style={{ 
        padding: "13px 14px", 
        borderRadius: 13, 
        border: `1.5px solid ${border}`, 
        background: bg, 
        color, 
        cursor: disabled ? "default" : "pointer", 
        fontWeight: 600, 
        fontSize: 14, 
        textAlign: "left", 
        transition: "all 0.18s", 
        display: "flex", 
        alignItems: "center", 
        gap: 10 
      }}
    >
      <span style={{ 
        width: 26, 
        height: 26, 
        borderRadius: 7, 
        flexShrink: 0, 
        background: isAnswered && isCorrect ? "#10b981" : isAnswered && isSelected ? "#ef4444" : "#1e293b", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        fontSize: 11, 
        fontWeight: 700, 
        color: isAnswered && (isCorrect || isSelected) ? "#fff" : "#475569" 
      }}>
        {isAnswered && isCorrect ? "✓" : isAnswered && isSelected && !isCorrect ? "✗" : String.fromCharCode(65 + index)}
      </span>
      {label}
    </button>
  );
}