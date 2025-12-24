import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { createClient } from "@supabase/supabase-js";

// Extend Request type to include userId
declare module "express-serve-static-core" {
  interface Request {
    userId?: string;
  }
}

/**
 * Admin Supabase client (lazy):
 * IMPORTANT: For server-side admin actions, prefer SUPABASE_URL over VITE_SUPABASE_URL.
 * VITE_ vars are meant for client builds; using them on the server can hide misconfig.
 */
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Optional fallback (only if you really want it)
const FALLBACK_URL = process.env.VITE_SUPABASE_URL || "";
const EFFECTIVE_URL = SUPABASE_URL || FALLBACK_URL;

let supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin() {
  if (supabaseAdmin) return supabaseAdmin;

  if (!EFFECTIVE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;

  supabaseAdmin = createClient(EFFECTIVE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return supabaseAdmin;
}

/**
 * Verify the bearer token and attach the userId (using admin getUser).
 */
async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const admin = getSupabaseAdmin();

  if (!admin) {
    return res.status(501).json({
      message:
        "Account deletion is not configured (missing SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY).",
    });
  }

  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing bearer token" });
  }

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) return res.status(401).json({ message: "Missing bearer token" });

  const { data, error } = await admin.auth.getUser(token);

  if (error || !data?.user?.id) {
    // 🔥 This log tells us the real reason on Render logs
    console.error("[/api/account] auth.getUser failed:", {
      message: error?.message,
      status: (error as any)?.status,
      effectiveUrl: EFFECTIVE_URL ? `${EFFECTIVE_URL.slice(0, 25)}...` : "(missing)",
      hasServiceRoleKey: Boolean(SUPABASE_SERVICE_ROLE_KEY),
    });

    // If this looks like a server config issue, return 500 (not 401)
    const msg = error?.message?.toLowerCase() || "";
    const looksLikeConfig =
      msg.includes("invalid api key") ||
      msg.includes("bad jwt") ||
      msg.includes("signature") ||
      msg.includes("jwks") ||
      msg.includes("audience");

    return res
      .status(looksLikeConfig ? 500 : 401)
      .json({ message: looksLikeConfig ? "Server auth config error" : "Unauthorized or invalid token" });
  }

  req.userId = data.user.id;
  next();
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  app.delete("/api/account", requireAuth, async (req, res) => {
    const admin = getSupabaseAdmin();
    if (!admin) {
      return res.status(501).json({
        message:
          "Account deletion is not configured (missing SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY).",
      });
    }

    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: "User context missing" });

    try {
      // Delete user data from tables
      const logs = await admin.from("pregnancy_logs").delete().eq("user_id", userId);
      if (logs.error) return res.status(500).json({ message: logs.error.message });

      const appts = await admin.from("pregnancy_appointments").delete().eq("user_id", userId);
      if (appts.error) return res.status(500).json({ message: appts.error.message });

      const profile = await admin.from("pregnancy_profiles").delete().eq("user_id", userId);
      if (profile.error) return res.status(500).json({ message: profile.error.message });

      // Delete auth user (admin only)
      const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
      if (deleteError) return res.status(500).json({ message: deleteError.message });

      return res.json({ message: "Account deleted successfully" });
    } catch (err) {
      console.error("Error deleting account:", err);
      return res.status(500).json({ message: "Failed to delete account" });
    }
  });

  return httpServer;
}
