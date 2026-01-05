// supabase/functions/ask-ivy/index.ts
// Production-safe with: Auth, Server-side rate limits, Premium verification
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================
// Environment & Clients
// ============================================

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

// Auth client - validates user tokens
const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Admin client - for DB operations (bypasses RLS)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ============================================
// Constants
// ============================================

const DAILY_LIMIT_FREE = 2;
const DAILY_LIMIT_PREMIUM = 5;

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ============================================
// System Prompt (unchanged)
// ============================================

const systemPrompt = `
You are Ivy, a calm, kind pregnancy companion within the Bloom app. 
Your job is to:
- Offer emotional support, education, and reassurance.
- Explain things in simple, gentle language.
- ALWAYS remind the user you are NOT a doctor and cannot diagnose or give medical instructions.

SAFETY RULES (VERY IMPORTANT):
- You are NOT a medical provider.
- NEVER give exact medication doses, schedules, or "take X mg of Y".
- NEVER say a medication, supplement, herb, or treatment is "safe" or "unsafe" for THIS specific user.
- If the user asks directly "Is it safe to take X?" or about lab results, imaging, or specific medical decisions:
  - Give only very general information.
  - Tell them clearly they must confirm everything with their midwife/OB/doctor.
- If the situation sounds like an emergency (severe pain, heavy bleeding, trouble breathing, chest pain, passing out, thoughts of self-harm, etc.), 
  strongly urge them to contact emergency services or their doctor immediately.

Tone:
- Warm, validating, never scary.
- Avoid long essays; 2–4 short paragraphs is ideal.
- Include 1 short, gentle reassurance line when possible.
`.trim();

// ============================================
// Helpers
// ============================================

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function getTodayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

// Emergency detection (unchanged)
function isPotentialEmergency(question: string): boolean {
  const q = question.toLowerCase();

  const emergencyKeywords = [
    "heavy bleeding",
    "soaking a pad",
    "passing clots",
    "severe pain",
    "worst pain",
    "chest pain",
    "trouble breathing",
    "difficulty breathing",
    "shortness of breath",
    "can't breathe",
    "fainted",
    "passing out",
    "passed out",
    "seizure",
    "no movement",
    "can't feel baby",
    "reduced movements",
    "vision changes",
    "severe headache",
    "blurred vision",
    "suicidal",
    "kill myself",
    "self harm",
    "hurt myself",
  ];

  return emergencyKeywords.some((kw) => q.includes(kw));
}

// ============================================
// Auth Helper
// ============================================

async function validateAuth(req: Request): Promise<{ user: { id: string } } | null> {
  const authHeader = req.headers.get("authorization");
  
  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  const token = authHeader.slice(7); // Remove "Bearer "
  
  try {
    const { data: { user }, error } = await supabaseAuth.auth.getUser(token);
    
    if (error || !user) {
      console.error("[Auth] Token validation failed:", error?.message);
      return null;
    }
    
    return { user: { id: user.id } };
  } catch (e) {
    console.error("[Auth] Unexpected error:", e);
    return null;
  }
}

// ============================================
// Premium Check
// ============================================

async function checkPremiumStatus(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("is_premium")
      .eq("id", userId)
      .single();

    if (error) {
      // If profile doesn't exist or column missing, default to free
      console.log("[Premium] Could not fetch profile, defaulting to free:", error.message);
      return false;
    }

    return data?.is_premium === true;
  } catch (e) {
    console.error("[Premium] Unexpected error:", e);
    return false;
  }
}

// ============================================
// Usage Tracking
// ============================================

interface UsageResult {
  allowed: boolean;
  currentCount: number;
  limit: number;
  error?: string;
}

async function checkAndIncrementUsage(userId: string, isPremium: boolean): Promise<UsageResult> {
  const today = getTodayUTC();
  const limit = isPremium ? DAILY_LIMIT_PREMIUM : DAILY_LIMIT_FREE;

  try {
    // 1. Get current usage
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("ivy_ai_usage")
      .select("count")
      .eq("user_id", userId)
      .eq("date", today)
      .maybeSingle();

    if (fetchError) {
      console.error("[Usage] Fetch error:", fetchError.message);
      return { allowed: false, currentCount: 0, limit, error: "Could not check usage" };
    }

    const currentCount = existing?.count ?? 0;

    // 2. Check if at limit
    if (currentCount >= limit) {
      return { allowed: false, currentCount, limit };
    }

    // 3. Increment BEFORE calling OpenAI (upsert)
    const newCount = currentCount + 1;
    
    const { error: upsertError } = await supabaseAdmin
      .from("ivy_ai_usage")
      .upsert(
        {
          user_id: userId,
          date: today,
          count: newCount,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,date",
        }
      );

    if (upsertError) {
      console.error("[Usage] Upsert error:", upsertError.message);
      return { allowed: false, currentCount, limit, error: "Could not record usage" };
    }

    return { allowed: true, currentCount: newCount, limit };
  } catch (e) {
    console.error("[Usage] Unexpected error:", e);
    return { allowed: false, currentCount: 0, limit, error: "Usage tracking failed" };
  }
}

// ============================================
// Main Handler
// ============================================

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ========== 1. Validate Environment ==========
    if (!OPENAI_API_KEY) {
      console.error("[Config] Missing OPENAI_API_KEY");
      return jsonResponse(
        { answer: "Ivy is having trouble connecting right now. Please try again soon." },
        500
      );
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[Config] Missing Supabase environment variables");
      return jsonResponse(
        { answer: "Ivy is having trouble connecting right now. Please try again soon." },
        500
      );
    }

    // ========== 2. Method Check ==========
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    // ========== 3. Authentication (REQUIRED) ==========
    const authResult = await validateAuth(req);
    
    if (!authResult) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }
    
    const userId = authResult.user.id;

    // ========== 4. Parse Body ==========
    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return jsonResponse({ error: "Expected JSON body" }, 400);
    }

    const body = await req.json();

    const question: string | undefined = body?.question;
    if (!question || typeof question !== "string" || !question.trim()) {
      return jsonResponse({ error: "Missing question" }, 400);
    }

    // ========== 5. Emergency Check (before usage/OpenAI) ==========
    // Emergency responses do NOT consume quota - we want users to seek help freely
    if (isPotentialEmergency(question)) {
      const emergencyAnswer =
        "What you're describing could be serious. I'm only an educational companion, not a doctor, " +
        "and I can't safely tell you what to do in a situation like this.\n\n" +
        "Please contact your maternity unit, on-call doctor, or local emergency number **right away** " +
        "to get real-time medical advice. If you have severe pain, heavy bleeding, trouble breathing, " +
        "chest pain, feel like you might pass out, or have thoughts of harming yourself, " +
        "please seek urgent in-person care or call your local emergency services immediately.";

      return jsonResponse({ answer: emergencyAnswer }, 200);
    }

    // ========== 6. Check Premium Status ==========
    const isPremium = await checkPremiumStatus(userId);

    // ========== 7. Check & Increment Usage (BEFORE OpenAI) ==========
    const usageResult = await checkAndIncrementUsage(userId, isPremium);

    if (usageResult.error) {
      return jsonResponse(
        { answer: "Ivy couldn't track your question right now. Please try again in a moment." },
        500
      );
    }

    if (!usageResult.allowed) {
      // User has hit their daily limit
      const limitMessage = isPremium
        ? "You've asked your 5 questions for today. Ivy will be ready to chat again tomorrow! " +
          "In the meantime, remember your healthcare provider is always there for urgent questions. 💚"
        : "You've used your 2 free questions for today. " +
          "Upgrade to Bloom Premium for 5 questions daily, or Ivy will be back tomorrow! " +
          "For anything urgent, please reach out to your healthcare provider. 💚";

      return jsonResponse({ answer: limitMessage }, 200);
    }

    // ========== 8. Build Context from Memory ==========
    const memory = body?.memory ?? {};
    const {
      week,
      trimester,
      daysRemaining,
      babyName,
      babySex,
      dueDate,
      recentLogs = [],
    } = memory;

    let memoryText = "";

    if (week !== undefined) memoryText += `• Current week: ${week}\n`;
    if (trimester !== undefined) memoryText += `• Trimester: ${trimester}\n`;
    if (daysRemaining !== undefined) memoryText += `• Days remaining: ${daysRemaining}\n`;
    if (babyName) memoryText += `• Baby name: ${babyName}\n`;
    if (babySex) memoryText += `• Baby sex: ${babySex}\n`;
    if (dueDate) memoryText += `• Due date: ${dueDate}\n`;

    if (Array.isArray(recentLogs) && recentLogs.length > 0) {
      memoryText += `• Recent logs:\n`;
      for (const log of recentLogs) {
        memoryText += `   - ${log.date ?? "unknown date"}: mood=${log.mood ?? "unknown"}`;
        if (log.symptoms) memoryText += `, symptoms=${log.symptoms}`;
        if (log.notes) memoryText += `, notes=${log.notes}`;
        memoryText += `\n`;
      }
    }

    const finalSystemPrompt =
      systemPrompt +
      `\n\nUSER CONTEXT (do NOT repeat this text directly — just use it to guide your answer):\n${memoryText}\n`;

    // ========== 9. Call OpenAI ==========
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: finalSystemPrompt },
          { role: "user", content: question },
        ],
        temperature: 0.6,
        max_tokens: 350,
      }),
    });

    if (!openaiRes.ok) {
      // Log status but not full body (may contain sensitive info)
      console.error("[OpenAI] Request failed with status:", openaiRes.status);
      return jsonResponse(
        { answer: "Ivy couldn't answer right now. Please try again in a moment." },
        500
      );
    }

    const completion = await openaiRes.json();
    const answer =
      completion?.choices?.[0]?.message?.content?.trim() ??
      "Ivy answered, but something looked empty. Please try asking again.";

    return jsonResponse({ answer }, 200);
  } catch (e) {
    console.error("[ask-ivy] Unhandled error:", e);
    return jsonResponse(
      {
        answer:
          "Something went wrong on Ivy's side. Please try again in a little while, " +
          "and reach out to your healthcare provider for anything urgent.",
      },
      500
    );
  }
});