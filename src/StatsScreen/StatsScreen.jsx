// src/StatsScreen.jsx
import { useStatsViewModel } from "./viewModel";
import {
    DOGEAR,
    formatStudyDuration,
    SectionTitle,
    SpiralStrip,
    NotebookTheme,
} from "../theme/notebook";
import { formatShortTrDate, formatWeekdayTrDate } from "../utils/turkeyDate";

export default function StatsScreen({ onBack }) {
    const { loading, days, totals, rangeDays } = useStatsViewModel();

    if (loading) {
        return (
            <div className="lg-notebook flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--lg-bg)]">
                <NotebookTheme />
                <span className="h-14 w-14 animate-spin rounded-full border-[3px] border-dashed border-[var(--lg-red)]" />
                <span className="font-mono text-[12px] font-semibold tracking-[4px] text-[var(--lg-ink-muted)]">
                    İSTATİSTİKLER YÜKLENİYOR…
                </span>
            </div>
        );
    }

    const wordTotal = totals.wordCorrect + totals.wordWrong;
    const sentenceTotal = totals.sentenceCorrect + totals.sentenceWrong;
    const grandTotal = wordTotal + sentenceTotal;
    const grandCorrect = totals.wordCorrect + totals.sentenceCorrect;
    const accuracy = grandTotal > 0 ? Math.round((grandCorrect / grandTotal) * 100) : 0;

    // En son aktivitenin olduğu günler, en yeniden eskiye
    const activeDaysDesc = [...days].reverse().filter(
        (d) => d.wordCorrect + d.wordWrong + d.sentenceCorrect + d.sentenceWrong > 0
    );

    return (
        <div className="lg-notebook relative min-h-screen overflow-hidden bg-[var(--lg-bg)] text-[var(--lg-ink)]">
            <NotebookTheme />

            <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[34rem] -translate-x-1/2 rounded-full bg-[var(--lg-red)]/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 -right-20 h-80 w-[22rem] rounded-full bg-[var(--lg-gold)]/10 blur-3xl" />

            <SpiralStrip />

            <div className="relative z-10 mx-auto max-w-md px-5 pb-8 pt-5">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <button
                        onClick={() => onBack?.()}
                        className="inline-flex items-center gap-2 bg-[var(--lg-card)] px-3 py-1.5 font-mono text-[11px] font-bold tracking-[3px] text-[var(--lg-ink)] shadow-sm"
                        style={{ clipPath: "polygon(3% 0, 100% 0, 97% 100%, 0 100%)" }}
                    >
                        <span aria-hidden>←</span> GERİ
                    </button>

                    <div className="flex h-16 w-16 -rotate-6 flex-col items-center justify-center rounded-full border-2 border-dashed border-[var(--lg-red)] bg-[var(--lg-card)] text-center shadow-sm">
                        <span className="font-serif text-xl font-black leading-none text-[var(--lg-red)]">
                            {totals.activeDays}
                        </span>
                        <span className="mt-0.5 font-mono text-[8px] font-bold tracking-[1.5px] text-[var(--lg-red)]/80">
                            / {rangeDays} GÜN
                        </span>
                    </div>
                </div>

                <h1 className="mb-5 font-serif text-2xl font-black text-[var(--lg-ink)]">
                    📊 Son {rangeDays} Gün
                </h1>

                {/* Özet — kelime & cümle toplamları */}
                <div className={`mb-5 rounded-md border border-[var(--lg-border)] bg-[var(--lg-card)] ${DOGEAR}`}>
                    <div className="flex items-center justify-between border-b border-dashed border-[var(--lg-border)] px-3 py-2">
                        <span className="font-serif text-[14px] font-bold text-[var(--lg-ink)]">Özet</span>
                        <span className="flex items-center gap-1 font-mono text-[11px] font-semibold text-[var(--lg-ink-muted)]">
                            ⏱ {formatStudyDuration(totals.studySeconds)}
                        </span>
                    </div>
                    <div className="flex divide-x divide-dashed divide-[var(--lg-border)]">
                        <RangeStatCard icon="📖" label="Kelime" correct={totals.wordCorrect} wrong={totals.wordWrong} />
                        <RangeStatCard icon="📝" label="Cümle" correct={totals.sentenceCorrect} wrong={totals.sentenceWrong} />
                    </div>
                    <div className="flex items-center justify-between border-t border-dashed border-[var(--lg-border)] px-3 py-2 font-mono text-[11px] text-[var(--lg-ink-muted)]">
                        <span>
                            Toplam <span className="font-bold text-[var(--lg-ink)]">{grandTotal}</span> deneme
                        </span>
                        <span>
                            Genel doğruluk <span className="font-bold text-[var(--lg-ink)]">%{accuracy}</span>
                        </span>
                    </div>
                </div>

                {/* Günlük aktivite grafiği */}
                <div className="mb-5">
                    <SectionTitle emoji="📈" title="Günlük Aktivite" />
                    <div className={`overflow-x-auto rounded-md border border-[var(--lg-border)] bg-[var(--lg-card)] p-3 ${DOGEAR}`}>
                        <ActivityChart days={days} />
                    </div>
                    <div className="mt-2 flex items-center justify-center gap-4 text-[11px] text-[var(--lg-ink-muted)]">
                        <span className="flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-[var(--lg-green)]" /> Doğru
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-[var(--lg-red)]" /> Yanlış
                        </span>
                    </div>
                </div>

                {/* Günlük kayıtlar — özet kartı tarzında */}
                <div className="mb-4">
                    <SectionTitle emoji="🗓️" title="Günlük Kayıtlar" />

                    {activeDaysDesc.length > 0 ? (
                        <div className="space-y-3">
                            {activeDaysDesc.map((d) => {
                                const dayTotal = d.wordCorrect + d.wordWrong + d.sentenceCorrect + d.sentenceWrong;
                                const dayCorrect = d.wordCorrect + d.sentenceCorrect;
                                const dayWrong = d.wordWrong + d.sentenceWrong;
                                const dayAccuracy = dayTotal > 0 ? Math.round((dayCorrect / dayTotal) * 100) : 0;
                                const correctPct = dayTotal > 0 ? (dayCorrect / dayTotal) * 100 : 0;
                                const wrongPct = dayTotal > 0 ? (dayWrong / dayTotal) * 100 : 0;

                                return (
                                    <div
                                        key={d.date}
                                        className={`rounded-md border border-[var(--lg-border)] bg-[var(--lg-card)] ${DOGEAR}`}
                                    >
                                        {/* Tarih ve süre */}
                                        <div className="flex items-center justify-between border-b border-dashed border-[var(--lg-border)] px-3 py-2">
                                            <span className="font-mono text-[11px] font-bold text-[var(--lg-ink)]">
                                                {formatWeekdayTrDate(d.date)}
                                            </span>
                                            <span className="font-mono text-[10.5px] text-[var(--lg-ink-muted)]">
                                                ⏱ {formatStudyDuration(d.studySeconds)}
                                            </span>
                                        </div>

                                        {/* İçerik */}
                                        <div className="flex divide-x divide-dashed divide-[var(--lg-border)]">
                                            <DayStatCard
                                                icon="📖"
                                                label="Kelime"
                                                correct={d.wordCorrect}
                                                wrong={d.wordWrong}
                                            />
                                            <DayStatCard
                                                icon="📝"
                                                label="Cümle"
                                                correct={d.sentenceCorrect}
                                                wrong={d.sentenceWrong}
                                            />
                                        </div>

                                        {/* Alt bilgi - toplam ve doğruluk */}
                                        <div className="flex items-center justify-between border-t border-dashed border-[var(--lg-border)] px-3 py-2 font-mono text-[10.5px] text-[var(--lg-ink-muted)]">
                                            <span>
                                                <span className="font-bold text-[var(--lg-ink)]">{dayTotal}</span> deneme
                                            </span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[var(--lg-green)]">✓ {dayCorrect}</span>
                                                <span className="text-[var(--lg-red)]">✗ {dayWrong}</span>
                                                <span className="font-bold text-[var(--lg-ink)]">%{dayAccuracy}</span>
                                            </div>
                                        </div>

                                        {/* Doğruluk çubuğu */}
                                        <div className="h-1 w-full overflow-hidden rounded-b-md bg-[var(--lg-border-strong)]">
                                            <div className="h-full bg-[var(--lg-green)]" style={{ width: `${correctPct}%` }} />
                                            <div className="h-full bg-[var(--lg-red)]" style={{ width: `${wrongPct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-2 rounded-md border border-[var(--lg-border)] bg-[var(--lg-card)] py-6 text-sm text-[var(--lg-ink-muted)]">
                            <span className="text-lg">📭</span>
                            Son {rangeDays} günde kayıt yok. Çalışmaya başla!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ============ ALT BİLEŞENLER ============

// 30 günlük toplamı vurgulayan kart — büyük toplam sayı, altında ✓/✗ ve
// oran çubuğu. Anasayfadaki günlük hedef kartıyla aynı dil, sadece hedef
// yerine dönemin toplamını gösteriyor.
function RangeStatCard({ icon, label, correct, wrong }) {
    const total = correct + wrong;
    const correctPct = total > 0 ? (correct / total) * 100 : 0;
    const wrongPct = total > 0 ? (wrong / total) * 100 : 0;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    return (
        <div className="flex-1 px-3 py-2.5">
            <div className="mb-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-[var(--lg-ink)]">
                <span>{icon}</span>
                {label}
            </div>
            <div className="mb-1.5 flex items-baseline gap-1">
                <span className="font-mono text-[26px] font-black leading-none text-[var(--lg-ink)]">
                    {total}
                </span>
                <span className="font-mono text-[11px] font-semibold text-[var(--lg-ink-muted)]">deneme</span>
            </div>
            <div className="mb-1.5 flex h-2 w-full overflow-hidden rounded-full bg-[var(--lg-border-strong)]">
                <div className="h-full bg-[var(--lg-green)]" style={{ width: `${correctPct}%` }} />
                <div className="h-full bg-[var(--lg-red)]" style={{ width: `${wrongPct}%` }} />
            </div>
            <div className="flex items-center gap-3 font-mono text-[10.5px]">
                <span className="text-[var(--lg-green)]">✓ {correct}</span>
                <span className="text-[var(--lg-red)]">✗ {wrong}</span>
                <span className="ml-auto text-[var(--lg-ink-muted)]">%{accuracy}</span>
            </div>
        </div>
    );
}

// Günlük kayıtlar için küçük istatistik kartı
function DayStatCard({ icon, label, correct, wrong }) {
    const total = correct + wrong;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    return (
        <div className="flex-1 px-3 py-2">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--lg-ink)]">
                <span>{icon}</span>
                {label}
            </div>
            <div className="mt-0.5 flex items-baseline gap-1">
                <span className="font-mono text-[18px] font-bold leading-none text-[var(--lg-ink)]">
                    {total}
                </span>
                <span className="font-mono text-[9px] text-[var(--lg-ink-muted)]">den</span>
            </div>
            <div className="mt-0.5 flex gap-2 font-mono text-[9.5px]">
                <span className="text-[var(--lg-green)]">✓{correct}</span>
                <span className="text-[var(--lg-red)]">✗{wrong}</span>
                <span className="ml-auto text-[var(--lg-ink-muted)]">%{accuracy}</span>
            </div>
        </div>
    );
}

// 30 sütunluk çubuk grafik. Her sütun kelime+cümle toplamını temsil ediyor,
// yeşil (doğru) altta, kırmızı (yanlış) üstte yığılı. Dar ekranlarda yatay
// kaydırma ile açılıyor.
function ActivityChart({ days }) {
    const maxTotal = Math.max(
        1,
        ...days.map((d) => d.wordCorrect + d.wordWrong + d.sentenceCorrect + d.sentenceWrong)
    );

    return (
        <div className="flex h-32 min-w-[620px] items-end gap-[3px]">
            {days.map((d, i) => {
                const total = d.wordCorrect + d.wordWrong + d.sentenceCorrect + d.sentenceWrong;
                const correct = d.wordCorrect + d.sentenceCorrect;
                const wrong = d.wordWrong + d.sentenceWrong;
                const totalPct = (total / maxTotal) * 100;
                const correctPct = total > 0 ? (correct / total) * totalPct : 0;
                const wrongPct = total > 0 ? (wrong / total) * totalPct : 0;
                const showLabel = i % 5 === 0 || i === days.length - 1;

                return (
                    <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                        <div
                            className="flex h-24 w-full flex-col-reverse overflow-hidden rounded-[2px] bg-[var(--lg-border)]"
                            title={`${formatShortTrDate(d.date)}: ${total} deneme`}
                        >
                            <div className="w-full bg-[var(--lg-green)]" style={{ height: `${correctPct}%` }} />
                            <div className="w-full bg-[var(--lg-red)]" style={{ height: `${wrongPct}%` }} />
                        </div>
                        <span className="h-3 font-mono text-[8px] text-[var(--lg-ink-muted)]">
                            {showLabel ? formatShortTrDate(d.date) : ""}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}