// src/services/adMob.js
//
// AdMob ödüllü reklam entegrasyonu (@capacitor-community/admob).
// Tek bir rewarded ad unit kullanılıyor; hangi hak türü için izlendiği
// (kelime/cümle) çağıran taraftan geliyor, AdMob'un kendisi bunu bilmiyor.
//
// Test sırasında Google'ın resmi test ad unit ID'lerini kullan — gerçek
// ID ile test etmek AdMob hesabını askıya aldırabilir.

import {
  AdMob,
  RewardAdPluginEvents,
} from "@capacitor-community/admob";

let initialized = false;

// TODO: Prod'a çıkmadan önce gerçek AdMob rewarded ad unit ID'ni buraya koy.
// Şimdilik Google'ın resmi test ID'si kullanılıyor.
const REWARDED_AD_UNIT_ID = import.meta.env.VITE_ADMOB_REWARDED_AD_UNIT_ID
  || "ca-app-pub-3940256099942544/5224354917"; // Google test ID

export async function initAdMob() {
  if (initialized) return;

  await AdMob.initialize({
    // Geliştirme sırasında true bırak, prod build'de env üzerinden kapat.
    testingDevices: [],
    initializeForTesting: import.meta.env.DEV,
  });

  initialized = true;
}

// Rewarded reklamı yükleyip gösterir. Kullanıcı ödülü hak ederse
// { rewarded: true } döner, reklamı yarıda kapatır/yüklenemezse
// { rewarded: false, reason: "..." } döner.
export async function showRewardedAd() {
  await initAdMob();

  return new Promise(async (resolve) => {
    let rewarded = false;

    const rewardListener = await AdMob.addListener(
      RewardAdPluginEvents.Rewarded,
      () => {
        rewarded = true;
      }
    );

    const dismissListener = await AdMob.addListener(
      RewardAdPluginEvents.Dismissed,
      async () => {
        await rewardListener.remove();
        await dismissListener.remove();
        await failListener.remove();
        resolve(rewarded ? { rewarded: true } : { rewarded: false, reason: "dismissed" });
      }
    );

    const failListener = await AdMob.addListener(
      RewardAdPluginEvents.FailedToLoad,
      async (error) => {
        await rewardListener.remove();
        await dismissListener.remove();
        await failListener.remove();
        resolve({ rewarded: false, reason: error?.message || "failed_to_load" });
      }
    );

    try {
      await AdMob.prepareRewardVideoAd({
        adId: REWARDED_AD_UNIT_ID,
        isTesting: import.meta.env.DEV,
      });
      await AdMob.showRewardVideoAd();
    } catch (error) {
      await rewardListener.remove();
      await dismissListener.remove();
      await failListener.remove();
      resolve({ rewarded: false, reason: error?.message || "show_failed" });
    }
  });
}