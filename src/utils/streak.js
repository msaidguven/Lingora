// src/utils/streak.js
// Seri sunucuda, çalışma kaydedildiğinde hesaplanır (bump_daily_stat). Ama kullanıcı
// günlerce çalışmazsa streak_days veritabanında eski değerinde kalır; ekranda doğru
// görünmesi için son çalışma gününe bakıp "şu an geçerli" seriyi burada çıkarıyoruz.
import { getTurkeyTodayString, getTurkeyDateNDaysAgoString } from "./turkeyDate";

export function effectiveStreak(row) {
  const days = row?.streak_days || 0;
  const last = row?.streak_last_date || null;
  const freezes = row?.streak_freezes || 0;
  const today = getTurkeyTodayString();

  if (!last || days <= 0) return { days: 0, studiedToday: false, freezes, usesFreeze: false };
  if (last === today) return { days, studiedToday: true, freezes, usesFreeze: false };
  if (last === getTurkeyDateNDaysAgoString(1)) return { days, studiedToday: false, freezes, usesFreeze: false };
  // Tek gün kaçırılmış: dondurma hakkı varsa bugün çalışınca seri korunur.
  if (last === getTurkeyDateNDaysAgoString(2) && freezes > 0) {
    return { days, studiedToday: false, freezes, usesFreeze: true };
  }
  return { days: 0, studiedToday: false, freezes, usesFreeze: false };
}
