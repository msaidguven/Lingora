// src/QuizScreen.jsx
import QuizOptionButton from "./components/QuizOptionButton";
import BackButton from "./components/BackButton";

export default function QuizScreen({ onStartQuiz, onBack }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-base-100 text-base-content">
      {/* Ambient glow - HomeScreen ile aynı */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-80 w-[30rem] -translate-x-1/2 rounded-full bg-primary/25 blur-3xl [animation-duration:6s] animate-pulse" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-96 w-[26rem] rounded-full bg-accent/15 blur-3xl [animation-duration:7s] animate-pulse" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-5 py-7">
        {/* Başlık */}
        <div className="mb-10 text-center">
          <div className="mb-3 text-5xl">🎯</div>
          <h1 className="font-display text-[28px] font-extrabold">Quiz</h1>
          <p className="mt-1.5 text-sm text-base-content/55">
            Hangi quiz'e başlamak istersin?
          </p>
        </div>

        {/* Quiz seçenekleri */}
        <div className="flex w-full flex-col gap-3.5">
          <QuizOptionButton
            icon="📖"
            label="Kelime Çalış"
            subLabel="Kelime tekrarı ve öğrenme"
            gradient="from-indigo-500 to-purple-500"
            onClick={() => onStartQuiz("word")}
          />
          <QuizOptionButton
            icon="📝"
            label="Cümle Çalış"
            subLabel="Cümle tekrarı ve öğrenme"
            gradient="from-blue-500 to-indigo-500"
            onClick={() => onStartQuiz("sentence")}
          />

          <BackButton onClick={onBack} />
        </div>

        {/* Bilgi notu */}
        <div className="mt-10 max-w-[300px] text-center text-xs text-base-content/40">
          💡 Kelime ve cümle tekrarları spaced repetition yöntemi ile yapılır.
        </div>
      </div>
    </div>
  );
}