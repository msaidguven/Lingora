// components/home/QuizButtons.jsx
import { styles } from "./styles.js";

function QuizButton({ icon, label, count, accentFrom, accentTo, onClick }) {
  const active = count > 0;
  return (
    <button
      onClick={onClick}
      disabled={!active}
      className={active ? "quiz-btn quiz-btn-active" : "quiz-btn"}
      style={{
        ...styles.quizButton,
        background: active
          ? `linear-gradient(135deg, ${accentFrom}, ${accentTo})`
          : "#161427",
        color: active ? "#fff" : "#4b4768",
        cursor: active ? "pointer" : "not-allowed",
        boxShadow: active ? `0 8px 24px -8px ${accentFrom}66` : "none",
      }}
    >
      <span style={styles.quizLeft}>
        <span style={styles.quizIcon}>{icon}</span>
        {label}
      </span>
      <span
        style={{
          ...styles.quizCount,
          background: active ? "rgba(255,255,255,0.22)" : "transparent",
        }}
      >
        {count}
      </span>
    </button>
  );
}

export default function QuizButtons({ dueCount, dueSentenceCount, onStartQuiz }) {
  return (
    <div style={styles.quizStack} className="reveal" data-delay="3">
      <QuizButton
        icon="📖"
        label="Kelime Çalış"
        count={dueCount}
        accentFrom="#6366f1"
        accentTo="#a855f7"
        onClick={() => onStartQuiz("word")}
      />
      <QuizButton
        icon="📝"
        label="Cümle Çalış"
        count={dueSentenceCount}
        accentFrom="#3b82f6"
        accentTo="#6366f1"
        onClick={() => onStartQuiz("sentence")}
      />
    </div>
  );
}