// src/HomeScreen.jsx
import { useHomeViewModel } from "./viewModel";
import QuizOptionButton from "../components/Quiz/QuizOptionButton";

// ---------------------------------------------------------------------------
// Design language: "graded notebook". LINGORA is a vocabulary app, so the
// home screen borrows the vernacular of a language-learning notebook that's
// been checked by a teacher — spiral binding, ruled paper, red-pen marks,
// wax-stamp level badge, dog-eared flashcard corners, ticket-style coin redeem.
// ---------------------------------------------------------------------------

const INK = "#F0E9D8"; // cream ink on the cover
const PAPER = "#F1ECDD"; // parchment card face
const PAPER_INK = "#221B12"; // dark text on paper
const RED = "#D6303C"; // red pen
const RED_DARK = "#A82530";
const GOLD = "#E8B94E"; // highlighter / coins
const GREEN = "#4C9A6B"; // mastered / correct
const BLUE = "#6C8EBF"; // sentences

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
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#131B33]">
        <NotebookStyles />
        <div className="lg-stamp h-16 w-16 animate-spin rounded-full border-[3px] border-dashed border-[#E8B94E]" />
        <span className="font-mono text-[12px] font-semibold tracking-[4px] text-[#F0E9D8]/50">
          SAYFA AÇILIYOR…
        </span>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#131B33] text-[#F0E9D8]">
      <NotebookStyles />

      {/* Ambient study-lamp glow */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[34rem] -translate-x-1/2 rounded-full bg-[#D6303C]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-20 h-80 w-[22rem] rounded-full bg-[#E8B94E]/10 blur-3xl" />

      {/* Spiral binding strip */}
      <div className="lg-spiral relative z-10 h-5 w-full" />

      <div
        className={`relative z-10 mx-auto max-w-md px-5 pb-8 pt-5 transition-all duration-500 ${mounted ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
          }`}
      >
        {/* Header: notebook cover label + level stamp */}
        <div className="mb-6 flex items-center justify-between">
          <div className="lg-tape inline-flex items-center gap-2 px-3 py-1.5 font-mono text-[11px] font-bold tracking-[3px] text-[#221B12]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#D6303C]" />
            LINGORA
          </div>

          <div className="lg-stamp-badge flex h-16 w-16 flex-col items-center justify-center rounded-full text-center">
            <span className="font-serif text-xl font-black leading-none text-[#D6303C]">
              {userLevel}
            </span>
            <span className="mt-0.5 font-mono text-[8px] font-bold tracking-[1.5px] text-[#D6303C]/80">
              SEVİYE
            </span>
          </div>
        </div>

        {/* Dersler — table of contents */}
        <div className="mb-5">
          <SectionTitle emoji="📚" title="Dersler" />

          {lessonsLoading ? (
            <div className="space-y-2">
              <div className="h-16 w-full animate-pulse rounded-md bg-[#1C274A]" />
              <div className="h-16 w-full animate-pulse rounded-md bg-[#1C274A]" />
            </div>
          ) : recentLessons.length > 0 ? (
            <div className="lg-paper lg-dogear rounded-md p-2">
              {recentLessons.map((lesson, i) => {
                const isCompleted = lesson.progress?.completed;
                return (
                  <button
                    key={lesson.id}
                    onClick={() => onGoToLesson?.(lesson.id)}
                    className={`group flex w-full items-center gap-3 rounded px-2 py-2.5 text-left transition-colors hover:bg-[#221B12]/5 ${i !== recentLessons.length - 1
                        ? "border-b border-dashed border-[#221B12]/15"
                        : ""
                      }`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold ${isCompleted
                          ? "border-2 border-[#4C9A6B] text-[#4C9A6B]"
                          : "border-2 border-[#D6303C] text-[#D6303C]"
                        }`}
                    >
                      {isCompleted ? "✓" : lesson.lesson_number}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-[#221B12]">
                      {lesson.title}
                    </span>
                    <span className="mx-1 h-px flex-1 border-t border-dotted border-[#221B12]/25" />
                    <span
                      className={`shrink-0 font-mono text-[10px] font-bold tracking-wide ${isCompleted ? "text-[#4C9A6B]" : "text-[#221B12]/45"
                        }`}
                    >
                      {isCompleted ? "BİTTİ" : "DEVAM →"}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="lg-paper flex items-center justify-center gap-2 rounded-md py-6 text-sm text-[#221B12]/55">
              <span className="text-lg">📖</span>
              Henüz ders eklenmemiş
            </div>
          )}
        </div>

        {/* Progress — ruled page with red margin line */}
        <div className="lg-paper lg-ruled lg-dogear mb-4 rounded-md py-4 pl-7 pr-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="font-mono text-[11px] font-bold tracking-[2px] text-[#221B12]/50">
                KELİME HAZNEN
              </div>
              <div className="font-serif text-[28px] font-black leading-tight text-[#221B12]">
                {myWordsCount}
                <span className="text-[15px] font-semibold text-[#221B12]/35">
                  {" "}
                  / {totalWords}
                </span>
              </div>
            </div>
            <div className="lg-stamp-badge flex h-14 w-14 items-center justify-center rounded-full">
              <span className="font-mono text-[13px] font-black text-[#D6303C]">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#221B12]/10">
            <div
              className="h-full rounded-full bg-[#D6303C] transition-all duration-700"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

        {/* Coins — redeemable ticket */}
        <div className="lg-ticket relative mb-4 flex items-center justify-between rounded-md px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🪙</span>
            <span className="font-mono text-sm font-bold text-[#221B12]">
              {coins} COIN
            </span>
          </div>
          <span className="text-right text-[10.5px] leading-tight text-[#221B12]/55">
            Her 50 Coin
            <br />= 5 kelime / cümle
          </span>
        </div>

        {/* Coin redeem buttons */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          <button
            onClick={handleBuyWords}
            disabled={buying || coins < 50}
            className={`lg-dogear rounded-md bg-[#D6303C] py-3 text-center font-serif font-bold text-[#F0E9D8] shadow-lg shadow-[#D6303C]/20 transition-transform ${coins >= 50 ? "hover:scale-[1.02] active:scale-[0.98]" : "cursor-not-allowed opacity-40"
              }`}
          >
            <span className="block text-lg">📖</span>
            <span className="block text-sm">5 Kelime Al</span>
            <span className="block font-mono text-[10px] font-normal opacity-75">50 COIN</span>
          </button>
          <button
            onClick={handleBuySentences}
            disabled={buying || coins < 50}
            className={`lg-dogear rounded-md bg-[#6C8EBF] py-3 text-center font-serif font-bold text-[#F0E9D8] shadow-lg shadow-[#6C8EBF]/20 transition-transform ${coins >= 50 ? "hover:scale-[1.02] active:scale-[0.98]" : "cursor-not-allowed opacity-40"
              }`}
          >
            <span className="block text-lg">📝</span>
            <span className="block text-sm">5 Cümle Al</span>
            <span className="block font-mono text-[10px] font-normal opacity-75">50 COIN</span>
          </button>
        </div>

        {coins < 50 && (
          <div className="mb-4 rounded-md border border-dashed border-[#D6303C]/50 bg-[#D6303C]/10 px-4 py-2.5 text-center text-sm text-[#F5C6CA]">
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
        <div className="lg-paper lg-dogear mb-4 grid grid-cols-2 divide-x divide-dashed divide-[#221B12]/15 rounded-md py-3">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-lg opacity-80">📊</span>
            <span className="font-mono text-xl font-black text-[#221B12]">
              {Math.round(progress)}%
            </span>
            <span className="text-[11px] text-[#221B12]/50">Tamamlanma</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-lg opacity-80">⏳</span>
            <span className="font-mono text-xl font-black text-[#221B12]">
              {remainingWords}
            </span>
            <span className="text-[11px] text-[#221B12]/50">Kalan Kelime</span>
          </div>
        </div>

        {/* Summary bar */}
        <div className="flex items-center justify-around rounded-md border border-[#F0E9D8]/10 bg-[#1C274A] px-3 py-3">
          <SummaryItem color={GREEN} label="Kelime" value={dueCount} />
          <span className="h-6 w-px bg-[#F0E9D8]/10" />
          <SummaryItem color={BLUE} label="Cümle" value={dueSentenceCount} />
          <span className="h-6 w-px bg-[#F0E9D8]/10" />
          <SummaryItem color={GOLD} label="Toplam" value={dueCount + dueSentenceCount} />
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
      <span className="font-serif text-[15px] font-bold text-[#F0E9D8]">{title}</span>
      <svg width="46" height="10" viewBox="0 0 46 10" className="mt-1 opacity-70">
        <path
          d="M1 6 C 8 2, 14 9, 21 5 S 34 2, 45 6"
          stroke="#D6303C"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

function SummaryItem({ color, label, value }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[#F0E9D8]/55">{label}</span>
      <span className="font-mono font-bold text-[#F0E9D8]">{value}</span>
    </div>
  );
}

// Shared styles: fonts, spiral binding, paper texture, dog-ear fold, stamp badge.
function NotebookStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,800;9..144,900&family=JetBrains+Mono:wght@500;600;700&display=swap');

      .font-serif { font-family: 'Fraunces', ui-serif, Georgia, serif; }
      .font-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }

      .lg-spiral {
        background-image: radial-gradient(circle, #0B1024 3px, transparent 3px);
        background-size: 22px 20px;
        background-position: 11px 0;
        background-color: #0F1526;
      }

      .lg-tape {
        background: #F0E9D8;
        clip-path: polygon(3% 0, 100% 0, 97% 100%, 0 100%);
      }

      .lg-paper {
        background-color: ${PAPER};
        box-shadow: 0 6px 16px rgba(0,0,0,0.25);
      }

      .lg-ruled {
        border-left: 3px solid ${RED};
        background-image: repeating-linear-gradient(
          to bottom,
          transparent 0,
          transparent 27px,
          rgba(34,27,18,0.08) 28px
        );
      }

      .lg-dogear {
        position: relative;
      }
      .lg-dogear::after {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        width: 0;
        height: 0;
        border-style: solid;
        border-width: 0 16px 16px 0;
        border-color: transparent rgba(19,27,51,0.18) transparent transparent;
        border-top-right-radius: 2px;
      }

      .lg-stamp-badge {
        border: 2px dashed ${RED};
        background: ${PAPER};
        transform: rotate(-6deg);
        box-shadow: 0 4px 10px rgba(0,0,0,0.2);
      }

      .lg-ticket {
        background-color: ${PAPER};
        border: 1px dashed rgba(34,27,18,0.35);
        box-shadow: 0 6px 16px rgba(0,0,0,0.25);
      }
      .lg-ticket::before,
      .lg-ticket::after {
        content: '';
        position: absolute;
        top: 50%;
        width: 14px;
        height: 14px;
        background: #131B33;
        border-radius: 50%;
        transform: translateY(-50%);
      }
      .lg-ticket::before { left: -7px; }
      .lg-ticket::after { right: -7px; }
    `}</style>
  );
}