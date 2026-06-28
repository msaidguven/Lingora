// components/common/OptionButton.jsx
export default function OptionButton({ 
  index, 
  label, 
  isAnswered, 
  isCorrect, 
  isSelected, 
  onClick, 
  disabled,
  isDark 
}) {
  // Harf etiketi
  const letters = ['A', 'B', 'C', 'D'];
  const letter = letters[index] || '';

  // Tema class'ları
  const getClasses = () => {
    // Normal durum - cevaplanmamış
    if (!isAnswered) {
      return {
        container: `w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-200 font-medium text-sm
          ${isDark 
            ? 'bg-[#1a1a2e] border-[#1e293b] text-[#e2e8f0] hover:bg-[#2a2a3e] hover:border-[#334155]' 
            : 'bg-white border-[#e2e8f0] text-[#1e293b] hover:bg-[#f8fafc] hover:border-[#cbd5e1]'
          }
          ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:scale-[1.01]'}
        `,
        letter: `w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0
          ${isDark 
            ? 'bg-[#1e293b] text-[#475569]' 
            : 'bg-[#f1f5f9] text-[#94a3b8]'
          }
        `,
        icon: null
      };
    }

    // Doğru cevap - seçili
    if (isCorrect && isSelected) {
      return {
        container: `w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all duration-200 font-medium text-sm
          bg-success/20 border-success text-success shadow-lg shadow-success/20
          ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
        `,
        letter: `w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0
          bg-success text-white
        `,
        icon: '✓'
      };
    }

    // Yanlış cevap - seçili
    if (isSelected && !isCorrect) {
      return {
        container: `w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all duration-200 font-medium text-sm
          bg-error/20 border-error text-error shadow-lg shadow-error/20
          ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
        `,
        letter: `w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0
          bg-error text-white
        `,
        icon: '✗'
      };
    }

    // Doğru cevap - seçili değil (gösterim amaçlı)
    if (isCorrect && !isSelected) {
      return {
        container: `w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-200 font-medium text-sm
          ${isDark 
            ? 'bg-[#0e2d1f] border-success/40 text-success' 
            : 'bg-success/10 border-success/30 text-success'
          }
          ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
        `,
        letter: `w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0
          ${isDark 
            ? 'bg-success/20 text-success' 
            : 'bg-success/10 text-success'
          }
        `,
        icon: '✓'
      };
    }

    // Yanlış cevap - seçili değil (gösterim amaçlı)
    return {
      container: `w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-200 font-medium text-sm
        ${isDark 
          ? 'bg-[#1a1a2e] border-[#1e293b] text-[#475569]' 
          : 'bg-[#f8fafc] border-[#e2e8f0] text-[#94a3b8]'
        }
        ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
      `,
      letter: `w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0
        ${isDark 
          ? 'bg-[#1e293b] text-[#475569]' 
          : 'bg-[#f1f5f9] text-[#94a3b8]'
        }
      `,
      icon: null
    };
  };

  const styles = getClasses();

  return (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={styles.container}
    >
      <span className={styles.letter}>
        {styles.icon || letter}
      </span>
      <span className="flex-1">{label}</span>
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