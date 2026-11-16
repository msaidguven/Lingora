// src/components/Header/components/CoinDisplay.jsx
import { useState, useEffect } from "react";
import { supabase } from "../../../config.js";

// AuthContext'i kaldırdık, doğrudan user'ı props olarak alalım
export default function CoinDisplay({ userId }) {
  const [coins, setCoins] = useState(0);

  const fetchCoins = async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("en_users")
      .select("coins")
      .eq("id", userId)
      .single();
    if (data) setCoins(data.coins || 0);
  };

  useEffect(() => {
    fetchCoins();

    const handleCoinUpdate = (e) => {
      if (e.detail?.coins !== undefined) {
        setCoins(e.detail.coins);
      } else {
        fetchCoins();
      }
    };

    window.addEventListener('coinUpdated', handleCoinUpdate);
    return () => window.removeEventListener('coinUpdated', handleCoinUpdate);
  }, [userId]);

  return (
    <div className="flex shrink-0 items-center gap-1.5 rounded-md border border-dashed border-[var(--lg-gold)]/50 bg-[var(--lg-gold)]/15 px-2.5 py-1.5">
      <span className="text-[13px]" aria-hidden="true">🪙</span>
      <span className="min-w-3 text-center font-mono text-[12.5px] font-bold text-[var(--lg-gold)]">
        {coins}
      </span>
    </div>
  );
}