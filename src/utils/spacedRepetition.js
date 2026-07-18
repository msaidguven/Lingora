// utils/spacedRepetition.js
//
// SM-2 (SuperMemo-2) tekrar zamanlama algoritması. Kelime ve cümle quizleri
// aynı formülü paylaşıyor — formülü değiştirmen gerekirse tek yer burası.

const MIN_EASE_FACTOR = 1.3;
const DEFAULT_EASE_FACTOR = 2.5;
// ease_factor'a üst sınır koymuyoruz (SM-2'nin standart formülü bunu
// öngörmüyor); bunun yerine sonuç aralığını doğrudan tavana vuruyoruz.
// Anki gibi uygulamaların "maximum interval" ayarıyla aynı fikir: hangi
// ease_factor'a ulaşılırsa ulaşılsın, bir kelime/cümle en fazla bu kadar
// (~1,4 yıl) beklemeden tekrar gösterilir.
const MAX_INTERVAL_DAYS = 500;

// Doğru/yanlış'ı SM-2'nin beklediği 0-5 kalite puanına çeviriyoruz. Şu an
// ikili (doğru/yanlış) bir quiz olduğu için sabit bir eşleme kullanıyoruz:
// doğru → 5 (mükemmel), yanlış → 2 (eşik olan 3'ün altı, "fail").
// İleride quiz'e "ne kadar emindin?" gibi bir derece eklenirse, bu fonksiyon
// tek değişmesi gereken yer olur.
function qualityFromCorrectness(isCorrect) {
    return isCorrect ? 5 : 2;
}

/**
 * SM-2'ye göre bir sonraki tekrar zamanlamasını hesaplar.
 *
 * @param {object} params
 * @param {boolean} params.isCorrect
 * @param {number}  params.reviewCount   - önceki repetitions (review_count sütunu)
 * @param {number}  params.easeFactor    - önceki ease_factor
 * @param {string|Date|null} params.nextReviewAt   - önceki next_review_at (bu tekrarın vadesi)
 * @param {string|Date|null} params.lastReviewedAt - önceki last_reviewed_at
 * @param {Date}    [params.now] - test edilebilirlik için opsiyonel "şimdi"
 *
 * @returns {{ reviewCount: number, easeFactor: number, nextReviewAt: Date, intervalDays: number }}
 */
export function calculateNextReview({
    isCorrect,
    reviewCount = 0,
    easeFactor = DEFAULT_EASE_FACTOR,
    nextReviewAt = null,
    lastReviewedAt = null,
    now = new Date(),
}) {
    const quality = qualityFromCorrectness(isCorrect);
    const prevRepetitions = reviewCount || 0;
    const prevEase = easeFactor || DEFAULT_EASE_FACTOR;

    let repetitions;
    let intervalDays;

    if (quality < 3) {
        // Yanlış cevap: SM-2 kuralı gereği tekrar sayacı sıfırlanır,
        // kelime/cümle yakın zamanda tekrar gösterilir.
        // (mastery_level bundan tamamen bağımsız — bkz. calculateNextMasteryLevel,
        // orada kademeli -1 düşüş uygulanmaya devam ediyor.)
        repetitions = 0;
        intervalDays = 1;
    } else {
        if (prevRepetitions === 0) {
            intervalDays = 1;
        } else if (prevRepetitions === 1) {
            intervalDays = 6;
        } else {
            // Önceki aralığı, son iki tekrar arasındaki gerçek gün farkından
            // türetiyoruz — ayrı bir "interval" sütunu tutmuyoruz, ama
            // next_review_at ile last_reviewed_at farkı bunu zaten taşıyor.
            const prevIntervalDays = lastReviewedAt
                ? Math.max(
                    1,
                    Math.round((new Date(nextReviewAt) - new Date(lastReviewedAt)) / (1000 * 60 * 60 * 24))
                )
                : 1;
            intervalDays = Math.round(prevIntervalDays * prevEase);
        }
        repetitions = prevRepetitions + 1;
    }

    // Aralık tavanı: ease_factor sınırsız büyüse bile sonuç 500 günü geçmez.
    intervalDays = Math.min(intervalDays, MAX_INTERVAL_DAYS);

    // SM-2: ease factor güncellemesi (standart formül)
    let newEase = prevEase + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    newEase = Math.max(MIN_EASE_FACTOR, newEase);

    const nextReviewDate = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

    return {
        reviewCount: repetitions,
        easeFactor: newEase,
        nextReviewAt: nextReviewDate,
        intervalDays,
    };
}

/**
 * mastery_level rütbe sayacı — SM-2'den tamamen bağımsız bir oyunlaştırma
 * katmanı (şu an sadece en_user_words'te var, en_user_sentences'ta yok).
 * Doğru cevapta +1, yanlışta -1; 0-7 arasında sabitlenir (7 rütbe: Öğreniyor
 * → Bilgili → Bronz → Gümüş → Altın → Elmas → Efsane, her biri tam 1 seviye).
 */
export function calculateNextMasteryLevel(currentLevel, isCorrect) {
    const level = currentLevel || 0;
    return isCorrect ? Math.min(level + 1, 7) : Math.max(level - 1, 0);
}