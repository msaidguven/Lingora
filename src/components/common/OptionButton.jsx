// src/components/common/OptionButton.jsx
export default function OptionButton({
  index,
  label,
  isAnswered,
  isCorrect,
  isSelected,
  onClick,
  disabled,
  isDarkMode = true,
}) {
  // Tema renkleri
  const getStyles = () => {
    // Normal durum
    if (!isAnswered) {
      return {
        bg: isDarkMode ? 'bg-[#1e293b]' : 'bg-white',
        border: isDarkMode ? 'border-[#334155]' : 'border-[#e2e8f0]',
        text: isDarkMode ? 'text-[#e2e8f0]' : 'text-[#0f172a]',
        hover: isDarkMode ? 'hover:bg-[#2d3a4f] hover:border-[#475569]' : 'hover:bg-[#f1f5f9] hover:border-[#cbd5e1]',
        shadow: isDarkMode ? 'hover:shadow-lg hover:shadow-black/20' : 'hover:shadow-md hover:shadow-black/5',
      };
    }

    // Cevaplanmış durum
    if (isCorrect && isSelected) {
      return {
        bg: 'bg-success/20',
        border: 'border-success',
        text: 'text-success',
        hover: '',
        shadow: 'shadow-lg shadow-success/20',
      };
    }

    if (isSelected && !isCorrect) {
      return {
        bg: 'bg-error/20',
        border: 'border-error',
        text: 'text-error',
        hover: '',
        shadow: 'shadow-lg shadow-error/20',
      };
    }

    if (isCorrect) {
      return {
        bg: isDarkMode ? 'bg-[#1a2e2a]' : 'bg-success/10',
        border: isDarkMode ? 'border-success/40' : 'border-success/30',
        text: isDarkMode ? 'text-success' : 'text-success',
        hover: '',
        shadow: '',
      };
    }

    // Yanlış ve seçilmemiş
    return {
      bg: isDarkMode ? 'bg-[#1a1a2e]' : 'bg-[#f8fafc]',
      border: isDarkMode ? 'border-[#1e293b]' : 'border-[#e2e8f0]',
      text: isDarkMode ? 'text-[#475569]' : 'text-[#94a3b8]',
      hover: '',
      shadow: '',
    };
  };

  const styles = getStyles();

  // Harf etiketi (A, B, C, D)
  const letters = ['A', 'B', 'C', 'D'];
  const letter = letters[index] || '';

  // Doğru/yanlış ikonu
  const getIcon = () => {
    if (!isAnswered) return null;
    if (isCorrect && isSelected) return '✓';
    if (isSelected && !isCorrect) return '✗';
    return null;
  };

  const icon = getIcon();

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-200 font-medium text-sm
        ${styles.bg} ${styles.border} ${styles.text} ${styles.hover} ${styles.shadow}
        ${disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}
        ${!isAnswered && 'hover:scale-[1.01]'}
        flex items-center gap-3
      `}
    >
      {/* Harf etiketi */}
      <span className={`
        w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
        ${!isAnswered 
          ? isDarkMode 
            ? 'bg-[#1e293b] text-[#64748b]' 
            : 'bg-[#f1f5f9] text-[#475569]'
          : isCorrect && isSelected
            ? 'bg-success text-white'
            : isSelected && !isCorrect
              ? 'bg-error text-white'
              : isCorrect
                ? isDarkMode
                  ? 'bg-success/20 text-success'
                  : 'bg-success/10 text-success'
                : isDarkMode
                  ? 'bg-[#1e293b] text-[#475569]'
                  : 'bg-[#f1f5f9] text-[#94a3b8]'
        }
      `}>
        {icon || letter}
      </span>

      {/* Label */}
      <span className="flex-1">{label}</span>

      {/* Durum göstergesi - sadece cevaplanmışsa */}
      {isAnswered && (
        <span className="text-xs font-bold">
          {isCorrect && isSelected && '✅'}
          {isSelected && !isCorrect && '❌'}
          {isCorrect && !isSelected && '✓'}
        </span>
      )}
    </button>
  );
}