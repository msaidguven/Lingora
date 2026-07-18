// src/HomeScreen.jsx
import { useHomeViewModel } from "./viewModel";
import QuizOptionButton from "../components/Quiz/QuizOptionButton";
import NewItemsIntro from "./NewItemsIntro";
import {
  DOGEAR,
  DOGEAR_ON_COLOR,
  formatStudyDuration,
  SectionTitle,
  LegendDot,
  SpiralStrip,
  NotebookTheme,
} from "../theme/notebook";

// ---------------------------------------------------------------------------
// Design language: "graded notebook" — spiral binding, ruled paper, a red-pen
// stamp for level, dog-eared flashcard corners, a punch-hole coin ticket.
//
// Theming: colors are custom CSS variables defined with the `light-dark()`
// function (see <NotebookTheme /> below), instead of daisyUI's tokens. This
// keeps the exact look you liked, but it still flips automatically with
// daisyUI's light/dark theme — daisyUI sets `color-scheme: light` or `dark`
// on the themed root element, and `light-dark()` reads that automatically,
// so no theme name has to be hardcoded here. A few brand accents (the navy
// spine, the red pen) stay fixed in both modes on purpose — like a logo
// color that doesn't change with the theme.
// ---------------------------------------------------------------------------

export default function HomeScreen({ onStartQuiz, onGoToLesson }) {
  const viewModel = useHomeViewModel();

  const {
    loading,
    totalWords,
    myWordsCount,
    totalSentences = 0,
    mySentencesCount = 0,
    sentenceProgress = 0,
    remainingSentences = 0,
    dueCount,
    dueSentenceCount,
    userLevel,
    opening,
    mounted,
    recentLessons,
    lessonsLoading,
    progress,
    remainingWords,
    coins,
    buying,
    handleOpenNewWords,
    handleBuyWords,
    handleBuySentences,
    dailyWordCorrect = 0,
    dailyWordWrong = 0,
    dailySentenceCorrect = 0,
    dailySentenceWrong = 0,
    dailyWordGoal = 100,
    dailySentenceGoal = 100,
    dailyStudySeconds = 0,
    introItems = [],
    introKind = null,
    finishIntro,
    cancelIntro,
  } = viewModel;

  if (loading) {
    return (
      <div className="lg-notebook flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--lg-bg)]">
        <NotebookTheme />
        <span className="h-14 w-14 animate-spin rounded-full border-[3px] border-dashed border-[var(--lg-red)]" />
        <span className="font-mono text-[12px] font-semibold tracking-[4px] text-[var(--lg-ink-muted)]">
          SAYFA AÇILIYOR…
        </span>
      </div>
    );
  }

  return (
    <div className="lg-notebook relative min-h-screen overflow-hidden bg-[var(--lg-bg)] text-[var(--lg-ink)]">
      <NotebookTheme />

      {introItems.length > 0 && (
        <NewItemsIntro items={introItems} kind={introKind} onFinish={finishIntro} onCancel={cancelIntro} />
      )}

      {/* Ambient glow */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[34rem] -translate-x-1/2 rounded-full bg-[var(--lg-red)]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-20 h-80 w-[22rem] rounded-full bg-[var(--lg-gold)]/10 blur-3xl" />

      {/* Spiral binding strip — fixed brand color in both themes */}
      <SpiralStrip />

      <div
        className={`relative z-10 mx-auto max-w-md px-5 pb-8 pt-5 transition-all duration-500 ${mounted ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
          }`}
      >
        {/* Header: notebook cover label + level stamp */}
        <div className="mb-6 flex items-center justify-between">
          <div
            className="inline-flex items-center gap-2 bg-[var(--lg-card)] px-3 py-1.5 font-mono text-[11px] font-bold tracking-[3px] text-[var(--lg-ink)] shadow-sm"
            style={{ clipPath: "polygon(3% 0, 100% 0, 97% 100%, 0 100%)" }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--lg-red)]" />
            LINGORA
          </div>

          <div className="flex h-16 w-16 -rotate-6 flex-col items-center justify-center rounded-full border-2 border-dashed border-[var(--lg-red)] bg-[var(--lg-card)] text-center shadow-sm">
            <span className="font-serif text-xl font-black leading-none text-[var(--lg-red)]">
              {userLevel}
            </span>
            <span className="mt-0.5 font-mono text-[8px] font-bold tracking-[1.5px] text-[var(--lg-red)]/80">
              SEVİYE
            </span>
          </div>
        </div>

        {/* Günlük Hedef — today's word/sentence attempt goal */}
        <div className={`mb-5 rounded-md border border-[var(--lg-border)] bg-[var(--lg-card)] ${DOGEAR}`}>
          <div className="flex items-center justify-between border-b border-dashed border-[var(--lg-border)] px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="text-[15px]">🎯</span>
              <span className="font-serif text-[14px] font-bold text-[var(--lg-ink)]">
                Günlük Hedef
              </span>
            </div>
            {dailyStudySeconds > 0 && (
              <span className="flex items-center gap-1 font-mono text-[11px] font-semibold text-[var(--lg-ink-muted)]">
                ⏱ {formatStudyDuration(dailyStudySeconds)}
              </span>
            )}
          </div>
          <div className="flex divide-x divide-dashed divide-[var(--lg-border)]">
            <DailyGoalRow
              icon="📖"
              label="Kelime"
              correct={dailyWordCorrect}
              wrong={dailyWordWrong}
              goal={dailyWordGoal}
            />
            <DailyGoalRow
              icon="📝"
              label="Cümle"
              correct={dailySentenceCorrect}
              wrong={dailySentenceWrong}
              goal={dailySentenceGoal}
            />
          </div>
        </div>

        {/* Dersler — table of contents */}
        <div className="mb-5">
          <SectionTitle emoji="📚" title="Dersler" />

          {lessonsLoading ? (
            <div className="space-y-2">
              <div className="h-16 w-full animate-pulse rounded-md bg-[var(--lg-card)]" />
              <div className="h-16 w-full animate-pulse rounded-md bg-[var(--lg-card)]" />
            </div>
          ) : recentLessons.length > 0 ? (
            <div
              className={`rounded-md border border-[var(--lg-border)] bg-[var(--lg-card)] p-2 ${DOGEAR}`}
            >
              {recentLessons.map((lesson, i) => {
                const isCompleted = lesson.progress?.completed;
                return (
                  <button
                    key={lesson.id}
                    onClick={() => onGoToLesson?.(lesson.id)}
                    className={`group flex w-full items-center gap-3 rounded px-2 py-2.5 text-left transition-colors hover:bg-[var(--lg-border)] ${i !== recentLessons.length - 1
                        ? "border-b border-dashed border-[var(--lg-border)]"
                        : ""
                      }`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 font-mono text-[11px] font-bold ${isCompleted
                          ? "border-[var(--lg-green)] text-[var(--lg-green)]"
                          : "border-[var(--lg-red)] text-[var(--lg-red)]"
                        }`}
                    >
                      {isCompleted ? "✓" : lesson.lesson_number}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-[var(--lg-ink)]">
                      {lesson.title}
                    </span>
                    <span className="mx-1 h-px flex-1 border-t border-dotted border-[var(--lg-border-strong)]" />
                    <span
                      className={`shrink-0 font-mono text-[10px] font-bold tracking-wide ${isCompleted ? "text-[var(--lg-green)]" : "text-[var(--lg-ink-muted)]"
                        }`}
                    >
                      {isCompleted ? "BİTTİ" : "DEVAM →"}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 rounded-md border border-[var(--lg-border)] bg-[var(--lg-card)] py-6 text-sm text-[var(--lg-ink-muted)]">
              <span className="text-lg">📖</span>
              Henüz ders eklenmemiş
            </div>
          )}
        </div>

        {/* Progress — ruled page with red margin line */}
        <div
          className={`mb-4 rounded-md border border-[var(--lg-border)] border-l-4 border-l-[var(--lg-red)] bg-[var(--lg-card)] py-4 pl-7 pr-4 ${DOGEAR}`}
          style={{
            backgroundImage:
              "repeating-linear-gradient(to bottom, transparent 0px, transparent 27px, var(--lg-rule) 28px)",
          }}
        >
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="font-mono text-[11px] font-bold tracking-[2px] text-[var(--lg-ink-muted)]">
                KELİME HAZNEN
              </div>
              <div className="font-serif text-[28px] font-black leading-tight text-[var(--lg-ink)]">
                {myWordsCount}
                <span className="text-[15px] font-semibold text-[var(--lg-ink-muted)]">
                  {" "}
                  / {totalWords}
                </span>
              </div>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-[var(--lg-red)] bg-[var(--lg-bg)]">
              <span className="font-mono text-[13px] font-black text-[var(--lg-red)]">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--lg-border-strong)]">
            <div
              className="h-full rounded-full bg-[var(--lg-red)] transition-all duration-700"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

        {/* Sentence Progress — same language, blue margin line */}
        <div
          className={`mb-4 rounded-md border border-[var(--lg-border)] border-l-4 border-l-[var(--lg-blue)] bg-[var(--lg-card)] py-4 pl-7 pr-4 ${DOGEAR}`}
          style={{
            backgroundImage:
              "repeating-linear-gradient(to bottom, transparent 0px, transparent 27px, var(--lg-rule) 28px)",
          }}
        >
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="font-mono text-[11px] font-bold tracking-[2px] text-[var(--lg-ink-muted)]">
                CÜMLE HAZNEN
              </div>
              <div className="font-serif text-[28px] font-black leading-tight text-[var(--lg-ink)]">
                {mySentencesCount}
                <span className="text-[15px] font-semibold text-[var(--lg-ink-muted)]">
                  {" "}
                  / {totalSentences}
                </span>
              </div>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-[var(--lg-blue)] bg-[var(--lg-bg)]">
              <span className="font-mono text-[13px] font-black text-[var(--lg-blue)]">
                {Math.round(sentenceProgress)}%
              </span>
            </div>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--lg-border-strong)]">
            <div
              className="h-full rounded-full bg-[var(--lg-blue)] transition-all duration-700"
              style={{ width: `${Math.min(sentenceProgress, 100)}%` }}
            />
          </div>
        </div>

        {/* Coins — punch-hole ticket */}
        <div className="relative mb-4 flex items-center justify-between rounded-md border border-dashed border-[var(--lg-border-strong)] bg-[var(--lg-card)] px-4 py-3 before:absolute before:-left-[7px] before:top-1/2 before:h-3.5 before:w-3.5 before:-translate-y-1/2 before:rounded-full before:bg-[var(--lg-bg)] before:content-[''] after:absolute after:-right-[7px] after:top-1/2 after:h-3.5 after:w-3.5 after:-translate-y-1/2 after:rounded-full after:bg-[var(--lg-bg)] after:content-['']">
          <div className="flex items-center gap-2">
            <span className="text-xl">🪙</span>
            <span className="font-mono text-sm font-bold text-[var(--lg-ink)]">
              {coins} COIN
            </span>
          </div>
          <span className="text-right text-[10.5px] leading-tight text-[var(--lg-ink-muted)]">
            Her 50 Coin
            <br />= 5 kelime / cümle
          </span>
        </div>

        {/* Coin redeem buttons */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          <button
            onClick={handleBuyWords}
            disabled={buying || coins < 50}
            className={`rounded-md bg-[var(--lg-red)] py-3 text-center font-serif font-bold text-white shadow-lg shadow-[var(--lg-red)]/20 transition-transform ${DOGEAR_ON_COLOR} ${coins >= 50 ? "hover:scale-[1.02] active:scale-[0.98]" : "cursor-not-allowed opacity-40"
              }`}
          >
            <span className="block text-lg">📖</span>
            <span className="block text-sm">5 Kelime Al</span>
            <span className="block font-mono text-[10px] font-normal opacity-75">50 COIN</span>
          </button>
          <button
            onClick={handleBuySentences}
            disabled={buying || coins < 50}
            className={`rounded-md bg-[var(--lg-blue)] py-3 text-center font-serif font-bold text-white shadow-lg shadow-[var(--lg-blue)]/20 transition-transform ${DOGEAR_ON_COLOR} ${coins >= 50 ? "hover:scale-[1.02] active:scale-[0.98]" : "cursor-not-allowed opacity-40"
              }`}
          >
            <span className="block text-lg">📝</span>
            <span className="block text-sm">5 Cümle Al</span>
            <span className="block font-mono text-[10px] font-normal opacity-75">50 COIN</span>
          </button>
        </div>

        {coins < 50 && (
          <div className="mb-4 rounded-md border border-dashed border-[var(--lg-red)]/50 bg-[var(--lg-red)]/10 px-4 py-2.5 text-center text-sm text-[var(--lg-red)]">
            ⚡ Yetersiz coin. Ders çalışarak coin kazanabilirsin!
          </div>
        )}

        {/* Quiz launch cards */}
        <div className="mb-4">
          <SectionTitle emoji="✏️" title="Çalışmaya Başla" />
          <div className="flex flex-col gap-2.5">
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
        </div>

        {/* Stat tiles — stamped figures */}
        <div
          className={`mb-4 grid grid-cols-2 divide-x divide-dashed divide-[var(--lg-border)] rounded-md border border-[var(--lg-border)] bg-[var(--lg-card)] py-3 ${DOGEAR}`}
        >
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-lg opacity-80">📊</span>
            <span className="font-mono text-xl font-black text-[var(--lg-ink)]">
              {Math.round(progress)}%
            </span>
            <span className="text-[11px] text-[var(--lg-ink-muted)]">Tamamlanma</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-lg opacity-80">⏳</span>
            <span className="font-mono text-xl font-black text-[var(--lg-ink)]">
              {remainingWords}
            </span>
            <span className="text-[11px] text-[var(--lg-ink-muted)]">Kalan Kelime</span>
          </div>
        </div>

        {/* Summary bar */}
        <div className="flex items-center justify-around rounded-md border border-[var(--lg-border)] bg-[var(--lg-card)] px-3 py-3">
          <LegendDot colorVar="var(--lg-green)" label="Kelime" value={dueCount} />
          <span className="h-6 w-px bg-[var(--lg-border)]" />
          <LegendDot colorVar="var(--lg-blue)" label="Cümle" value={dueSentenceCount} />
          <span className="h-6 w-px bg-[var(--lg-border)]" />
          <LegendDot
            colorVar="var(--lg-gold)"
            label="Toplam"
            value={dueCount + dueSentenceCount}
          />
        </div>
      </div>
    </div>
  );
}

// ============ ALT BİLEŞENLER (bu ekrana özel) ============

// Today's attempt count toward the daily goal. Total is the headline number
// (the thing that matters most); correct/wrong is the smaller supporting
// detail, shown both as a two-color bar segment and as a ✓/✗ readout.
function DailyGoalRow({ icon, label, correct, wrong, goal }) {
  const total = correct + wrong;
  const filledPct = Math.min((total / goal) * 100, 100);
  const correctPct = total > 0 ? (correct / total) * filledPct : 0;
  const wrongPct = total > 0 ? (wrong / total) * filledPct : 0;
  const goalMet = total >= goal;
  const overflow = total - goal;

  return (
    <div className="flex-1 px-3 py-2.5">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[12px] font-semibold text-[var(--lg-ink)]">
          <span>{icon}</span>
          {label}
        </span>
        {goalMet && (
          <span className="-rotate-3 rounded-full border border-dashed border-[var(--lg-green)] px-1.5 py-0.5 font-mono text-[8px] font-bold tracking-wide text-[var(--lg-green)]">
            HEDEF ✓
          </span>
        )}
      </div>

      <div className="mb-1.5 flex items-baseline gap-1">
        <span
          className={`font-mono text-[26px] font-black leading-none ${goalMet ? "text-[var(--lg-green)]" : "text-[var(--lg-ink)]"
            }`}
        >
          {total}
        </span>
        <span className="font-mono text-xs font-semibold text-[var(--lg-ink-muted)]">
          / {goal}
        </span>
        {overflow > 0 && (
          <span className="ml-0.5 font-mono text-[10px] font-bold text-[var(--lg-gold)]">
            +{overflow} 🔥
          </span>
        )}
      </div>

      <div className="mb-1.5 flex h-2 w-full overflow-hidden rounded-full bg-[var(--lg-border-strong)]">
        <div
          className="h-full bg-[var(--lg-green)] transition-all duration-500"
          style={{ width: `${correctPct}%` }}
        />
        <div
          className="h-full bg-[var(--lg-red)] transition-all duration-500"
          style={{ width: `${wrongPct}%` }}
        />
      </div>

      <div className="flex items-center gap-3 font-mono text-[10.5px]">
        <span className="text-[var(--lg-green)]">✓ {correct}</span>
        <span className="text-[var(--lg-red)]">✗ {wrong}</span>
      </div>
    </div>
  );
}