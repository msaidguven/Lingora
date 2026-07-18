// src/HomeScreen/NewItemsIntro.jsx
import { useState } from "react";
import { DOGEAR, NotebookTheme } from "../theme/notebook";

// Satın alınan yeni kelime/cümlelerin ilk tanıtım akışı. Bu ekran sadece
// GÖSTERİR — havuza ekleme (is_new = false yapma) işini `onFinish` yapıyor,
// o da viewModel'deki `finishIntro`'ya bağlı. Kullanıcı son karta gelip
// "Havuza Ekle"ye basmadan bu akıştan çıkış yolu yok; bilinçli bir tercih —
// tanıtımı yarım bırakıp kaçmasın diye.
export default function NewItemsIntro({ items, kind, onFinish }) {
    const [index, setIndex] = useState(0);
    const [revealed, setRevealed] = useState(false);
    const [finishing, setFinishing] = useState(false);

    if (!items || items.length === 0) return null;

    const item = items[index];
    const isLast = index === items.length - 1;
    const label = kind === "word" ? "Kelime" : "Cümle";

    const handleNext = async () => {
        if (!revealed) {
            setRevealed(true);
            return;
        }
        if (isLast) {
            setFinishing(true);
            await onFinish();
            setFinishing(false);
            return;
        }
        setIndex((i) => i + 1);
        setRevealed(false);
    };

    return (
        <div className="lg-notebook fixed inset-0 z-[2000] flex flex-col items-center justify-center bg-[var(--lg-bg)] px-6">
            <NotebookTheme />

            <div className="mb-6 font-mono text-[11px] font-bold tracking-[3px] text-[var(--lg-ink-muted)]">
                YENİ {label.toUpperCase()} · {index + 1} / {items.length}
            </div>

            <div
                className={`w-full max-w-sm rounded-md border border-[var(--lg-border)] bg-[var(--lg-card)] px-6 py-10 text-center shadow-xl ${DOGEAR}`}
            >
                <div className="mb-2 font-mono text-[11px] font-bold tracking-[2px] text-[var(--lg-ink-muted)]">
                    {kind === "word" ? "📖 KELİME" : "📝 CÜMLE"}
                </div>
                <div className="font-serif text-2xl font-black leading-snug text-[var(--lg-ink)]">
                    {item.front}
                </div>

                {revealed && (
                    <div className="mt-5 border-t border-dashed border-[var(--lg-border)] pt-5">
                        <div className="mb-1 font-mono text-[10px] font-bold tracking-[2px] text-[var(--lg-red)]">
                            {kind === "word" ? "ANLAMI" : "ÇEVİRİSİ"}
                        </div>
                        <div className="text-[17px] font-semibold text-[var(--lg-ink)]">{item.back}</div>
                    </div>
                )}
            </div>

            <div className="mt-6 w-full max-w-sm">
                {!revealed ? (
                    <button
                        onClick={handleNext}
                        className="w-full rounded-md bg-[var(--lg-blue)] py-3 font-serif font-bold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Göster
                    </button>
                ) : (
                    <button
                        onClick={handleNext}
                        disabled={finishing}
                        className="w-full rounded-md bg-[var(--lg-red)] py-3 font-serif font-bold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                    >
                        {finishing ? "Ekleniyor…" : isLast ? "✓ Öğrendim, Havuza Ekle" : "Sonraki →"}
                    </button>
                )}
            </div>

            <div className="mt-4 flex gap-1.5">
                {items.map((_, i) => (
                    <span
                        key={i}
                        className={`h-1.5 w-1.5 rounded-full transition-colors ${i === index ? "bg-[var(--lg-red)]" : "bg-[var(--lg-border-strong)]"
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}