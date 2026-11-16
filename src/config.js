import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Eksik yapılandırmayla sessizce yanlış projeye bağlanmak yerine derlemede/açılışta net hata ver.
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY tanımlı değil (.env.local).");
}

// pkce: Google girişi dönüşte ?code= ile gelir; mobilde bu kod uygulamaya geri dönen
// bağlantıdan alınıp oturuma çevrilir (bkz. AuthContext → loginWithGoogle).
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { flowType: "pkce" },
});
