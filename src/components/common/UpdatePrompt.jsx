// components/common/UpdatePrompt.jsx
// Play Store'da yeni sürüm varsa kullanıcıya sorar ve uygulama içinden günceller
// (Google'ın uygulama içi güncelleme sistemi; Harita Strateji'dekiyle aynı akış):
// "Yeni sürüm var" → Güncelle → arka planda iner → "Yeniden başlat".
//
// Yalnızca Play Store'dan kurulmuş Android uygulamasında çalışır (kapalı test dahil).
// Web'de, elle kurulan ya da hata ayıklama sürümlerinde Play çağrıları hata verir;
// hepsi yutulur ve "güncelleme yok" sayılır.
import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import {
  AppUpdate,
  AppUpdateAvailability,
  FlexibleUpdateInstallStatus,
} from "@capawesome/capacitor-app-update";

const SUPPORTED = Capacitor.getPlatform() === "android";

export default function UpdatePrompt() {
  // null | "available" | "downloading" | "ready"
  const [stage, setStage] = useState(null);
  const [flexibleAllowed, setFlexibleAllowed] = useState(false);

  useEffect(() => {
    if (!SUPPORTED) return;
    let listener;
    let cancelled = false;

    (async () => {
      try {
        listener = await AppUpdate.addListener("onFlexibleUpdateStateChange", (state) => {
          if (state.installStatus === FlexibleUpdateInstallStatus.DOWNLOADED) setStage("ready");
        });
        const info = await AppUpdate.getAppUpdateInfo();
        if (cancelled) return;
        if (info.installStatus === FlexibleUpdateInstallStatus.DOWNLOADED) {
          setStage("ready"); // önceki açılışta inmiş, kurulmayı bekliyor
        } else if (info.updateAvailability === AppUpdateAvailability.UPDATE_AVAILABLE) {
          setFlexibleAllowed(info.flexibleUpdateAllowed === true);
          setStage("available");
        }
      } catch {
        // Play'den kurulmamış ya da Play erişilemiyor: sessizce geç.
      }
    })();

    return () => {
      cancelled = true;
      listener?.remove();
    };
  }, []);

  const update = async () => {
    if (!flexibleAllowed) {
      setStage(null);
      AppUpdate.openAppStore().catch(() => {});
      return;
    }
    setStage("downloading");
    try {
      await AppUpdate.startFlexibleUpdate();
    } catch {
      setStage(null); // kullanıcı Play penceresinde vazgeçti ya da başlatılamadı
    }
  };

  const restart = () => {
    AppUpdate.completeFlexibleUpdate().catch(() => {
      // Kurulamazsa kullanıcı Play Store'dan elle günceller.
      AppUpdate.openAppStore().catch(() => {});
    });
  };

  if (stage === "available") {
    return (
      <div className="modal modal-open" role="dialog" aria-modal="true">
        <div className="modal-box max-w-sm">
          <h3 className="text-lg font-bold">Yeni sürüm var</h3>
          <p className="py-3 text-sm opacity-80">
            Lingora'nın yeni sürümü Play Store'da. Şimdi güncellemek ister misin? İndirme arka
            planda sürer, çalışmaya devam edebilirsin.
          </p>
          <div className="modal-action">
            <button className="btn btn-ghost" onClick={() => setStage(null)}>Sonra</button>
            <button className="btn btn-primary" onClick={update}>Güncelle</button>
          </div>
        </div>
      </div>
    );
  }

  if (stage === "ready") {
    return (
      <div className="fixed inset-x-3 bottom-4 z-[9999] mx-auto flex max-w-md items-center justify-between gap-3 rounded-xl bg-neutral px-4 py-3 text-sm text-neutral-content shadow-2xl">
        <span>Yeni sürüm indirildi.</span>
        <button className="btn btn-primary btn-sm" onClick={restart}>Yeniden başlat</button>
      </div>
    );
  }

  return null;
}
