// src/HomeScreen.jsx
import { useHomeViewModel } from "./viewModel";
import QuizOptionButton from "../components/Quiz/QuizOptionButton";

// ---------------------------------------------------------------------------
// Design language: "graded notebook" — spiral binding, ruled paper, a red-pen
// stamp for level, dog-eared flashcard corners, a punch-hole coin ticket.
// Every color comes from daisyUI's semantic tokens (base-100/200/300,
// primary, error, success, info, warning, neutral) so the whole page follows
// whichever daisyUI theme is active (light, dark, or any custom theme) —
// nothing here is a hardcoded hex value.
// ---------------------------------------------------------------------------

// Dog-eared corner fold, built from Tailwind's directional border trick so its
// color is the theme's border token and it flips automatically with theme.
const DOGEAR =
  "relative after:content-[''] after:absolute after:top-0 after:right-0 after:w-0 after:h-0 " +
  "after:border-t-[14px] after:border-l-[14px] after:border-t-base-300 after:border-l-transparent";

// Same fold, but for buttons sitting on a solid daisyUI color (btn-error etc.)
// where a translucent black reads correctly regardless of theme.
const DOGEAR_ON_COLOR =
  "relative after:content-[''] after:absolute after:top-0 after:right-0 after:w-0 after:h-0 " +
  "after:border-t-[14px] after:border-l-[14px] after:border-t-black/20 after:border-l-transparent";

export default function HomeScreen({ onStartQuiz, onGoToLesson }) {
  const viewModel = useHomeViewModel();

  const {
    loading,
    totalWords,
    myWordsCount,
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
  } = viewModel;

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-base-100">
        <NotebookFonts />
        <span className="h-14 w-14 animate-spin rounded-full border-[3px] border-dashed border-primary" />
        <span className="font-mono text-[12px] font-semibold tracking-[4px] text-base-content/50">
          SAYFA AÇILIYOR…
        </span>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-base-100 text-base-content">
      <NotebookFonts />

      {/* Ambient glow */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[34rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-20 h-80 w-[22rem] rounded-full bg-accent/15 blur-3xl" />

      {/* Spiral binding strip */}
      <div
        className="relative z-10 h-5 w-full bg-neutral bg-[length:22px_20px] bg-[position:11px_0]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(0,0,0,0.35) 3px, transparent 3px)",
        }}
      />

      <div
        className={`relative z-10 mx-auto max-w-md px-5 pb-8 pt-5 transition-all duration-500 ${mounted ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
          }`}
      >
        {/* Header: notebook cover label + level stamp */}
        <div className="mb-6 flex items-center justify-between">
          <div
            className="inline-flex items-center gap-2 bg-base-200 px-3 py-1.5 font-mono text-[11px] font-bold tracking-[3px] text-base-content shadow-sm"
            style={{ clipPath: "polygon(3% 0, 100% 0, 97% 100%, 0 100%)" }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            LINGORA
          </div>

          <div className="flex h-16 w-16 -rotate-6 flex-col items-center justify-center rounded-full border-2 border-dashed border-primary bg-base-200 text-center shadow-sm">
            <span className="font-serif text-xl font-black leading-none text-primary">
              {userLevel}
            </span>
            <span className="mt-0.5 font-mono text-[8px] font-bold tracking-[1.5px] text-primary/80">
              SEVİYE
            </span>
          </div>
        </div>

        {/* Dersler — table of contents */}
        <div className="mb-5">
          <SectionTitle emoji="📚" title="Dersler" />

          {lessonsLoading ? (
            <div className="space-y-2">
              <div className="skeleton h-16 w-full rounded-md" />
              <div className="skeleton h-16 w-full rounded-md" />
            </div>
          ) : recentLessons.length > 0 ? (
            <div className={`rounded-md border border-base-300 bg-base-200 p-2 ${DOGEAR}`}>
              {recentLessons.map((lesson, i) => {
                const isCompleted = lesson.progress?.completed;
                return (
                  <button
                    key={lesson.id}
                    onClick={() => onGoToLesson?.(lesson.id)}
                    className={`group flex w-full items-center gap-3 rounded px-2 py-2.5 text-left transition-colors hover:bg-base-300/50 ${i !== recentLessons.length - 1
                        ? "border-b border-dashed border-base-300"
                        : ""
                      }`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 font-mono text-[11px] font-bold ${isCompleted
                          ? "border-success text-success"
                          : "border-error text-error"
                        }`}
                    >
                      {isCompleted ? "✓" : lesson.lesson_number}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-base-content">
                      {lesson.title}
                    </span>
                    <span className="mx-1 h-px flex-1 border-t border-dotted border-base-300" />
                    <span
                      className={`shrink-0 font-mono text-[10px] font-bold tracking-wide ${isCompleted ? "text-success" : "text-base-content/45"
                        }`}
                    >
                      {isCompleted ? "BİTTİ" : "DEVAM →"}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 rounded-md border border-base-300 bg-base-200 py-6 text-sm text-base-content/55">
              <span className="text-lg">📖</span>
              Henüz ders eklenmemiş
            </div>
          )}
        </div>

        {/* Progress — ruled page with red margin line */}
        <div
          className={`mb-4 rounded-md border border-base-300 border-l-4 border-l-error bg-base-200 py-4 pl-7 pr-4 ${DOGEAR}`}
          style={{
            backgroundImage:
              "repeating-linear-gradient(to bottom, transparent 0px, transparent 27px, rgba(120,113,108,0.18) 28px)",
          }}
        >
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="font-mono text-[11px] font-bold tracking-[2px] text-base-content/50">
                KELİME HAZNEN
              </div>
              <div className="font-serif text-[28px] font-black leading-tight text-base-content">
                {myWordsCount}
                <span className="text-[15px] font-semibold text-base-content/35">
                  {" "}
                  / {totalWords}
                </span>
              </div>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-error bg-base-100">
              <span className="font-mono text-[13px] font-black text-error">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-base-300">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

        {/* Coins — punch-hole ticket */}
        <div className="relative mb-4 flex items-center justify-between rounded-md border border-dashed border-base-300 bg-base-200 px-4 py-3 before:absolute before:-left-[7px] before:top-1/2 before:h-3.5 before:w-3.5 before:-translate-y-1/2 before:rounded-full before:bg-base-100 before:content-[''] after:absolute after:-right-[7px] after:top-1/2 after:h-3.5 after:w-3.5 after:-translate-y-1/2 after:rounded-full after:bg-base-100 after:content-['']">
          <div className="flex items-center gap-2">
            <span className="text-xl">🪙</span>
            <span className="font-mono text-sm font-bold text-base-content">
              {coins} COIN
            </span>
          </div>
          <span className="text-right text-[10.5px] leading-tight text-base-content/55">
            Her 50 Coin
            <br />= 5 kelime / cümle
          </span>
        </div>

        {/* Coin redeem buttons */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          <button
            onClick={handleBuyWords}
            disabled={buying || coins < 50}
            className={`btn btn-error rounded-md font-serif shadow-lg shadow-error/20 ${DOGEAR_ON_COLOR} ${coins >= 50 ? "hover:scale-[1.02] active:scale-[0.98]" : "opacity-40"
              }`}
          >
            <span className="flex flex-col items-center normal-case leading-tight">
              <span className="text-lg">📖</span>
              <span className="text-sm">5 Kelime Al</span>
              <span className="font-mono text-[10px] font-normal opacity-75">50 COIN</span>
            </span>
          </button>
          <button
            onClick={handleBuySentences}
            disabled={buying || coins < 50}
            className={`btn btn-info rounded-md font-serif shadow-lg shadow-info/20 ${DOGEAR_ON_COLOR} ${coins >= 50 ? "hover:scale-[1.02] active:scale-[0.98]" : "opacity-40"
              }`}
          >
            <span className="flex flex-col items-center normal-case leading-tight">
              <span className="text-lg">📝</span>
              <span className="text-sm">5 Cümle Al</span>
              <span className="font-mono text-[10px] font-normal opacity-75">50 COIN</span>
            </span>
          </button>
        </div>

        {coins < 50 && (
          <div className="mb-4 rounded-md border border-dashed border-error/50 bg-error/10 px-4 py-2.5 text-center text-sm text-error">
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
          className={`mb-4 grid grid-cols-2 divide-x divide-dashed divide-base-300 rounded-md border border-base-300 bg-base-200 py-3 ${DOGEAR}`}
        >
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-lg opacity-80">📊</span>
            <span className="font-mono text-xl font-black text-base-content">
              {Math.round(progress)}%
            </span>
            <span className="text-[11px] text-base-content/50">Tamamlanma</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-lg opacity-80">⏳</span>
            <span className="font-mono text-xl font-black text-base-content">
              {remainingWords}
            </span>
            <span className="text-[11px] text-base-content/50">Kalan Kelime</span>
          </div>
        </div>

        {/* Summary bar */}
        <div className="flex items-center justify-around rounded-md border border-base-300 bg-base-200 px-3 py-3">
          <SummaryItem colorClass="bg-success" label="Kelime" value={dueCount} />
          <span className="h-6 w-px bg-base-300" />
          <SummaryItem colorClass="bg-info" label="Cümle" value={dueSentenceCount} />
          <span className="h-6 w-px bg-base-300" />
          <SummaryItem
            colorClass="bg-warning"
            label="Toplam"
            value={dueCount + dueSentenceCount}
          />
        </div>
      </div>
    </div>
  );
}

// ============ ALT BİLEŞENLER ============

function SectionTitle({ emoji, title }) {
  return (
    <div className="mb-2.5 flex items-center gap-2">
      <span className="text-[15px]">{emoji}</span>
      <span className="font-serif text-[15px] font-bold text-base-content">{title}</span>
      <svg width="46" height="10" viewBox="0 0 46 10" className="mt-1 text-error opacity-70">
        <path
          d="M1 6 C 8 2, 14 9, 21 5 S 34 2, 45 6"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

function SummaryItem({ colorClass, label, value }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className={`h-1.5 w-1.5 rounded-full ${colorClass}`} />
      <span className="text-base-content/55">{label}</span>
      <span className="font-mono font-bold text-base-content">{value}</span>
    </div>
  );
}

// Only typography is custom here — every color still comes from daisyUI's
// theme tokens above, so this never needs to change between light/dark.
function NotebookFonts() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,800;9..144,900&family=JetBrains+Mono:wght@500;600;700&display=swap');
      .font-serif { font-family: 'Fraunces', ui-serif, Georgia, serif; }
      .font-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
    `}</style>
  );
}