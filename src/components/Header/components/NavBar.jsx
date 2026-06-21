// src/components/Header/components/NavBar.jsx
import { NAV_ITEMS } from "../config/navConfig";

export default function NavBar({ currentScreen, onNavigate, isActive, accent, quizVariant }) {
  return (
    <nav className="nav-container">
      {NAV_ITEMS.map(({ key, icon, label }) => {
        const active = isActive(key);
        const isQuiz = key === "quiz";
        const displayIcon = isQuiz && active ? quizVariant.icon : icon;
        const displayLabel = isQuiz && active ? quizVariant.label : label;

        return (
          <button
            key={key}
            onClick={() => onNavigate(key, isQuiz ? null : undefined)}
            className={`nav-btn ${active ? "nav-btn-active" : ""}`}
            aria-label={displayLabel}
            title={displayLabel}
            style={active ? { "--nav-accent": accent.from } : undefined}
          >
            <i className={`ti ${displayIcon}`} aria-hidden="true" />
            <span>{displayLabel}</span>
          </button>
        );
      })}
    </nav>
  );
}
