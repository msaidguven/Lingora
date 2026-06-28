// src/components/common/OptionButton.jsx
export default function OptionButton({
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
  let shadow = "";
  let scale = "";

  if (isAnswered) {
    if (isCorrect) {
      bgColor = isDark ? "bg-emerald-900/30" : "bg-emerald-50";
      borderColor = "border-emerald-500";
      shadow = "shadow-lg shadow-emerald-500/20";
    } else if (isSelected && !isCorrect) {
      bgColor = isDark ? "bg-red-900/30" : "bg-red-50";
      borderColor = "border-red-500";
      shadow = "shadow-lg shadow-red-500/20";
    }
  } else if (isSelected) {
    borderColor = "border-primary";
    bgColor = isDark ? "bg-primary/15" : "bg-primary/8";
    shadow = "shadow-lg shadow-primary/20";
    scale = "scale-[1.02]";
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full rounded-2xl border-2 p-10
        transition-all duration-200
        ${bgColor} ${borderColor} ${shadow} ${scale}
        ${!disabled && !isAnswered ? "hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-md" : ""}
        ${disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"}
      `}
    >
      {/* Tamamen boş kart */}
    </button>
  );
}