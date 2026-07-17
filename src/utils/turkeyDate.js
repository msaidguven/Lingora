// src/utils/turkeyDate.js
// Tüm "gün" hesaplamalarını Türkiye saatine (Europe/Istanbul) sabitler —
// kullanıcının cihaz timezone'u ne olursa olsun gün, TR gece yarısında döner.
// en_user_daily_stats.stat_date bir `date` kolonu olduğu için burada da
// hep "YYYY-MM-DD" string üretiyoruz.

function formatInIstanbul(date) {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(date);
}

export function getTurkeyTodayString() {
    return formatInIstanbul(new Date());
}

export function getTurkeyDateNDaysAgoString(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return formatInIstanbul(d);
}

// Bugün dahil, son N günün tarih dizisini eskiden yeniye döner.
export function getLastNTurkeyDates(n) {
    const dates = [];
    for (let i = n - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(formatInIstanbul(d));
    }
    return dates;
}

const TR_DAY_LABELS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const TR_MONTH_LABELS = [
    "Oca", "Şub", "Mar", "Nis", "May", "Haz",
    "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara",
];

// "2026-07-17" -> "17 Tem"
export function formatShortTrDate(isoDate) {
    const [, m, d] = isoDate.split("-").map(Number);
    return `${d} ${TR_MONTH_LABELS[m - 1]}`;
}

// "2026-07-17" -> "Cum, 17 Tem"
export function formatWeekdayTrDate(isoDate) {
    const [y, m, d] = isoDate.split("-").map(Number);
    const dayIndex = (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7; // Pzt = 0
    return `${TR_DAY_LABELS[dayIndex]}, ${d} ${TR_MONTH_LABELS[m - 1]}`;
}