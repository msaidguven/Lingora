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
  const letters = ['A', 'B', 'C', 'D'];
  const letter = letters[index] || '';

  // Normal durum - cevaplanmamış
  if (!isAnswered) {
    return (
      <button 
        onClick={onClick} 
        disabled={disabled} 
        className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-200 font-medium text-sm
          ${isDark 
            ? 'bg-[#1e293b] border-[#334155] text-[#e2e8f0] hover:bg-[#2d3a4f] hover:border-[#475569]' 
            : 'bg-white border-[#e2e8f0] text-[#0f172a] hover:bg-[#f8fafc] hover:border-[#cbd5e1]'
          }
          ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:scale-[1.01]'}
        `}
      >
        <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0
          ${isDark 
            ? 'bg-[#334155] text-[#94a3b8]' 
            : 'bg-[#f1f5f9] text-[#64748b]'
          }
        `}>
          {letter}
        </span>
        <span className="flex-1">{label}</span>
      </button>
    );
  }

  // Doğru cevap - seçili
  if (isCorrect && isSelected) {
    return (
      <button 
        onClick={onClick} 
        disabled={disabled} 
        className="w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all duration-200 font-medium text-sm
          bg-success/20 border-success text-success shadow-lg shadow-success/20
          cursor-pointer"
      >
        <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0
          bg-success text-white
        ">
          ✓
        </span>
        <span className="flex-1">{label}</span>
        <span className="text-xs font-bold">✅</span>
      </button>
    );
  }

  // Yanlış cevap - seçili
  if (isSelected && !isCorrect) {
    return (
      <button 
        onClick={onClick} 
        disabled={disabled} 
        className="w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all duration-200 font-medium text-sm
          bg-error/20 border-error text-error shadow-lg shadow-error/20
          cursor-pointer"
      >
        <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0
          bg-error text-white
        ">
          ✗
        </span>
        <span className="flex-1">{label}</span>
        <span className="text-xs font-bold">❌</span>
      </button>
    );
  }

  // Doğru cevap - seçili değil
  if (isCorrect && !isSelected) {
    return (
      <button 
        onClick={onClick} 
        disabled={disabled} 
        className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-200 font-medium text-sm
          ${isDark 
            ? 'bg-[#0a1f1a] border-success/30 text-success' 
            : 'bg-success/5 border-success/30 text-success'
          }
          cursor-pointer opacity-70
        `}
      >
        <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0
          ${isDark 
            ? 'bg-success/20 text-success' 
            : 'bg-success/10 text-success'
          }
        `}>
          ✓
        </span>
        <span className="flex-1">{label}</span>
        <span className="text-xs font-bold">✓</span>
      </button>
    );
  }

  // Yanlış cevap - seçili değil (pasif)
  return (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-200 font-medium text-sm
        ${isDark 
          ? 'bg-[#1a1a2e] border-[#1e293b] text-[#475569]' 
          : 'bg-[#f8fafc] border-[#e2e8f0] text-[#94a3b8]'
        }
        cursor-pointer opacity-50
      `}
    >
      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0
        ${isDark 
          ? 'bg-[#1e293b] text-[#475569]' 
          : 'bg-[#f1f5f9] text-[#94a3b8]'
        }
      `}>
        {letter}
      </span>
      <span className="flex-1">{label}</span>
    </button>
  );
}