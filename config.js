import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = 'https://pwzbjhgrhkcdyowknmhe.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_cXSIkRvdM3hsu2ZIFjSYVQ_XRhlmng8';
    

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
