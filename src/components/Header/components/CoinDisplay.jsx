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
    <div className="flex shrink-0 items-center gap-1.5 rounded-xl border border-warning/25 bg-warning/10 px-2.5 py-2 transition-colors hover:bg-warning/15">
      <i className="ti ti-coin-filled text-[15px] text-yellow-400" aria-hidden="true" />
      <span className="min-w-3 text-center font-display text-[13px] font-bold text-yellow-400">
        {coins}
      </span>
    </div>
  );
}