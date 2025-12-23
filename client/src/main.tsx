import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

import { App as CapApp } from "@capacitor/app";
import { supabase } from "./lib/supabase";

/**
 * Handles Supabase OAuth redirect URLs.
 * Works for both:
 * - PKCE flow: ...?code=...
 * - Implicit flow: ...#access_token=...&refresh_token=...
 */
async function handleSupabaseRedirectUrl(url: string) {
  try {
    const u = new URL(url);

    // PKCE: code in query string
    const code = u.searchParams.get("code");
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(url);
      if (error) console.error("exchangeCodeForSession error:", error);
      return;
    }

    // Implicit flow: tokens in hash
    const hashParams = new URLSearchParams(u.hash.replace(/^#/, ""));
    const access_token = hashParams.get("access_token");
    const refresh_token = hashParams.get("refresh_token");

    if (access_token) {
      const { error } = await supabase.auth.setSession({
        access_token,
        refresh_token: refresh_token || "",
      });
      if (error) console.error("setSession error:", error);
    }
  } catch (err) {
    console.error("handleSupabaseRedirectUrl failed:", err);
  }
}

// ✅ Native deep link handler (Android/iOS)
CapApp.addListener("appUrlOpen", async ({ url }) => {
  // Only handle YOUR auth callback
  if (!url?.startsWith("com.bumpplanner.app://")) return;
  if (!url.includes("auth/callback")) return;

  await handleSupabaseRedirectUrl(url);

  // Optional: clean routing in the webview after auth completes
  // (prevents being stuck on a blank route)
  window.history.replaceState({}, "", "/");
  window.dispatchEvent(new PopStateEvent("popstate"));
});

createRoot(document.getElementById("root")!).render(<App />);
