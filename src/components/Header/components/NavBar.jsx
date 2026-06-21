// src/components/Header/components/NavBar.jsx
import { NAV_ITEMS } from "../config/navConfig";

export default function NavBar({ currentScreen, onNavigate, isActive, accent, quizVariant }) {
  return (
    <nav className="flex flex-1 divide-x divide-base-300 overflow-hidden rounded-xl border border-base-300 bg-base-200">
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
            style={active ? { backgroundColor: accent.from } : undefined}
            className={`flex flex-1 items-center justify-center gap-1.5 px-1.5 py-2.5 text-[11.5px] font-semibold transition-colors active:scale-95 ${
              active
                ? "text-white"
                : "text-base-content/55 hover:bg-base-300 hover:text-base-content"
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