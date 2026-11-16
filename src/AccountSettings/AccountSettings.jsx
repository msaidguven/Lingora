// src/AccountSettings/AccountSettings.jsx
// Hesap ekranı: çıkış, ilerlemeyi sıfırlama ve hesabı kalıcı silme.
// Google Play, hesap açılan uygulamalarda silmenin uygulama içinden yapılabilmesini şart koşar.
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { DOGEAR, SectionTitle, SpiralStrip, NotebookTheme } from "../theme/notebook";
import {
  getReminderPrefs,
  saveReminderPrefs,
  syncReminders,
  reminderPermission,
  requestReminderPermission,
  remindersSupported,
} from "../utils/reminders";

const pad = (n) => String(n).padStart(2, "0");

// Günlük hatırlatma ayarı (yalnızca mobil uygulamada).
function ReminderSettings({ card }) {
  const [prefs, setPrefs] = useState(getReminderPrefs);
  const [permission, setPermission] = useState("prompt");

  useEffect(() => {
    reminderPermission().then(setPermission);
  }, []);

  const apply = async (next) => {
    let perm = permission;
    if (next.enabled && perm !== "granted") {
      perm = await requestReminderPermission();
      setPermission(perm);
    }
    setPrefs(next);
    saveReminderPrefs(next);
    await syncReminders();
  };

  if (!remindersSupported) {
    return (
      <div className={card}>
        <p className="text-[13px] text-[var(--lg-ink-muted)]">
          📱 Günlük hatırlatma bildirimleri mobil uygulamada.
        </p>
      </div>
    );
  }

  const blocked = prefs.enabled && permission === "denied";
  return (
    <div className={card}>
      <label className="flex items-center justify-between gap-3">
        <span className="text-[13px] font-semibold text-[var(--lg-ink)]">Her gün hatırlat</span>
        <input
          type="checkbox"
          className="toggle toggle-sm"
          checked={prefs.enabled}
          onChange={(e) => apply({ ...prefs, enabled: e.target.checked })}
        />
      </label>
      {prefs.enabled && (
        <label className="mt-3 flex items-center justify-between gap-3">
          <span className="text-[13px] text-[var(--lg-ink-muted)]">Saat</span>
          <input
            type="time"
            className="rounded-md border border-[var(--lg-border-strong)] bg-[var(--lg-bg)] px-2 py-1 font-mono text-[14px] text-[var(--lg-ink)]"
            value={`${pad(prefs.hour)}:${pad(prefs.minute)}`}
            onChange={(e) => {
              const [h, m] = e.target.value.split(":").map(Number);
              if (!Number.isNaN(h) && !Number.isNaN(m)) apply({ ...prefs, hour: h, minute: m });
            }}
          />
        </label>
      )}
      <p className="mt-2 text-[11.5px] leading-snug text-[var(--lg-ink-muted)]">
        {blocked
          ? "Bildirim izni kapalı. Telefonun Ayarlar → Uygulamalar → Lingora → Bildirimler bölümünden açabilirsin."
          : "O gün zaten çalıştıysan hatırlatma gelmez."}
      </p>
    </div>
  );
}

const CONFIRM_WORD = "SİL";

export default function AccountSettings({ onBack, onOpenPlacement }) {
  const { user, logout, resetProgress, deleteAccount } = useAuth();
  const [busy, setBusy] = useState(null); // "reset" | "delete" | "logout" | null
  const [message, setMessage] = useState(null); // { kind: "ok" | "error", text }
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handleLogout = async () => {
    if (!window.confirm("Çıkış yapmak istediğinize emin misiniz?")) return;
    setBusy("logout");
    const result = await logout();
    setBusy(null);
    if (result.success) onBack?.();
    else setMessage({ kind: "error", text: "Çıkış yapılamadı. Tekrar deneyin." });
  };

  const handleReset = async () => {
    if (
      !window.confirm(
        "Öğrendiğin kelimeler, cümleler, ders ilerlemen ve istatistiklerin silinecek. Hesabın kalacak. Bu işlem geri alınamaz. Devam edilsin mi?"
      )
    )
      return;
    setBusy("reset");
    setMessage(null);
    const result = await resetProgress();
    setBusy(null);
    setMessage(
      result.success
        ? { kind: "ok", text: "İlerlemen sıfırlandı. Seviyen A1'e döndü." }
        : { kind: "error", text: "Sıfırlanamadı: " + result.error }
    );
  };

  const handleDelete = async () => {
    if (confirmText.trim().toLocaleUpperCase("tr-TR") !== CONFIRM_WORD) return;
    setBusy("delete");
    setMessage(null);
    const result = await deleteAccount();
    setBusy(null);
    if (result.success) {
      alert("Hesabın ve tüm verilerin silindi.");
      onBack?.();
    } else {
      setMessage({ kind: "error", text: "Hesap silinemedi: " + result.error });
    }
  };

  const card = `${DOGEAR} rounded-md border border-[var(--lg-border)] bg-[var(--lg-card)] p-4 shadow-sm`;
  const btn =
    "inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-[13px] font-bold transition-opacity disabled:opacity-50";

  return (
    <div className="lg-notebook relative min-h-screen overflow-hidden bg-[var(--lg-bg)] text-[var(--lg-ink)]">
      <NotebookTheme />
      <SpiralStrip />

      <div className="relative z-10 mx-auto max-w-md space-y-5 px-5 pb-8 pt-5">
        <button
          onClick={() => onBack?.()}
          className="inline-flex items-center gap-2 bg-[var(--lg-card)] px-3 py-1.5 font-mono text-[11px] font-bold tracking-[3px] text-[var(--lg-ink)] shadow-sm"
          style={{ clipPath: "polygon(3% 0, 100% 0, 97% 100%, 0 100%)" }}
        >
          <span aria-hidden>←</span> GERİ
        </button>

        <h1 className="font-serif text-2xl font-bold">Hesap ve Ayarlar</h1>

        {message && (
          <div
            role="status"
            className={`rounded-md border border-dashed px-3 py-2 text-[13px] ${
              message.kind === "ok"
                ? "border-[var(--lg-green,#3a7d44)] text-[var(--lg-green,#3a7d44)]"
                : "border-[var(--lg-red)] text-[var(--lg-red)]"
            }`}
          >
            {message.text}
          </div>
        )}

        <section>
          <SectionTitle emoji="👤" title="Hesap" />
          <div className={card}>
            <div className="text-[12px] text-[var(--lg-ink-muted)]">Giriş yapılan e-posta</div>
            <div className="mb-3 break-all font-mono text-[13px] font-bold">{user?.email}</div>
            <button
              className={`${btn} border border-dashed border-[var(--lg-border-strong)] text-[var(--lg-ink)]`}
              onClick={handleLogout}
              disabled={busy !== null}
            >
              <i className="ti ti-logout" /> {busy === "logout" ? "Çıkış yapılıyor…" : "Çıkış Yap"}
            </button>
          </div>
        </section>

        <section>
          <SectionTitle emoji="🔔" title="Hatırlatma" />
          <ReminderSettings card={card} />
        </section>

        {onOpenPlacement && (
          <section>
            <SectionTitle emoji="🧭" title="Bildiğim Kelimeler" />
            <div className={card}>
              <p className="mb-3 text-[13px] leading-relaxed text-[var(--lg-ink-muted)]">
                Kısa bir test çöz; doğru bildiğin kelimeler sana yeni kelime olarak gelmesin.
              </p>
              <button
                className={`${btn} border border-dashed border-[var(--lg-border-strong)] text-[var(--lg-ink)]`}
                onClick={onOpenPlacement}
                disabled={busy !== null}
              >
                <i className="ti ti-list-check" /> Bildiklerimi Atla
              </button>
            </div>
          </section>
        )}

        <section>
          <SectionTitle emoji="🧹" title="Verilerim" />
          <div className={card}>
            <p className="mb-3 text-[13px] leading-relaxed text-[var(--lg-ink-muted)]">
              Öğrendiğin kelimeleri, cümleleri, ders ilerlemeni ve istatistiklerini siler. Hesabın
              ve giriş bilgilerin kalır.
            </p>
            <button
              className={`${btn} border border-dashed border-[var(--lg-gold)] text-[var(--lg-ink)]`}
              onClick={handleReset}
              disabled={busy !== null}
            >
              <i className="ti ti-refresh" />
              {busy === "reset" ? "Sıfırlanıyor…" : "İlerlememi Sıfırla"}
            </button>
          </div>
        </section>

        <section>
          <SectionTitle emoji="⚠️" title="Hesabı Sil" />
          <div className={`${card} border-[var(--lg-red)]/50`}>
            <p className="mb-3 text-[13px] leading-relaxed text-[var(--lg-ink-muted)]">
              Hesabın, giriş bilgilerin ve tüm öğrenme verilerin kalıcı olarak silinir. Bu işlem
              geri alınamaz.
            </p>

            {!deleteOpen ? (
              <button
                className={`${btn} bg-[var(--lg-red)] text-white`}
                onClick={() => setDeleteOpen(true)}
                disabled={busy !== null}
              >
                <i className="ti ti-trash" /> Hesabımı Sil
              </button>
            ) : (
              <div className="space-y-2">
                <label className="block text-[12px] text-[var(--lg-ink)]">
                  Onaylamak için <b className="font-mono">{CONFIRM_WORD}</b> yaz:
                </label>
                <input
                  className="w-full rounded-md border border-[var(--lg-border-strong)] bg-[var(--lg-bg)] px-3 py-2 font-mono text-[14px] text-[var(--lg-ink)]"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  autoCapitalize="characters"
                  autoComplete="off"
                />
                <div className="flex gap-2">
                  <button
                    className={`${btn} border border-dashed border-[var(--lg-border-strong)] text-[var(--lg-ink)]`}
                    onClick={() => {
                      setDeleteOpen(false);
                      setConfirmText("");
                    }}
                    disabled={busy !== null}
                  >
                    Vazgeç
                  </button>
                  <button
                    className={`${btn} bg-[var(--lg-red)] text-white`}
                    onClick={handleDelete}
                    disabled={
                      busy !== null ||
                      confirmText.trim().toLocaleUpperCase("tr-TR") !== CONFIRM_WORD
                    }
                  >
                    {busy === "delete" ? "Siliniyor…" : "Kalıcı Olarak Sil"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
