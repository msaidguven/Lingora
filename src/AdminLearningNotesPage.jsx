// src/AdminLearningNotesPage.jsx
import { useEffect, useState, useCallback } from "react";
// AYARLAMAN GEREKEN TEK YER: projendeki supabase client'ının gerçek yolu.
// Örn: import { supabase } from "../lib/supabaseClient";
import { supabase } from "../lib/supabaseClient";
import { SectionTitle, DOGEAR, NotebookTheme, SpiralStrip } from "../theme/notebook";

// ---------------------------------------------------------------------------
// AMAÇ
// en_example_sentences tablosunda learning_notes alanı boş (null veya '{}')
// olan cümleleri 50'şerlik gruplar halinde çeker, bir AI prompt'u üretir.
// Bu prompt'u kopyalayıp bir yapay zekaya (Claude, ChatGPT vb.) yapıştırırsın,
// dönen JSON cevabını aşağıdaki kutuya yapıştırırsın, sayfa parse edip
// Supabase'e yazar. Yazma bitince otomatik bir sonraki 50'lik grubu çeker.
//
// TABLO VARSAYIMI: id (uuid), sentence_en, sentence_tr, level,
// learning_notes (text[], default '{}')
// ---------------------------------------------------------------------------

const BATCH_SIZE = 50;

const DEFAULT_INSTRUCTION = `Aşağıda İngilizce örnek cümleler var. Her cümle için "learning_notes" adında,
öğrenciye o cümleyi anlamada/öğrenmede yardımcı olacak KISA notlar üret:
- dikkat çekici gramer yapısı (varsa)
- zor/az bilinen kelime veya deyim açıklaması (varsa)
- telaffuz veya kullanım tuzağı (varsa)

Kurallar:
- Her cümle için 1 ile 3 arasında not üret, madde başına tek cümle, Türkçe yaz.
- Notlar kısa ve öz olsun, gereksiz tekrar yapma.
- Sadece aşağıdaki JSON formatında, başka hiçbir açıklama/metin eklemeden cevap ver:

[
  { "id": "cümlenin-id-değeri", "learning_notes": ["not 1", "not 2"] },
  ...
]

İşte cümleler:
`;

export default function AdminLearningNotesPage({ onBack }) {
    const [instruction, setInstruction] = useState(DEFAULT_INSTRUCTION);
    const [batch, setBatch] = useState([]);
    const [batchLoading, setBatchLoading] = useState(true);
    const [remainingCount, setRemainingCount] = useState(null);
    const [processedTotal, setProcessedTotal] = useState(0);

    const [pasteText, setPasteText] = useState("");
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState(null); // { type: 'success' | 'error', message }
    const [copied, setCopied] = useState(false);

    const fetchRemainingCount = useCallback(async () => {
        const { count, error } = await supabase
            .from("en_example_sentences")
            .select("id", { count: "exact", head: true })
            .or("learning_notes.is.null,learning_notes.eq.{}");
        if (!error) setRemainingCount(count ?? 0);
    }, []);

    const fetchNextBatch = useCallback(async () => {
        setBatchLoading(true);
        setStatus(null);
        setPasteText("");

        const { data, error } = await supabase
            .from("en_example_sentences")
            .select("id, sentence_en, sentence_tr, level")
            .or("learning_notes.is.null,learning_notes.eq.{}")
            .order("order_index", { ascending: true })
            .limit(BATCH_SIZE);

        if (error) {
            setStatus({ type: "error", message: `Grup çekilirken hata: ${error.message}` });
            setBatch([]);
        } else {
            setBatch(data ?? []);
        }
        setBatchLoading(false);
        fetchRemainingCount();
    }, [fetchRemainingCount]);

    useEffect(() => {
        fetchNextBatch();
    }, [fetchNextBatch]);

    const promptText = buildPrompt(instruction, batch);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(promptText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setStatus({ type: "error", message: "Kopyalama başarısız oldu, metni elle seçip kopyala." });
        }
    };

    const handleUpload = async () => {
        setStatus(null);
        let parsed;
        try {
            parsed = parseAiResponse(pasteText);
        } catch (err) {
            setStatus({ type: "error", message: `JSON okunamadı: ${err.message}` });
            return;
        }

        if (!Array.isArray(parsed) || parsed.length === 0) {
            setStatus({ type: "error", message: "Beklenen formatta bir JSON dizisi bulunamadı." });
            return;
        }

        const batchIds = new Set(batch.map((s) => s.id));
        const invalidRows = parsed.filter(
            (row) => !row || typeof row.id !== "string" || !batchIds.has(row.id) || !Array.isArray(row.learning_notes)
        );
        if (invalidRows.length > 0) {
            setStatus({
                type: "error",
                message: `${invalidRows.length} satır geçersiz (id bu grupta yok ya da learning_notes dizi değil). Yükleme yapılmadı, cevabı kontrol et.`,
            });
            return;
        }

        setSaving(true);
        const results = await Promise.all(
            parsed.map((row) =>
                supabase
                    .from("en_example_sentences")
                    .update({ learning_notes: row.learning_notes, updated_at: new Date().toISOString() })
                    .eq("id", row.id)
            )
        );
        setSaving(false);

        const failed = results.filter((r) => r.error);
        const successCount = parsed.length - failed.length;
        setProcessedTotal((prev) => prev + successCount);

        if (failed.length > 0) {
            setStatus({
                type: "error",
                message: `${successCount} kayıt güncellendi, ${failed.length} kayıt başarısız oldu: ${failed[0].error.message}`,
            });
        } else {
            setStatus({ type: "success", message: `${successCount} cümle güncellendi. Sıradaki grup çekiliyor…` });
            fetchNextBatch();
        }
    };

    return (
        <div className="lg-notebook relative min-h-screen bg-[var(--lg-bg)] text-[var(--lg-ink)]">
            <NotebookTheme />
            <SpiralStrip />

            <div className="relative z-10 mx-auto max-w-2xl px-5 pb-16 pt-6">
                <div className="mb-6 flex items-center justify-between">
                    <button
                        onClick={onBack}
                        className="font-mono text-[12px] font-semibold text-[var(--lg-ink-muted)] hover:text-[var(--lg-ink)]"
                    >
                        ← Geri
                    </button>
                    <div className="font-mono text-[11px] font-bold tracking-[3px] text-[var(--lg-red)]">
                        ADMIN · LEARNING NOTES
                    </div>
                </div>

                {/* Durum özeti */}
                <div className={`mb-5 flex items-center justify-between rounded-md border border-[var(--lg-border)] bg-[var(--lg-card)] px-4 py-3 ${DOGEAR}`}>
                    <div>
                        <div className="font-mono text-[10px] font-bold tracking-[2px] text-[var(--lg-ink-muted)]">
                            LEARNING_NOTES BOŞ OLAN CÜMLE
                        </div>
                        <div className="font-serif text-2xl font-black">
                            {remainingCount === null ? "…" : remainingCount}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="font-mono text-[10px] font-bold tracking-[2px] text-[var(--lg-ink-muted)]">
                            BU OTURUMDA GÜNCELLENEN
                        </div>
                        <div className="font-serif text-2xl font-black text-[var(--lg-green)]">{processedTotal}</div>
                    </div>
                </div>

                {batchLoading ? (
                    <div className="mb-5 flex items-center justify-center gap-2 rounded-md border border-[var(--lg-border)] bg-[var(--lg-card)] py-8 text-sm text-[var(--lg-ink-muted)]">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-dashed border-[var(--lg-red)]" />
                        Grup yükleniyor…
                    </div>
                ) : batch.length === 0 ? (
                    <div className="mb-5 rounded-md border border-dashed border-[var(--lg-green)] bg-[var(--lg-card)] px-4 py-6 text-center">
                        <div className="mb-1 text-2xl">✓</div>
                        <div className="font-serif text-[15px] font-bold">learning_notes boş olan cümle kalmadı</div>
                    </div>
                ) : (
                    <>
                        {/* 1) Talimat şablonu — düzenlenebilir */}
                        <div className="mb-5">
                            <SectionTitle emoji="1️⃣" title="Talimat şablonu (istersen düzenle)" />
                            <textarea
                                value={instruction}
                                onChange={(e) => setInstruction(e.target.value)}
                                rows={10}
                                className={`w-full rounded-md border border-[var(--lg-border)] bg-[var(--lg-card)] p-3 font-mono text-[12px] leading-relaxed text-[var(--lg-ink)] outline-none focus:border-[var(--lg-red)] ${DOGEAR}`}
                            />
                        </div>

                        {/* 2) Üretilen prompt + kopyala */}
                        <div className="mb-5">
                            <SectionTitle emoji="2️⃣" title={`Prompt (${batch.length} cümle) — kopyala, AI'ya yapıştır`} />
                            <div className={`relative rounded-md border border-[var(--lg-border)] bg-[var(--lg-card)] ${DOGEAR}`}>
                                <textarea
                                    readOnly
                                    value={promptText}
                                    rows={10}
                                    className="w-full resize-none bg-transparent p-3 font-mono text-[11.5px] leading-relaxed text-[var(--lg-ink-muted)] outline-none"
                                />
                                <button
                                    onClick={handleCopy}
                                    className="absolute right-3 top-3 rounded-full border border-[var(--lg-red)] bg-[var(--lg-card)] px-3 py-1 font-mono text-[10px] font-bold text-[var(--lg-red)] hover:opacity-80"
                                >
                                    {copied ? "Kopyalandı ✓" : "Kopyala"}
                                </button>
                            </div>
                        </div>

                        {/* 3) AI cevabını yapıştır */}
                        <div className="mb-3">
                            <SectionTitle emoji="3️⃣" title="AI'dan gelen JSON cevabını buraya yapıştır" />
                            <textarea
                                value={pasteText}
                                onChange={(e) => setPasteText(e.target.value)}
                                rows={10}
                                placeholder='[ { "id": "...", "learning_notes": ["...", "..."] }, ... ]'
                                className={`w-full rounded-md border border-[var(--lg-border)] bg-[var(--lg-card)] p-3 font-mono text-[12px] leading-relaxed text-[var(--lg-ink)] outline-none focus:border-[var(--lg-blue)] ${DOGEAR}`}
                            />
                        </div>

                        {status && (
                            <div
                                className={`mb-3 rounded border px-3 py-2 text-[12.5px] ${status.type === "error"
                                        ? "border-[var(--lg-red)]/40 bg-[var(--lg-red)]/5 text-[var(--lg-red)]"
                                        : "border-[var(--lg-green)]/40 bg-[var(--lg-green)]/5 text-[var(--lg-green)]"
                                    }`}
                            >
                                {status.message}
                            </div>
                        )}

                        <button
                            onClick={handleUpload}
                            disabled={saving || !pasteText.trim()}
                            className="w-full rounded-md bg-[var(--lg-red)] py-3 font-mono text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {saving ? "Kaydediliyor…" : `Bu ${batch.length} cümleyi kaydet ve sıradakini çek`}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

// ============ YARDIMCI FONKSİYONLAR ============

function buildPrompt(instruction, batch) {
    const sentencesBlock = batch
        .map((s) =>
            JSON.stringify({
                id: s.id,
                sentence_en: s.sentence_en,
                sentence_tr: s.sentence_tr ?? null,
                level: s.level ?? null,
            })
        )
        .join("\n");

    return `${instruction}\n${sentencesBlock}\n`;
}

// AI cevabı bazen ```json ... ``` bloğu içinde gelir, ya da başında/sonunda
// fazladan metin olabilir. Bu fonksiyon JSON dizisini güvenli şekilde çıkarır.
function parseAiResponse(text) {
    let cleaned = text.trim();
    cleaned = cleaned.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "");

    // Eğer hâlâ metnin başında/sonunda gürültü varsa, ilk [ ile son ] arasını al.
    const start = cleaned.indexOf("[");
    const end = cleaned.lastIndexOf("]");
    if (start !== -1 && end !== -1 && end > start) {
        cleaned = cleaned.slice(start, end + 1);
    }

    return JSON.parse(cleaned);
}