// src/utils/reminders.js
// Günlük çalışma hatırlatması (telefonun kendi bildirimi; sunucu gerekmez).
// Her açılışta önümüzdeki 7 gün için bildirim kurulur; o gün çalışılmışsa o günün
// bildirimi iptal edilir. Yalnızca mobil uygulamada çalışır, web'de hiçbir şey yapmaz.
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

const NATIVE = Capacitor.isNativePlatform();
const PREFS_KEY = "lingora.reminder";
const ASKED_KEY = "lingora.reminder.asked";
const DEFAULTS = { enabled: true, hour: 20, minute: 0 };
const DAYS_AHEAD = 7;

const MESSAGES = [
  "Bugünkü kelimelerin seni bekliyor 📖",
  "Birkaç dakikalık tekrar, kalıcı İngilizce. Hadi başlayalım!",
  "Yeni cümleler ve tekrarların hazır 📝",
  "Bugün İngilizceye 5 dakika ayırır mısın?",
  "Tekrar zamanı! Öğrendiklerini unutmadan pekiştir.",
  "Lingora defterin açık, bir sayfa daha ekleyelim mi? ✏️",
  "Küçük adımlar büyük ilerleme getirir. Bugünkü tekrarına başla!",
];

// Bildirim kimliği tarihten türetilir (700000 + AAGG); böylece "bugünün bildirimi"
// her zaman aynı kimlikle bulunup iptal edilebilir.
const idFor = (date) => 700000 + (date.getMonth() + 1) * 100 + date.getDate();

export function getReminderPrefs() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(PREFS_KEY) || "{}") };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveReminderPrefs(prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // depolama kapalıysa ayar bu oturumla sınırlı kalır
  }
}

export const remindersSupported = NATIVE;

// İzin durumu: "granted" | "denied" | "prompt" | "unsupported"
export async function reminderPermission() {
  if (!NATIVE) return "unsupported";
  try {
    const { display } = await LocalNotifications.checkPermissions();
    return display === "granted" ? "granted" : display === "denied" ? "denied" : "prompt";
  } catch {
    return "unsupported";
  }
}

export async function requestReminderPermission() {
  if (!NATIVE) return "unsupported";
  try {
    const { display } = await LocalNotifications.requestPermissions();
    return display === "granted" ? "granted" : "denied";
  } catch {
    return "denied";
  }
}

async function cancelAll() {
  const ids = [];
  const d = new Date();
  for (let i = 0; i <= DAYS_AHEAD; i++) {
    const x = new Date(d);
    x.setDate(d.getDate() + i);
    ids.push({ id: idFor(x) });
  }
  await LocalNotifications.cancel({ notifications: ids }).catch(() => {});
}

// Hatırlatmaları ayarlara ve bugünkü duruma göre yeniden kurar.
// streakDays: geçerli seri; studiedToday: bugün en az bir soru çözüldü mü.
export async function syncReminders({ streakDays = 0, studiedToday = false } = {}) {
  if (!NATIVE) return;
  const prefs = getReminderPrefs();
  try {
    await cancelAll();
    if (!prefs.enabled) return;

    let perm = await reminderPermission();
    // İlk kez: izni bir kez sor (Android 13+ sistem penceresi). Reddedilirse bir daha sorma.
    if (perm === "prompt" && !localStorage.getItem(ASKED_KEY)) {
      localStorage.setItem(ASKED_KEY, "1");
      perm = await requestReminderPermission();
    }
    if (perm !== "granted") return;

    const now = new Date();
    const notifications = [];
    for (let i = 0; i < DAYS_AHEAD; i++) {
      const at = new Date(now);
      at.setDate(now.getDate() + i);
      at.setHours(prefs.hour, prefs.minute, 0, 0);
      if (i === 0 && (studiedToday || at <= now)) continue;
      const first = notifications.length === 0;
      const body = first && streakDays > 0
        ? `🔥 ${streakDays} günlük serin var! Bozulmasın, bugün birkaç soru çöz.`
        : MESSAGES[(at.getDate() + i) % MESSAGES.length];
      notifications.push({
        id: idFor(at),
        title: "Lingora",
        body,
        schedule: { at, allowWhileIdle: true },
        // Tam zamanlı alarm İSTEME: varsayılan (true) Android 12+'da her kurulumda
        // "Alarmlar ve hatırlatıcılar" ayar sayfasını açıyor; SCHEDULE_EXACT_ALARM
        // izni manifestten kaldırıldığı için izin verilemiyor, geri dönünce ana sayfa
        // tekrar kuruyor ve sayfa yine açılıyordu (1.0.3'teki döngü). Birkaç dakikalık
        // sapma günlük hatırlatma için sorun değil.
        isExactNotification: false,
      });
    }
    if (notifications.length) await LocalNotifications.schedule({ notifications });
  } catch (e) {
    console.error("Hatırlatma kurulamadı:", e);
  }
}

// Bugün çalışıldı: bugünün hatırlatmasını iptal et (oturum başına bir kez yeter).
let cancelledForDay = null;
export async function markStudiedToday() {
  if (!NATIVE) return;
  const today = new Date();
  const key = today.toDateString();
  if (cancelledForDay === key) return;
  cancelledForDay = key;
  await LocalNotifications.cancel({ notifications: [{ id: idFor(today) }] }).catch(() => {});
}
