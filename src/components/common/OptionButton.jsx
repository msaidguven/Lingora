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
        className={`w-full text-left px-5 py-4 rounded-2xl border-2 transition-all duration-300 font-medium text-[15px] shadow-sm
          ${isDark 
            ? 'border-base-700 bg-base-800 text-white hover:bg-base-700 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10' 
            : 'border-base-200 bg-white text-gray-800 hover:bg-base-100 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10'
          }
          ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:-translate-y-0.5'}
        `}
      >
        <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all duration-200
          ${isDark 
            ? 'bg-base-700 text-gray-300' 
            : 'bg-base-100 text-gray-500'
          }
        `}>
          {letter}
        </span>
        <span className="flex-1 ml-3">{label}</span>
      </button>
    );
  }

  if (isCorrect && isSelected) {
    return (
      <button className="w-full text-left px-5 py-4 rounded-2xl border-2 transition-all duration-300 font-medium text-[15px] bg-success/15 border-success text-success shadow-lg shadow-success/20 cursor-pointer hover:scale-[1.01]">
        <span className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 bg-success text-white shadow-sm shadow-success/30">✓</span>
        <span className="flex-1 ml-3">{label}</span>
        <span className="text-sm font-bold">✅</span>
      </button>
    );
  }

  if (isSelected && !isCorrect) {
    return (
      <button className="w-full text-left px-5 py-4 rounded-2xl border-2 transition-all duration-300 font-medium text-[15px] bg-error/15 border-error text-error shadow-lg shadow-error/20 cursor-pointer hover:scale-[1.01]">
        <span className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 bg-error text-white shadow-sm shadow-error/30">✗</span>
        <span className="flex-1 ml-3">{label}</span>
        <span className="text-sm font-bold">❌</span>
      </button>
    );
  }

  if (isCorrect && !isSelected) {
    return (
      <button className={`w-full text-left px-5 py-4 rounded-2xl border-2 transition-all duration-300 font-medium text-[15px]
        ${isDark 
          ? 'bg-success/10 border-success/30 text-success hover:bg-success/20' 
          : 'bg-success/5 border-success/20 text-success hover:bg-success/10'
        } cursor-pointer opacity-70 hover:opacity-100`}
      >
        <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0
          ${isDark ? 'bg-success/20 text-success' : 'bg-success/10 text-success'}`}>
          ✓
        </span>
        <span className="flex-1 ml-3">{label}</span>
        <span className="text-sm font-bold text-success/40">✓</span>
      </button>
    );
  }

  return (
    <button className={`w-full text-left px-5 py-4 rounded-2xl border-2 transition-all duration-300 font-medium text-[15px]
      ${isDark 
        ? 'border-base-700/30 bg-base-800/30 text-gray-400' 
        : 'border-base-200/50 bg-base-50/50 text-gray-300'
      } cursor-not-allowed opacity-40`}
    >
      <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0
        ${isDark ? 'bg-base-700/20 text-gray-500' : 'bg-base-100 text-gray-300'}`}>
        {letter}
      </span>
      <span className="flex-1 ml-3">{label}</span>
    </button>
  );
}