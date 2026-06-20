// src/HomeScreen.jsx
import { useHomeViewModel } from "./viewModel";
import { useTheme } from '../contexts/ThemeContext';
import './HomeScreen.css';

export default function HomeScreen({ onStartQuiz, onGoToLesson }) {
  const { theme } = useTheme();
  const viewModel = useHomeViewModel();

  const {
    loading,
    totalWords,
    myWordsCount,
    dailyRemaining,
    dueCount,
    dueSentenceCount,
    userLevel,
    opening,
    mounted,
    recentLessons,
    lessonsLoading,
    progress,
    remainingWords,
    handleOpenNewWords
  } = viewModel;

  // Loading durumu
  if (loading) {
    return (
      <div className={`home-page ${theme}`}>
        <div className="loading-screen">
          <div className="loading-ring" />
          <div className="loading-text">Yükleniyor</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`home-page ${theme}`}>
      <div className="glow-top" />
      <div className="glow-bottom" />

      <div className={`content ${mounted ? 'mounted' : ''}`}>
        {/* Header */}
        <div className="header reveal" data-delay="0">
          <div className="brand">
            <span className="brand-dot" />
            LINGORA
          </div>
          <div className="level-row">
            <span className="level-badge">{userLevel}</span>
            <span className="level-label">Seviyesi</span>
          </div>
        </div>

        {/* Dersler Bölümü */}
        <div className="lessons-section reveal" data-delay="0.5">
          <div className="lessons-header">
            <span className="lessons-title">📚 Dersler</span>
            {recentLessons.length > 0 && (
              <span className="lessons-count">{recentLessons.length} ders</span>
            )}
          </div>
          
          {lessonsLoading ? (
            <div className="lessons-loading">
              <span className="mini-spinner" />
              Dersler yükleniyor...
            </div>
          ) : recentLessons.length > 0 ? (
            <div className="lessons-list">
              {recentLessons.map((lesson) => {
                const isCompleted = lesson.progress?.completed;
                return (
                  <div
                    key={lesson.id}
                    onClick={() => onGoToLesson?.(lesson.id)}
                    className={`lesson-card ${isCompleted ? 'completed' : ''}`}
                  >
                    <div className="lesson-card-left">
                      <div className={`lesson-number ${isCompleted ? 'completed' : ''}`}>
                        {isCompleted ? "✓" : `#${lesson.lesson_number}`}
                      </div>
                      <div>
                        <div className="lesson-title">{lesson.title}</div>
                        <div className="lesson-meta-row">
                          <span className="lesson-level">{lesson.level}</span>
                          {isCompleted && (
                            <span className="lesson-completed-badge">Tamamlandı</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="lesson-arrow">
                      {isCompleted ? "Tekrar Et" : "→"}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="no-lessons">
              <span className="no-lessons-icon">📖</span>
              <span>Henüz ders eklenmemiş</span>
            </div>
          )}
        </div>

        {/* Progress Card */}
        <div className="progress-card reveal" data-delay="1">
          <div className="progress-top">
            <div>
              <div className="progress-label">Kelime Haznen</div>
              <div className="progress-value">
                {myWordsCount}
                <span className="progress-value-muted"> / {totalWords}</span>
              </div>
            </div>
            <div className="progress-ring-wrap">
              <svg width="56" height="56" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="24" fill="none" stroke="var(--ring-bg)" strokeWidth="5" />
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  fill="none"
                  stroke="url(#ringGrad)"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 24}
                  strokeDashoffset={mounted ? 2 * Math.PI * 24 * (1 - progress / 100) : 2 * Math.PI * 24}
                  transform="rotate(-90 28 28)"
                  className="progress-ring"
                />
                <defs>
                  <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8b7cff" />
                    <stop offset="100%" stopColor="#5b8cff" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="progress-ring-text">{Math.round(progress)}%</div>
            </div>
          </div>
          <div className="track">
            <div
              className="track-fill"
              style={{ width: mounted ? `${progress}%` : "0%" }}
            />
          </div>
        </div>

        {/* CTA Button */}
        {dailyRemaining > 0 && myWordsCount < totalWords && (
          <button
            onClick={handleOpenNewWords}
            disabled={opening}
            className={`cta-button reveal ${opening ? 'disabled' : ''}`}
            data-delay="2"
          >
            <span className="cta-shine" />
            <span className="cta-content">
              {opening ? (
                <>
                  <span className="mini-spinner" />
                  Açılıyor
                </>
              ) : (
                <>
                  <span className="cta-icon">✦</span>
                  {dailyRemaining} Yeni Kelime Aç
                </>
              )}
            </span>
          </button>
        )}

        {/* Quiz Buttons */}
        <div className="quiz-stack reveal" data-delay="3">
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

        {/* Stat Tiles */}
        <div className="stat-grid reveal" data-delay="4">
          <StatTile icon="📊" value={`${Math.round(progress)}%`} label="Tamamlanma" />
          <StatTile icon="⏳" value={remainingWords} label="Kalan Kelime" />
        </div>

        {/* Summary Bar */}
        <div className="summary-bar reveal" data-delay="5">
          <SummaryItem color="#10b981" label="Kelime" value={dueCount} />
          <div className="summary-divider" />
          <SummaryItem color="#3b82f6" label="Cümle" value={dueSentenceCount} />
          <div className="summary-divider" />
          <SummaryItem color="#a855f7" label="Toplam" value={dueCount + dueSentenceCount} />
        </div>
      </div>
    </div>
  );
}

// ============ ALT BİLEŞENLER ============

function QuizButton({ icon, label, count, accentFrom, accentTo, onClick }) {
  const active = count > 0;
  
  return (
    <button
      onClick={onClick}
      disabled={!active}
      className={`quiz-btn ${active ? 'active' : ''}`}
      style={{
        background: active
          ? `linear-gradient(135deg, ${accentFrom}, ${accentTo})`
          : "var(--quiz-btn-bg)",
        color: active ? "#fff" : "var(--quiz-btn-disabled)",
        cursor: active ? "pointer" : "not-allowed",
        boxShadow: active ? `0 8px 24px -8px ${accentFrom}66` : "none",
      }}
    >
      <span className="quiz-left">
        <span className="quiz-icon">{icon}</span>
        {label}
      </span>
      <span className={`quiz-count ${active ? 'active' : ''}`}>
        {count}
      </span>
    </button>
  );
}

function StatTile({ icon, value, label }) {
  return (
    <div className="stat-tile">
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function SummaryItem({ color, label, value }) {
  return (
    <div className="summary-item">
      <span 
        className="summary-dot" 
        style={{ background: color, boxShadow: `0 0 8px ${color}` }}
      />
      <span className="summary-label">{label}</span>
      <span className="summary-value">{value}</span>
    </div>
  );
}