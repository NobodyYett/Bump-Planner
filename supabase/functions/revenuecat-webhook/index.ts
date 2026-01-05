// supabase/functions/revenuecat-webhook/index.ts
// Handles RevenueCat webhook events to sync premium status
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const REVENUECAT_WEBHOOK_SECRET = Deno.env.get("REVENUECAT_WEBHOOK_SECRET");

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Events that grant premium access
const PREMIUM_GRANT_EVENTS = [
  "INITIAL_PURCHASE",
  "RENEWAL",
  "UNCANCELLATION",
  "NON_RENEWING_PURCHASE",
];

// Events that revoke premium access
const PREMIUM_REVOKE_EVENTS = [
  "CANCELLATION",
  "EXPIRATION",
  "BILLING_ISSUE",
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    // Optional: Verify webhook secret (recommended for production)
    if (REVENUECAT_WEBHOOK_SECRET) {
      const authHeader = req.headers.get("authorization");
      if (authHeader !== `Bearer ${REVENUECAT_WEBHOOK_SECRET}`) {
        console.error("[Webhook] Invalid authorization");
        return jsonResponse({ error: "Unauthorized" }, 401);
      }
    }

    const body = await req.json();
    
    // RevenueCat webhook payload structure
    const event = body?.event;
    const eventType = event?.type;
    const appUserId = event?.app_user_id;

    console.log(`[Webhook] Received event: ${eventType} for user: ${appUserId}`);

    if (!eventType || !appUserId) {
      console.error("[Webhook] Missing event type or app_user_id");
      return jsonResponse({ error: "Invalid payload" }, 400);
    }

    // Skip anonymous RevenueCat IDs (start with $RCAnonymousID)
    if (appUserId.startsWith("$RCAnonymousID")) {
      console.log("[Webhook] Skipping anonymous user");
      return jsonResponse({ success: true, message: "Skipped anonymous user" });
    }

    // Determine if this grants or revokes premium
    let isPremium: boolean | null = null;

    if (PREMIUM_GRANT_EVENTS.includes(eventType)) {
      isPremium = true;
    } else if (PREMIUM_REVOKE_EVENTS.includes(eventType)) {
      isPremium = false;
    }

    if (isPremium === null) {
      console.log(`[Webhook] Unhandled event type: ${eventType}`);
      return jsonResponse({ success: true, message: "Event type not handled" });
    }

    // Update the user's premium status
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        is_premium: isPremium,
        premium_updated_at: new Date().toISOString(),
      })
      .eq("id", appUserId);

    if (error) {
      console.error("[Webhook] Failed to update profile:", error.message);
      
      // If profile doesn't exist, try to create it
      if (error.code === "PGRST116") {
        const { error: insertError } = await supabaseAdmin
          .from("profiles")
          .insert({
            id: appUserId,
            is_premium: isPremium,
            premium_updated_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error("[Webhook] Failed to create profile:", insertError.message);
          return jsonResponse({ error: "Failed to update user" }, 500);
        }
      } else {
        return jsonResponse({ error: "Failed to update user" }, 500);
      }
    }

    console.log(`[Webhook] Updated user ${appUserId} premium status to: ${isPremium}`);
    return jsonResponse({ success: true, isPremium });

  } catch (e) {
    console.error("[Webhook] Unhandled error:", e);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
