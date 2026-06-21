// src/HomeScreen.jsx
import { useHomeViewModel } from "./viewModel";
import QuizOptionButton from "../components/Quiz/QuizOptionButton";

export default function HomeScreen({ onStartQuiz, onGoToLesson }) {
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
    handleOpenNewWords,
  } = viewModel;

  // Loading durumu
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-base-100">
        <span className="loading loading-spinner loading-lg text-primary" />
        <span className="text-[13px] tracking-widest text-base-content/50">
          YÜKLENİYOR
        </span>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-base-100 text-base-content">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-80 w-[30rem] -translate-x-1/2 rounded-full bg-primary/25 blur-3xl [animation-duration:6s] animate-pulse" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-96 w-[26rem] rounded-full bg-accent/15 blur-3xl [animation-duration:7s] animate-pulse" />

      <div
        className={`relative z-10 mx-auto max-w-md px-5 py-7 transition-all duration-500 ${
          mounted ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        }`}
      >
        {/* Header */}
        <div
          className="animate-fade-up mb-6 flex items-center justify-between"
          style={{ animationDelay: "0.02s" }}
        >
          <div className="flex items-center gap-2 font-display text-[11px] font-bold tracking-[3px] text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px] shadow-primary" />
            LINGORA
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="bg-gradient-to-br from-base-content to-base-content/40 bg-clip-text font-display text-2xl font-extrabold text-transparent">
              {userLevel}
            </span>
            <span className="text-[13px] font-medium text-base-content/55">
              Seviyesi
            </span>
          </div>
        </div>

        {/* Dersler Bölümü */}
        <div className="animate-fade-up mb-5" style={{ animationDelay: "0.05s" }}>
          <div className="mb-2.5 flex items-center justify-between">
            <span className="font-display text-[15px] font-bold">📚 Dersler</span>
            {recentLessons.length > 0 && (
              <span className="badge badge-ghost badge-sm">
                {recentLessons.length} ders
              </span>
            )}
          </div>

          {lessonsLoading ? (
            <div className="space-y-2">
              <div className="skeleton h-16 w-full rounded-2xl" />
              <div className="skeleton h-16 w-full rounded-2xl" />
            </div>
          ) : recentLessons.length > 0 ? (
            <div className="flex flex-col gap-2">
              {recentLessons.map((lesson) => {
                const isCompleted = lesson.progress?.completed;
                return (
                  <button
                    key={lesson.id}
                    onClick={() => onGoToLesson?.(lesson.id)}
                    className={`group flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all duration-200 hover:translate-x-1 ${
                      isCompleted
                        ? "border-success/30 bg-gradient-to-r from-success/10 to-base-200"
                        : "border-base-300 bg-base-200 hover:border-primary hover:shadow-lg hover:shadow-primary/15"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`badge font-display font-bold ${
                          isCompleted
                            ? "badge-success badge-outline"
                            : "badge-primary badge-outline"
                        }`}
                      >
                        {isCompleted ? "✓" : `#${lesson.lesson_number}`}
                      </span>
                      <div>
                        <div className="text-sm font-semibold">{lesson.title}</div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                          <span className="badge badge-ghost badge-xs">
                            {lesson.level}
                          </span>
                          {isCompleted && (
                            <span className="badge badge-success badge-xs">
                              Tamamlandı
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-base-content/40 transition-colors group-hover:text-primary">
                      {isCompleted ? "Tekrar Et" : "→"}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-base-300 bg-base-200 py-5 text-sm text-base-content/55">
              <span className="text-lg">📖</span>
              Henüz ders eklenmemiş
            </div>
          )}
        </div>

        {/* Progress Card */}
        <div
          className="animate-fade-up card mb-4 border border-base-300 bg-base-200 bg-gradient-to-br from-base-200 to-base-100 p-4"
          style={{ animationDelay: "0.08s" }}
        >
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-[12.5px] font-medium text-base-content/55">
                Kelime Haznen
              </div>
              <div className="font-display text-[26px] font-extrabold">
                {myWordsCount}
                <span className="text-[15px] font-semibold text-base-content/40">
                  {" "}
                  / {totalWords}
                </span>
              </div>
            </div>
            <div
              className="radial-progress text-primary"
              style={{ "--value": progress, "--size": "3.5rem", "--thickness": "5px" }}
              role="progressbar"
            >
              <span className="text-xs font-bold text-base-content">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
          <progress className="progress progress-primary w-full" value={progress} max="100" />
        </div>

        {/* CTA Button */}
        {dailyRemaining > 0 && myWordsCount < totalWords && (
          <button
            onClick={handleOpenNewWords}
            disabled={opening}
            className="btn btn-success btn-lg relative mb-3.5 w-full overflow-hidden border-0 font-display text-[15.5px] shadow-lg shadow-success/40"
          >
            {!opening && (
              <span className="animate-shimmer absolute inset-y-0 left-0 w-2/5 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
            )}
            <span className="relative flex items-center gap-2">
              {opening ? (
                <>
                  <span className="loading loading-spinner loading-xs" />
                  Açılıyor
                </>
              ) : (
                <>
                  <span>✦</span>
                  {dailyRemaining} Yeni Kelime Aç
                </>
              )}
            </span>
          </button>
        )}

        {/* Quiz Buttons */}
        <div
          className="animate-fade-up mb-4 flex flex-col gap-2.5"
          style={{ animationDelay: "0.14s" }}
        >
          <QuizOptionButton
            icon="📖"
            label="Kelime Çalış"
            subLabel="kelime hazır"
            count={dueCount}
            gradient="from-indigo-500 to-purple-500"
            onClick={() => onStartQuiz("word")}
          />
          <QuizOptionButton
            icon="📝"
            label="Cümle Çalış"
            subLabel="cümle hazır"
            count={dueSentenceCount}
            gradient="from-blue-500 to-indigo-500"
            onClick={() => onStartQuiz("sentence")}
          />
        </div>

        {/* Stat Tiles */}
        <div
          className="animate-fade-up stats mb-4 w-full border border-base-300 bg-base-200 shadow"
          style={{ animationDelay: "0.20s" }}
        >
          <div className="stat place-items-center py-3">
            <div className="stat-figure text-xl opacity-80">📊</div>
            <div className="stat-value font-display text-xl">
              {Math.round(progress)}%
            </div>
            <div className="stat-desc">Tamamlanma</div>
          </div>
          <div className="stat place-items-center py-3">
            <div className="stat-figure text-xl opacity-80">⏳</div>
            <div className="stat-value font-display text-xl">{remainingWords}</div>
            <div className="stat-desc">Kalan Kelime</div>
          </div>
        </div>

        {/* Summary Bar */}
        <div
          className="animate-fade-up flex items-center justify-around rounded-2xl border border-base-300 bg-base-200 px-3 py-3"
          style={{ animationDelay: "0.26s" }}
        >
          <SummaryItem color="bg-success" label="Kelime" value={dueCount} />
          <div className="divider divider-horizontal mx-0" />
          <SummaryItem color="bg-info" label="Cümle" value={dueSentenceCount} />
          <div className="divider divider-horizontal mx-0" />
          <SummaryItem
            color="bg-accent"
            label="Toplam"
            value={dueCount + dueSentenceCount}
          />
        </div>
      </div>
    </div>
  );
}

// ============ ALT BİLEŞENLER ============

function SummaryItem({ color, label, value }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
      <span className="text-base-content/55">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}