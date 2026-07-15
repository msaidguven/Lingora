import { useState, useEffect } from "react";
import { supabase } from "../../../config.js";
import { useAuth } from "../../../contexts/AuthContext.js";

export default function CoinDisplay() {
  const { user } = useAuth();
  const [coins, setCoins] = useState(0);

  const fetchCoins = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("en_users")
      .select("coins")
      .eq("id", user.id)
      .single();
    if (data) setCoins(data.coins || 0);
  };

  useEffect(() => {
    fetchCoins();
    
    // Coin güncellendiğinde yakala
    const handleCoinUpdate = (e) => {
      if (e.detail?.coins !== undefined) {
        setCoins(e.detail.coins);
      } else {
        fetchCoins();
      }
    };
    
    window.addEventListener('coinUpdated', handleCoinUpdate);
    return () => window.removeEventListener('coinUpdated', handleCoinUpdate);
  }, [user]);

  return (
    <div className="flex shrink-0 items-center gap-1.5 rounded-xl border border-warning/25 bg-warning/10 px-2.5 py-2 transition-colors hover:bg-warning/15">
      <i className="ti ti-coin-filled text-[15px] text-yellow-400" aria-hidden="true" />
      <span className="min-w-3 text-center font-display text-[13px] font-bold text-yellow-400">
        {coins}
      </span>
    </div>
  );
}