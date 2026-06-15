import { createClient } from "@supabase/supabase-js";

// Vercel'de environment variables'ları oku
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://pwzbjhgrhkcdyowknmhe.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "SENIN_ANON_KEYIN";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log("🔧 Supabase URL:", SUPABASE_URL);