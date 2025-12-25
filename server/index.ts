// server/index.ts
import express from "express";
import cors from "cors";
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const app = express();

/**
 * Render sets PORT. Bind 0.0.0.0 so mobile devices/emulators can reach it.
 */
const PORT = Number(process.env.PORT || 3000);
const HOST = "0.0.0.0";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in server env vars."
  );
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Trust proxy so req.ip / secure cookies behave correctly behind Render proxy
app.set("trust proxy", 1);

app.use(express.json({ limit: "1mb" }));

/**
 * CORS: allow your web app + Capacitor origins.
 * You can also set CORS_ORIGINS="https://your-site.com,https://another.com"
 */
const extraOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const allowedOrigins = new Set<string>([
  "http://localhost",
  "http://localhost:5173",
  "http://localhost:3000",
  "https://localhost",
  "capacitor://localhost",
  "ionic://localhost",
  ...extraOrigins,
]);

app.use(
  cors({
    origin(origin, cb) {
      // Allow non-browser clients with no Origin (curl, some native stacks)
      if (!origin) return cb(null, true);
      if (allowedOrigins.has(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

function getBearerToken(req: express.Request): string | null {
  const header = req.headers.authorization;
  if (!header) return null;
  const [type, token] = header.split(" ");
  if (type?.toLowerCase() !== "bearer" || !token) return null;
  return token.trim();
}

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

/**
 * Optional sanity endpoint: should return 401 if no/invalid token.
 */
app.get("/api/account", async (req, res) => {
  const token = getBearerToken(req);
  if (!token) return res.status(401).json({ error: "Missing Authorization token" });

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  return res.status(200).json({ user_id: data.user.id, email: data.user.email });
});

/**
 * DELETE /api/account
 * Deletes all app data + deletes the Supabase auth user.
 *
 * Client must pass Authorization: Bearer <access_token>
 */
app.delete("/api/account", async (req, res) => {
  try {
    const token = getBearerToken(req);
    if (!token) return res.status(401).json({ error: "Missing Authorization token" });

    // Validate the token / get user id
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userData?.user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    const userId = userData.user.id;

    // Delete your app tables (add any other user-owned tables here)
    const deletes = [
      supabaseAdmin.from("pregnancy_appointments").delete().eq("user_id", userId),
      supabaseAdmin.from("pregnancy_logs").delete().eq("user_id", userId),
      supabaseAdmin.from("pregnancy_profiles").delete().eq("user_id", userId),
    ];

    const results = await Promise.all(deletes);
    const firstErr = results.find((r) => r.error)?.error;
    if (firstErr) {
      return res.status(500).json({ error: firstErr.message });
    }

    // Finally delete auth user
    const { error: delAuthErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (delAuthErr) {
      return res.status(500).json({ error: delAuthErr.message });
    }

    return res.status(204).send();
  } catch (e: any) {
    console.error("DELETE /api/account failed:", e);
    return res.status(500).json({ error: "Server error" });
  }
});

app.listen(PORT, HOST, () => {
  console.log(`Server listening on http://${HOST}:${PORT}`);
});
