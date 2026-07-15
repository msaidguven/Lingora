// src/components/common/Toast.jsx
import { useEffect, useState } from 'react';

// Coin sesi çal
const playCoinSound = () => {
  try {
    const audio = new Audio('/sounds/coin.mp3');
    audio.volume = 0.5;
    audio.play().catch(() => {});
  } catch (e) {}
};

export default function Toast() {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const handleCoinUpdate = (e) => {
      const newCoins = e.detail?.coins;
      if (newCoins !== undefined) {
        setToast({
          message: `🪙 +1 Coin (${newCoins})`,
          type: 'success'
        });
        playCoinSound();
      }
    };

    window.addEventListener('coinUpdated', handleCoinUpdate);
    return () => window.removeEventListener('coinUpdated', handleCoinUpdate);
  }, []);

  // Toast'u otomatik kapat
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (!toast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] animate-slide-in-right">
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-success/95 text-white shadow-2xl backdrop-blur-sm border border-success/30 text-sm">
        <span className="text-base">🪙</span>
        <span className="font-semibold">{toast.message}</span>
      </div>
    </div>
  );
}