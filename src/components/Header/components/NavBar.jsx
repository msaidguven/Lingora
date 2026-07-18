// src/components/Header/components/NavBar.jsx
import { NAV_ITEMS } from "../config/navConfig";

export default function NavBar({ currentScreen, onNavigate, isActive, accent, quizVariant }) {
  return (
    <nav className="flex flex-1 items-end gap-1 overflow-hidden">
      {NAV_ITEMS.map(({ key, icon, label }) => {
        const active = isActive(key);
        const isQuiz = key === "quiz";
        const displayIcon = isQuiz && active ? quizVariant.icon : icon;
        const displayLabel = isQuiz && active ? quizVariant.label : label;

        return (
          <button
            key={key}
            onClick={() => onNavigate(key, isQuiz ? null : undefined)}
            aria-label={displayLabel}
            title={displayLabel}
            style={active ? { borderColor: accent.from } : undefined}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-t-md border-b-2 px-1.5 pb-2 pt-2.5 text-[11.5px] font-semibold transition-colors active:scale-95 ${active
                ? "bg-[var(--lg-card)] text-[var(--lg-ink)] shadow-[0_-2px_6px_rgba(0,0,0,0.15)]"
                : "border-transparent text-[#F0E9D8]/55 hover:bg-white/5 hover:text-[#F0E9D8]/85"
              }`}
          >
            <i className={`ti ${displayIcon} text-[15px]`} aria-hidden="true" />
            <span className="min-w-0 truncate">{displayLabel}</span>
          </button>
        );
      })}
    </nav>
  );
}