const SUPABASE_URL = 'https://cfgskqzmlfpftbwodgeh.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_1ai55JePV-irS5tt3j3Sfw_Dd1TqWQY';

export const supabaseConfigured = !SUPABASE_URL.includes('YOUR_PROJECT_ID')
  && !SUPABASE_PUBLISHABLE_KEY.includes('YOUR_SUPABASE_PUBLISHABLE_KEY');

export const supabase = supabaseConfigured && window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
  : null;
