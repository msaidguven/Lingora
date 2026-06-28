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

  if (!isAnswered) {
    return (
      <button 
        onClick={onClick} 
        disabled={disabled} 
        className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-200 font-medium text-sm
          ${isDark 
            ? 'border-base-700 bg-base-800 text-base-100 hover:bg-base-700 hover:border-base-600' 
            : 'border-base-300 bg-base-100 text-base-content hover:bg-base-200 hover:border-base-400'
          }
          ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:scale-[1.01]'}
        `}
      >
        <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0
          ${isDark 
            ? 'bg-base-700 text-base-400' 
            : 'bg-base-200 text-base-500'
          }
        `}>
          {letter}
        </span>
        <span className="flex-1">{label}</span>
      </button>
    );
  }

  if (isCorrect && isSelected) {
    return (
      <button className="w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all duration-200 font-medium text-sm bg-success/20 border-success text-success shadow-lg shadow-success/20 cursor-pointer">
        <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 bg-success text-success-content">✓</span>
        <span className="flex-1">{label}</span>
        <span className="text-xs font-bold">✅</span>
      </button>
    );
  }

  if (isSelected && !isCorrect) {
    return (
      <button className="w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all duration-200 font-medium text-sm bg-error/20 border-error text-error shadow-lg shadow-error/20 cursor-pointer">
        <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 bg-error text-error-content">✗</span>
        <span className="flex-1">{label}</span>
        <span className="text-xs font-bold">❌</span>
      </button>
    );
  }

  if (isCorrect && !isSelected) {
    return (
      <button className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-200 font-medium text-sm
        ${isDark 
          ? 'bg-success/10 border-success/30 text-success' 
          : 'bg-success/5 border-success/30 text-success'
        } cursor-pointer opacity-70`}
      >
        <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0
          ${isDark ? 'bg-success/20 text-success' : 'bg-success/10 text-success'}`}>
          ✓
        </span>
        <span className="flex-1">{label}</span>
        <span className="text-xs font-bold">✓</span>
      </button>
    );
  }

  return (
    <button className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-200 font-medium text-sm
      ${isDark 
        ? 'bg-base-800 border-base-700 text-base-500' 
        : 'bg-base-100 border-base-300 text-base-400'
      } cursor-pointer opacity-50`}
    >
      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0
        ${isDark ? 'bg-base-700 text-base-500' : 'bg-base-200 text-base-400'}`}>
        {letter}
      </span>
      <span className="flex-1">{label}</span>
    </button>
  );
}