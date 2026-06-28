// components/common/OptionButton.jsx
export default function OptionButton({ 
  index, 
  label, 
  isAnswered, 
  isCorrect, 
  isSelected, 
  onClick, 
  disabled,
  isDark // Prop olarak ekle
}) {
  // Tema bazlı renkler
  const getColors = () => {
    if (!isAnswered) {
      return {
        bg: isDark ? "#1a1a2e" : "#ffffff",
        border: isDark ? "#1e293b" : "#e2e8f0",
        color: isDark ? "#e2e8f0" : "#1e293b",
        letterBg: isDark ? "#1e293b" : "#f1f5f9",
        letterColor: isDark ? "#475569" : "#94a3b8"
      };
    }
    
    if (isCorrect) {
      return {
        bg: isDark ? "#0e2d1f" : "#f0fdf4",
        border: "#10b981",
        color: "#10b981",
        letterBg: "#10b981",
        letterColor: "#ffffff"
      };
    }
    
    if (isSelected && !isCorrect) {
      return {
        bg: isDark ? "#2d0e0e" : "#fef2f2",
        border: "#ef4444",
        color: "#ef4444",
        letterBg: "#ef4444",
        letterColor: "#ffffff"
      };
    }
    
    return {
      bg: isDark ? "transparent" : "#f8fafc",
      border: isDark ? "#1e293b" : "#e2e8f0",
      color: isDark ? "#2d3748" : "#94a3b8",
      letterBg: isDark ? "#1e293b" : "#f1f5f9",
      letterColor: isDark ? "#475569" : "#94a3b8"
    };
  };

  const colors = getColors();

  return (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      style={{ 
        padding: "13px 14px", 
        borderRadius: 13, 
        border: `1.5px solid ${colors.border}`, 
        background: colors.bg, 
        color: colors.color, 
        cursor: disabled ? "default" : "pointer", 
        fontWeight: 600, 
        fontSize: 14, 
        textAlign: "left", 
        transition: "all 0.18s", 
        display: "flex", 
        alignItems: "center", 
        gap: 10,
        opacity: disabled ? 0.6 : 1
      }}
    >
      <span style={{ 
        width: 26, 
        height: 26, 
        borderRadius: 7, 
        flexShrink: 0, 
        background: isAnswered && isCorrect ? "#10b981" : isAnswered && isSelected && !isCorrect ? "#ef4444" : colors.letterBg, 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        fontSize: 11, 
        fontWeight: 700, 
        color: isAnswered && (isCorrect || (isSelected && !isCorrect)) ? "#fff" : colors.letterColor 
      }}>
        {isAnswered && isCorrect ? "✓" : isAnswered && isSelected && !isCorrect ? "✗" : String.fromCharCode(65 + index)}
      </span>
      {label}
    </button>
  );
}