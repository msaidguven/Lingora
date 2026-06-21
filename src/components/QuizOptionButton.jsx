// src/components/QuizOptionButton.jsx
export default function QuizOptionButton({
  icon,
  label,
  subLabel,
  count, // verilirse "X adet" mantığıyla aktif/pasif hesaplanır, verilmezse buton hep aktiftir
  gradient,
  onClick,
}) {
  const hasCount = typeof count === "number";
  const active = hasCount ? count > 0 : true;

  return (
    <button
      onClick={onClick}
      disabled={hasCount && !active}
      className={`group flex w-full items-center gap-3.5 rounded-2xl border p-3.5 text-left transition-all duration-200 ${
        active
          ? "border-base-300 bg-base-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
          : "border-base-300/60 bg-base-200/50"
      }`}
    >
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl ${
          active
            ? `bg-gradient-to-br ${gradient} text-white shadow-md`
            : "bg-base-300 text-base-content/30"
        }`}
      >
        {icon}
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={`block font-display text-[14.5px] font-bold ${
            active ? "" : "text-base-content/40"
          }`}
        >
          {label}
        </span>
        <span className="block text-[12px] text-base-content/45">
          {hasCount
            ? active
              ? `${count} ${subLabel}`
              : "Şu an çalışılacak yok"
            : subLabel}
        </span>
      </span>

      <span
        className={`font-display text-lg transition-transform group-hover:translate-x-0.5 ${
          active ? "text-primary" : "text-base-content/20"
        }`}
      >
        →
      </span>
    </button>
  );
}