import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Supabase env vars missing. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY exist in the Vite build environment (.env) and are prefixed with VITE_."
  );
  throw new Error("Supabase env vars missing");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    detectSessionInUrl: true,  // Detects OAuth tokens in URL after redirect
    flowType: 'pkce',          // Required for Apple Sign-In (more secure)
    autoRefreshToken: true,    // Automatically refresh expired tokens
    persistSession: true,      // Persist session to localStorage
  }
});