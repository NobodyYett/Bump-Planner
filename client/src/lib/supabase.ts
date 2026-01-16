import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Capacitor } from "@capacitor/core";
import logger from "./logger";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * Whether Supabase is properly configured.
 * When false, the app should show a configuration error screen.
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * List of missing environment variables (for error display)
 */
export const missingEnvVars: string[] = [];
if (!supabaseUrl) missingEnvVars.push("VITE_SUPABASE_URL");
if (!supabaseAnonKey) missingEnvVars.push("VITE_SUPABASE_ANON_KEY");

// Log error but DON'T throw - let the app show a proper error screen
if (!isSupabaseConfigured) {
  logger.error("Supabase environment variables are missing:", missingEnvVars);
}

// Check if running on native platform (iOS/Android)
const isNative = Capacitor.isNativePlatform();

logger.debug("Supabase init - isNativePlatform:", isNative);
logger.debug("Supabase init - flowType:", isNative ? "implicit" : "pkce");

// Create client only if configured, otherwise create a dummy that will fail gracefully
export const supabase: SupabaseClient = isSupabaseConfigured 
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        flowType: isNative ? "implicit" : "pkce",
        detectSessionInUrl: true,
        autoRefreshToken: true,
        persistSession: true,
      },
    })
  : createClient("https://placeholder.supabase.co", "placeholder-key");