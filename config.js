import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = 'https://pwzbjhgrhkcdyowknmhe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3emJqaGdyaGtjZHlvd2tubWhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyOTgwNTYsImV4cCI6MjA4MDg3NDA1Nn0.rCrirZxjXSNDO5R5NPur3ac_153Z4FIvd85jEz-uXKY';
    

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
