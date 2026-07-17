// src/theme/notebook.jsx
// Paylaşılan "graded notebook" tasarım dili — hangi ekran kullanırsa kullansın
// (Anasayfa, İstatistikler, ...) aynı görünüm. Renkler light-dark() ile CSS
// değişkeni olarak tanımlanıyor (bkz. NotebookTheme), böylece daisyUI'nin
// light/dark temasını otomatik takip ediyor — hiçbir yerde sabit hex yok.

export const DOGEAR =
    "relative after:content-[''] after:absolute after:top-0 after:right-0 after:w-0 after:h-0 " +
    "after:border-t-[14px] after:border-l-[14px] after:border-t-[var(--lg-border-strong)] after:border-l-transparent";

export const DOGEAR_ON_COLOR =
    "relative after:content-[''] after:absolute after:top-0 after:right-0 after:w-0 after:h-0 " +
    "after:border-t-[14px] after:border-l-[14px] after:border-t-black/25 after:border-l-transparent";

// 1 dakikanın altında saniye, 60 dakikanın altında dakika, üstünde saat+dakika.
export function formatStudyDuration(totalSeconds) {
    if (!totalSeconds || totalSeconds < 60) return `${totalSeconds || 0} sn`;
    const totalMinutes = Math.round(totalSeconds / 60);
    if (totalMinutes < 60) return `${totalMinutes} dk`;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return minutes > 0 ? `${hours} sa ${minutes} dk` : `${hours} sa`;
}

export function SectionTitle({ emoji, title, right = null }) {
    return (
        <div className="mb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <span className="text-[15px]">{emoji}</span>
                <span className="font-serif text-[15px] font-bold text-[var(--lg-ink)]">{title}</span>
                <svg
                    width="46"
                    height="10"
                    viewBox="0 0 46 10"
                    className="mt-1 text-[var(--lg-red)] opacity-70"
                >
                    <path
                        d="M1 6 C 8 2, 14 9, 21 5 S 34 2, 45 6"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                    />
                </svg>
            </div>
            {right}
        </div>
    );
}

export function LegendDot({ colorVar, label, value }) {
    return (
        <div className="flex items-center gap-1.5 text-xs">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: colorVar }} />
            <span className="text-[var(--lg-ink-muted)]">{label}</span>
            <span className="font-mono font-bold text-[var(--lg-ink)]">{value}</span>
        </div>
    );
}

// Header'lardaki spiral cilt şeridi — sayfayı açan her ekranın en üstüne konur.
export function SpiralStrip() {
    return (
        <div
            className="relative z-10 h-5 w-full bg-[var(--lg-cover)] bg-[length:22px_20px] bg-[position:11px_0]"
            style={{
                backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.35) 3px, transparent 3px)",
            }}
        />
    );
}

// Sadece tipografi + renk değişkenleri burada özel — renklerin kendisi
// light-dark() ile daisyUI'nin color-scheme'ine bağlı, bu yüzden hangi
// daisyUI temasını seçersen seç otomatik uyum sağlıyor.
export function NotebookTheme() {
    return (
        <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,800;9..144,900&family=JetBrains+Mono:wght@500;600;700&display=swap');

      .lg-notebook {
        --lg-bg: light-dark(#F7F2E4, #131B33);
        --lg-card: light-dark(#FFFDF7, #1C2748);
        --lg-ink: light-dark(#241D12, #F0E9D8);
        --lg-ink-muted: light-dark(rgba(36,29,18,0.55), rgba(240,233,216,0.55));
        --lg-border: light-dark(rgba(36,29,18,0.14), rgba(240,233,216,0.12));
        --lg-border-strong: light-dark(rgba(36,29,18,0.28), rgba(240,233,216,0.22));
        --lg-rule: light-dark(rgba(36,29,18,0.09), rgba(240,233,216,0.09));

        /* sabit marka vurguları — logo rengi gibi, iki temada da aynı */
        --lg-cover: #1B2A4A;
        --lg-red: #D6303C;
        --lg-gold: #E8B94E;
        --lg-green: #4C9A6B;
        --lg-blue: #6C8EBF;
      }

      .font-serif { font-family: 'Fraunces', ui-serif, Georgia, serif; }
      .font-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
    `}</style>
    );
}