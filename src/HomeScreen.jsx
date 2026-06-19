// HomeScreen.jsx
import { useState, useEffect } from "react";
import { supabase } from "./config.js";

const FIXED_USER_ID = "302a3b6b-c1e9-49c4-98fe-52115bd7d204";

export default function HomeScreen({ onStartQuiz, onGoToLesson }) { // ✅ onGoToLesson prop'u eklendi
  const [loading, setLoading] = useState(true);
  const [totalWords, setTotalWords] = useState(0);
  const [myWordsCount, setMyWordsCount] = useState(0);
  const [dailyRemaining, setDailyRemaining] = useState(0);
  const [dueCount, setDueCount] = useState(0);
  const [dueSentenceCount, setDueSentenceCount] = useState(0);
  const [userLevel, setUserLevel] = useState("A1");
  const [opening, setOpening] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [recentLessons, setRecentLessons] = useState([]); // ✅ Dersler için state
  const [lessonsLoading, setLessonsLoading] = useState(true); // ✅ Ders yükleniyor state'i

  useEffect(() => {
    fetchData();
    fetchRecentLessons(); // ✅ Dersleri de çek
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const fetchData = async () => {
    setLoading(true);

    const { data: user } = await supabase
      .from("en_users")
      .select("level")
      .eq("id", FIXED_USER_ID)
      .single();

    const level = user?.level || "A1";
    setUserLevel(level);

    const { count: total } = await supabase
      .from("en_words")
      .select("*", { count: "exact", head: true })
      .eq("level", level)
      .eq("type", "word");

    const { count: myWords } = await supabase
      .from("en_user_words")
      .select("*", { count: "exact", head: true })
      .eq("user_id", FIXED_USER_ID);

    const { data: daily } = await supabase
      .from("en_user_daily_limit")
      .select("remaining_today")
      .eq("user_id", FIXED_USER_ID)
      .single();

    const { count: due } = await supabase
      .from("en_user_words")
      .select("*", { count: "exact", head: true })
      .eq("user_id", FIXED_USER_ID)
      .lt("next_review_at", new Date().toISOString());

    const { count: dueSentences } = await supabase
      .from("en_user_sentences")
      .select("*", { count: "exact", head: true })
      .eq("user_id", FIXED_USER_ID)
      .lt("next_review_at", new Date().toISOString());

    setTotalWords(total || 0);
    setMyWordsCount(myWords || 0);
    setDailyRemaining(daily?.remaining_today ?? 5);
    setDueCount(due || 0);
    setDueSentenceCount(dueSentences || 0);
    setLoading(false);
  };

  // ✅ Dersleri çeken fonksiyon
  const fetchRecentLessons = async () => {
    setLessonsLoading(true);
    try {
      const { data, error } = await supabase
        .from("en_lessons")
        .select("id, lesson_number, title, level")
        .order("level")
        .order("lesson_number")
        .limit(3);

      if (error) throw error;
      const lessons = data || [];
      const lessonIds = lessons.map((lesson) => lesson.id);

      let progressByLessonId = {};
      if (lessonIds.length > 0) {
        const { data: progressData, error: progressError } = await supabase
          .from("en_user_lesson_progress")
          .select("lesson_id, completed, score")
          .eq("user_id", FIXED_USER_ID)
          .in("lesson_id", lessonIds);

        if (progressError) throw progressError;
        progressByLessonId = (progressData || []).reduce((map, progress) => {
          map[progress.lesson_id] = progress;
          return map;
        }, {});
      }

      setRecentLessons(lessons.map((lesson) => ({
        ...lesson,
        progress: progressByLessonId[lesson.id] || null
      })));
    } catch (error) {
      console.error("Dersler çekilirken hata:", error);
    } finally {
      setLessonsLoading(false);
    }
  };

  const handleOpenNewWords = async () => {
    if (dailyRemaining === 0) {
      alert("Bugünlük hakkın kalmadı! Yarın tekrar dene.");
      return;
    }

    setOpening(true);

    try {
      const { data: userWords } = await supabase
        .from("en_user_words")
        .select("word_id")
        .eq("user_id", FIXED_USER_ID);

      const learnedIds = userWords?.map((w) => w.word_id) || [];

      let query = supabase
        .from("en_words")
        .select("*")
        .eq("level", userLevel)
        .eq("type", "word");

      if (learnedIds.length > 0) {
        query = query.not("id", "in", `(${learnedIds.join(",")})`);
      }

      const { data: newWords } = await query.limit(dailyRemaining);

      if (!newWords || newWords.length === 0) {
        alert("Tüm kelimeleri açtınız!");
        setOpening(false);
        return;
      }

      const now = new Date();
      const today = new Date();
      const newWordIds = newWords.map((w) => w.id);

      const wordInserts = newWords.map((word) => ({
        user_id: FIXED_USER_ID,
        word_id: word.id,
        added_at: now.toISOString(),
        next_review_at: today.toISOString(),
        review_count: 0,
        last_score: null,
        last_reviewed_at: null,
        ease_factor: 2.5,
        mastery_level: 0,
        is_mastered: false,
      }));

      const { error: wordError } = await supabase
        .from("en_user_words")
        .insert(wordInserts);

      if (wordError) throw wordError;

      const { data: sentences } = await supabase
        .from("en_example_sentences")
        .select("*")
        .in("word_id", newWordIds)
        .eq("is_approved", true);

      if (sentences && sentences.length > 0) {
        const sentenceInserts = sentences.map((sentence) => ({
          user_id: FIXED_USER_ID,
          sentence_id: sentence.id,
          added_at: now.toISOString(),
          next_review_at: today.toISOString(),
          review_count: 0,
          last_score: null,
          last_reviewed_at: null,
          ease_factor: 2.5,
        }));

        const { error: sentenceError } = await supabase
          .from("en_user_sentences")
          .insert(sentenceInserts);

        if (sentenceError) {
          console.error("Cümle ekleme hatası:", sentenceError);
        }
      }

      await supabase
  .from("en_user_daily_limit")
  .update({ 
    remaining_today: 0,
    last_reset_date: new Date().toISOString().split('T')[0] // Bugünün tarihi
  })
  .eq("user_id", FIXED_USER_ID);

      await fetchData();
      alert(`${newWords.length} yeni kelime eklendi!`);
    } catch (error) {
      console.error("Hata:", error);
      alert("Bir hata oluştu!");
    }

    setOpening(false);
  };

  const progress = totalWords > 0 ? (myWordsCount / totalWords) * 100 : 0;
  const remainingWords = totalWords - myWordsCount;

  if (loading) {
    return (
      <div style={styles.loadingScreen}>
        <style>{globalCss}</style>
        <div style={styles.loadingRing} />
        <div style={styles.loadingText}>Yükleniyor</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <style>{globalCss}</style>

      <div style={styles.glowTop} />
      <div style={styles.glowBottom} />

      <div style={{ ...styles.content, opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(12px)" }}>
        {/* Header */}
        <div style={styles.header} className="reveal" data-delay="0">
          <div style={styles.brand}>
            <span style={styles.brandDot} />
            LINGORA
          </div>
          <div style={styles.levelRow}>
            <span style={styles.levelBadge}>{userLevel}</span>
            <span style={styles.levelLabel}>Seviyesi</span>
          </div>
        </div>

        {/* ============ 📚 DERSLER BÖLÜMÜ ============ */}
        <div style={styles.lessonsSection} className="reveal" data-delay="0.5">
          <div style={styles.lessonsHeader}>
            <span style={styles.lessonsTitle}>📚 Dersler</span>
            {recentLessons.length > 0 && (
              <span style={styles.lessonsCount}>{recentLessons.length} ders</span>
            )}
          </div>
          
          {lessonsLoading ? (
            <div style={styles.lessonsLoading}>
              <span style={styles.miniSpinner} />
              Dersler yükleniyor...
            </div>
          ) : recentLessons.length > 0 ? (
            <div style={styles.lessonsList}>
              {recentLessons.map((lesson) => {
                const isCompleted = lesson.progress?.completed;
                return (
                  <div
                    key={lesson.id}
                    onClick={() => onGoToLesson?.(lesson.id)}
                    style={{
                      ...styles.lessonCard,
                      ...(isCompleted ? styles.lessonCardCompleted : {})
                    }}
                    className="lesson-card"
                  >
                    <div style={styles.lessonCardLeft}>
                      <div style={{
                        ...styles.lessonNumber,
                        ...(isCompleted ? styles.lessonNumberCompleted : {})
                      }}>
                        {isCompleted ? "✓" : `#${lesson.lesson_number}`}
                      </div>
                      <div>
                        <div style={styles.lessonTitle}>{lesson.title}</div>
                        <div style={styles.lessonMetaRow}>
                          <span style={styles.lessonLevel}>{lesson.level}</span>
                          {isCompleted && (
                            <span style={styles.lessonCompletedBadge}>Tamamlandı</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div style={styles.lessonArrow}>{isCompleted ? "Tekrar Et" : "→"}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={styles.noLessons}>
              <span style={styles.noLessonsIcon}>📖</span>
              <span>Henüz ders eklenmemiş</span>
            </div>
          )}
        </div>

        {/* Progress card */}
        <div style={styles.progressCard} className="reveal" data-delay="1">
          <div style={styles.progressTop}>
            <div>
              <div style={styles.progressLabel}>Kelime Haznen</div>
              <div style={styles.progressValue}>
                {myWordsCount}
                <span style={styles.progressValueMuted}> / {totalWords}</span>
              </div>
            </div>
            <div style={styles.progressRingWrap}>
              <svg width="56" height="56" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="24" fill="none" stroke="#1e1b3a" strokeWidth="5" />
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
                  style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(0.16, 1, 0.3, 1) 0.3s" }}
                />
                <defs>
                  <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8b7cff" />
                    <stop offset="100%" stopColor="#5b8cff" />
                  </linearGradient>
                </defs>
              </svg>
              <div style={styles.progressRingText}>{Math.round(progress)}%</div>
            </div>
          </div>
          <div style={styles.track}>
            <div
              style={{
                ...styles.trackFill,
                width: mounted ? `${progress}%` : "0%",
              }}
            />
          </div>
        </div>

        {/* Open new words CTA */}
        {dailyRemaining > 0 && myWordsCount < totalWords && (
          <button
            onClick={handleOpenNewWords}
            disabled={opening}
            className="reveal cta-btn"
            data-delay="2"
            style={{
              ...styles.ctaButton,
              ...(opening ? styles.ctaButtonDisabled : {}),
            }}
          >
            <span style={styles.ctaShine} />
            <span style={styles.ctaContent}>
              {opening ? (
                <>
                  <span style={styles.miniSpinner} />
                  Açılıyor
                </>
              ) : (
                <>
                  <span style={styles.ctaIcon}>✦</span>
                  {dailyRemaining} Yeni Kelime Aç
                </>
              )}
            </span>
          </button>
        )}

        {/* Quiz buttons */}
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

        {/* Stat tiles */}
        <div style={styles.statGrid} className="reveal" data-delay="4">
          <StatTile icon="📊" value={`${Math.round(progress)}%`} label="Tamamlanma" />
          <StatTile icon="⏳" value={remainingWords} label="Kalan Kelime" />
        </div>

        {/* Summary bar */}
        <div style={styles.summaryBar} className="reveal" data-delay="5">
          <SummaryItem color="#10b981" label="Kelime" value={dueCount} />
          <div style={styles.summaryDivider} />
          <SummaryItem color="#3b82f6" label="Cümle" value={dueSentenceCount} />
          <div style={styles.summaryDivider} />
          <SummaryItem color="#a855f7" label="Toplam" value={dueCount + dueSentenceCount} />
        </div>
      </div>
    </div>
  );
}

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

function StatTile({ icon, value, label }) {
  return (
    <div style={styles.statTile} className="stat-tile">
      <div style={styles.statIcon}>{icon}</div>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

function SummaryItem({ color, label, value }) {
  return (
    <div style={styles.summaryItem}>
      <span style={{ ...styles.summaryDot, background: color, boxShadow: `0 0 8px ${color}` }} />
      <span style={styles.summaryLabel}>{label}</span>
      <span style={styles.summaryValue}>{value}</span>
    </div>
  );
}

const globalCss = `
  @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@500;700;800&family=Inter:wght@400;500;600&display=swap');

  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulseGlow { 0%, 100% { opacity: 0.55; } 50% { opacity: 0.85; } }
  @keyframes shimmer { 0% { transform: translateX(-120%) skewX(-15deg); } 100% { transform: translateX(220%) skewX(-15deg); } }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }

  .reveal { animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
  .reveal[data-delay="0"] { animation-delay: 0.02s; }
  .reveal[data-delay="0.5"] { animation-delay: 0.05s; }
  .reveal[data-delay="1"] { animation-delay: 0.08s; }
  .reveal[data-delay="2"] { animation-delay: 0.14s; }
  .reveal[data-delay="3"] { animation-delay: 0.20s; }
  .reveal[data-delay="4"] { animation-delay: 0.26s; }
  .reveal[data-delay="5"] { animation-delay: 0.32s; }

  .cta-btn { transition: transform 0.18s ease, filter 0.18s ease; }
  .cta-btn:active:not(:disabled) { transform: scale(0.97); }
  .cta-btn:hover:not(:disabled) { filter: brightness(1.07); }

  .quiz-btn { transition: transform 0.18s ease, filter 0.18s ease; }
  .quiz-btn-active:hover { transform: translateY(-2px); filter: brightness(1.06); }
  .quiz-btn-active:active { transform: translateY(0) scale(0.985); }

  .stat-tile { transition: transform 0.2s ease, border-color 0.2s ease; }
  .stat-tile:hover { transform: translateY(-3px); border-color: #383260; }

  .lesson-card {
    transition: all 0.2s ease;
    cursor: pointer;
  }
  .lesson-card:hover {
    border-color: #6366f1 !important;
    transform: translateX(4px);
    box-shadow: 0 4px 16px rgba(99, 102, 241, 0.15);
  }
  .lesson-card:active {
    transform: scale(0.98);
  }

  @media (prefers-reduced-motion: reduce) {
    .reveal, .cta-btn, .quiz-btn, .stat-tile, .lesson-card { 
      animation: none !important; 
      transition: none !important; 
    }
  }
`;

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0a0915",
    color: "#e9e6f7",
    fontFamily: "'Inter', system-ui, sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  glowTop: {
    position: "absolute",
    top: -120,
    left: "50%",
    transform: "translateX(-50%)",
    width: 480,
    height: 320,
    background: "radial-gradient(circle, rgba(99,102,241,0.28), transparent 70%)",
    filter: "blur(10px)",
    pointerEvents: "none",
    animation: "pulseGlow 6s ease-in-out infinite",
  },
  glowBottom: {
    position: "absolute",
    bottom: -160,
    right: -80,
    width: 420,
    height: 360,
    background: "radial-gradient(circle, rgba(168,85,247,0.18), transparent 70%)",
    filter: "blur(10px)",
    pointerEvents: "none",
    animation: "pulseGlow 7s ease-in-out infinite 1s",
  },
  content: {
    position: "relative",
    zIndex: 1,
    maxWidth: 420,
    margin: "0 auto",
    padding: "28px 20px 36px",
    transition: "opacity 0.5s ease, transform 0.5s ease",
  },
  loadingScreen: {
    minHeight: "100vh",
    background: "#0a0915",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  loadingRing: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    border: "3px solid #1e1b3a",
    borderTopColor: "#8b7cff",
    animation: "spin 0.8s linear infinite",
  },
  loadingText: {
    color: "#6b6690",
    fontSize: 13,
    letterSpacing: 1,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
  },
  brand: {
    fontSize: 11,
    letterSpacing: 3,
    color: "#8b7cff",
    fontWeight: 700,
    fontFamily: "'Manrope', sans-serif",
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  brandDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#8b7cff",
    boxShadow: "0 0 8px #8b7cff",
  },
  levelRow: {
    display: "flex",
    alignItems: "baseline",
    gap: 6,
  },
  levelBadge: {
    fontSize: 22,
    fontWeight: 800,
    fontFamily: "'Manrope', sans-serif",
    background: "linear-gradient(135deg, #fff, #b9b3e8)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
  },
  levelLabel: {
    fontSize: 13,
    color: "#6b6690",
    fontWeight: 500,
  },
  // ============ DERSLER BÖLÜMÜ STILLERİ ============
  lessonsSection: {
    marginBottom: 20,
  },
  lessonsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  lessonsTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: "#e9e6f7",
    fontFamily: "'Manrope', sans-serif",
  },
  lessonsCount: {
    fontSize: 11,
    color: "#6b6690",
    background: "#161427",
    padding: "2px 10px",
    borderRadius: 12,
  },
  lessonsLoading: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "16px",
    background: "#130f24",
    borderRadius: 14,
    border: "1px solid #201c3a",
    color: "#6b6690",
    fontSize: 13,
  },
  lessonsList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  lessonCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    background: "#130f24",
    borderRadius: 14,
    border: "1px solid #201c3a",
  },
  lessonCardCompleted: {
    border: "1px solid rgba(16,185,129,0.35)",
    background: "linear-gradient(135deg, rgba(16,185,129,0.12), #130f24)",
  },
  lessonCardLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  lessonNumber: {
    fontSize: 12,
    fontWeight: 700,
    color: "#8b7cff",
    background: "rgba(139, 124, 255, 0.12)",
    padding: "2px 10px",
    borderRadius: 6,
    fontFamily: "'Manrope', sans-serif",
  },
  lessonNumberCompleted: {
    color: "#10b981",
    background: "rgba(16,185,129,0.14)",
  },
  lessonTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: "#e9e6f7",
  },
  lessonMetaRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
    marginTop: 2,
  },
  lessonLevel: {
    fontSize: 10,
    color: "#6b6690",
    background: "#0a0915",
    padding: "1px 8px",
    borderRadius: 4,
    display: "inline-block",
  },
  lessonCompletedBadge: {
    fontSize: 10,
    color: "#10b981",
    background: "rgba(16,185,129,0.12)",
    border: "1px solid rgba(16,185,129,0.2)",
    padding: "1px 8px",
    borderRadius: 4,
    fontWeight: 700,
  },
  lessonArrow: {
    color: "#4b4768",
    fontSize: 12,
    fontWeight: 700,
    transition: "all 0.2s ease",
  },
  noLessons: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "20px",
    background: "#130f24",
    borderRadius: 14,
    border: "1px solid #201c3a",
    color: "#6b6690",
    fontSize: 13,
  },
  noLessonsIcon: {
    fontSize: 18,
  },
  miniSpinner: {
    width: 14,
    height: 14,
    borderRadius: "50%",
    border: "2px solid #1e1b3a",
    borderTopColor: "#8b7cff",
    animation: "spin 0.7s linear infinite",
    display: "inline-block",
  },
  // ============ DEVAM EDEN STILLER ============
  progressCard: {
    background: "linear-gradient(155deg, #15122a, #100e22)",
    border: "1px solid #211d3f",
    borderRadius: 20,
    padding: "18px 18px 16px",
    marginBottom: 18,
  },
  progressTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  progressLabel: {
    fontSize: 12.5,
    color: "#807bab",
    marginBottom: 4,
    fontWeight: 500,
  },
  progressValue: {
    fontSize: 26,
    fontWeight: 800,
    fontFamily: "'Manrope', sans-serif",
    color: "#fff",
  },
  progressValueMuted: {
    fontSize: 15,
    fontWeight: 600,
    color: "#5e5887",
  },
  progressRingWrap: {
    position: "relative",
    width: 56,
    height: 56,
  },
  progressRingText: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 700,
    color: "#cdc8f0",
  },
  track: {
    height: 7,
    background: "#1a1730",
    borderRadius: 99,
    overflow: "hidden",
  },
  trackFill: {
    height: "100%",
    background: "linear-gradient(90deg, #8b7cff, #5b8cff)",
    borderRadius: 99,
    transition: "width 1.1s cubic-bezier(0.16, 1, 0.3, 1) 0.3s",
  },
  ctaButton: {
    position: "relative",
    overflow: "hidden",
    width: "100%",
    padding: "17px",
    borderRadius: 16,
    border: "none",
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "#fff",
    fontWeight: 700,
    fontSize: 15.5,
    fontFamily: "'Manrope', sans-serif",
    cursor: "pointer",
    marginBottom: 14,
    boxShadow: "0 10px 28px -10px rgba(16,185,129,0.55)",
  },
  ctaButtonDisabled: {
    background: "#2a2a3a",
    boxShadow: "none",
    cursor: "not-allowed",
  },
  ctaShine: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "40%",
    height: "100%",
    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)",
    animation: "shimmer 2.8s ease-in-out infinite",
  },
  ctaContent: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  ctaIcon: {
    fontSize: 14,
  },
  quizStack: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginBottom: 16,
  },
  quizButton: {
    width: "100%",
    padding: "15px 16px",
    borderRadius: 16,
    border: "none",
    fontWeight: 700,
    fontSize: 14.5,
    fontFamily: "'Manrope', sans-serif",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  quizLeft: {
    display: "flex",
    alignItems: "center",
    gap: 9,
  },
  quizIcon: {
    fontSize: 17,
  },
  quizCount: {
    fontSize: 12,
    fontWeight: 700,
    padding: "3px 11px",
    borderRadius: 99,
    minWidth: 26,
    textAlign: "center",
  },
  statGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    marginBottom: 16,
  },
  statTile: {
    background: "#130f24",
    border: "1px solid #201c3a",
    borderRadius: 16,
    padding: "16px 14px",
    textAlign: "center",
  },
  statIcon: {
    fontSize: 22,
    marginBottom: 6,
    opacity: 0.9,
  },
  statValue: {
    fontSize: 21,
    fontWeight: 800,
    fontFamily: "'Manrope', sans-serif",
    color: "#fff",
  },
  statLabel: {
    fontSize: 11,
    color: "#6b6690",
    marginTop: 2,
  },
  summaryBar: {
    padding: "13px 10px",
    background: "#100e1f",
    border: "1px solid #1c1834",
    borderRadius: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
  },
  summaryItem: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
  },
  summaryDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    display: "inline-block",
  },
  summaryLabel: {
    color: "#807bab",
  },
  summaryValue: {
    color: "#e9e6f7",
    fontWeight: 700,
  },
  summaryDivider: {
    width: 1,
    height: 18,
    background: "#221e3c",
  },
};
