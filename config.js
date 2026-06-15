import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = 'https://hsdrpjgswsahtnmwobll.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_HMNycDbCD-n3kdoJAk_nxw_00IWbKWb';
    

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
