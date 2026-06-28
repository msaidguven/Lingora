// src/components/common/OptionButton.jsx
export default function OptionButton({
  label,
  isAnswered,
  isCorrect,
  isSelected,
  onClick,
  disabled,
  isDark,
}) {
  // Stil durumları
  let bgColor = "bg-base-200";
  let borderColor = "border-base-300";
  let textColor = "text-base-content";
  let shadow = "";

  if (isAnswered) {
    if (isCorrect) {
      bgColor = isDark ? "bg-emerald-900/30" : "bg-emerald-50";
      borderColor = "border-emerald-500";
      textColor = isDark ? "text-emerald-400" : "text-emerald-700";
      shadow = "shadow-lg shadow-emerald-500/20";
    } else if (isSelected && !isCorrect) {
      bgColor = isDark ? "bg-red-900/30" : "bg-red-50";
      borderColor = "border-red-500";
      textColor = isDark ? "text-red-400" : "text-red-700";
      shadow = "shadow-lg shadow-red-500/20";
    }
  } else if (isSelected) {
    borderColor = "border-primary";
    bgColor = isDark ? "bg-primary/15" : "bg-primary/8";
    textColor = "text-primary";
    shadow = "shadow-lg shadow-primary/20";
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full rounded-2xl border-2 p-4 text-left 
        transition-all duration-200
        ${bgColor} ${borderColor} ${textColor} ${shadow}
        ${!disabled && !isAnswered ? "hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-md" : ""}
        ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
      `}
    >
      <span className="text-[15px] font-medium leading-relaxed">
        {label}
      </span>
    </button>
  );
}