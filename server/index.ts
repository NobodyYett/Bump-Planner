// server/index.ts (UPDATED, CLEAN VERSION)
//
// ✅ Works locally + on Render
// ✅ Uses process.env.PORT (required by Render)
// ✅ Handles EADDRINUSE gracefully (auto-tries next ports in dev)
// ✅ Doesn’t crash the server after sending an error response
// ✅ Trusts proxy headers (important on Render / reverse proxies)
// ✅ Graceful shutdown for SIGTERM (Render sends this on deploys)

import express, { type Request, Response, NextFunction } from "express";
import { serveStatic } from "./static";
import { createServer } from "http";

const app = express();
const httpServer = createServer(app);

// Render / proxies (enables correct req.ip / secure cookies behind proxy if you ever use them)
app.set("trust proxy", 1);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// Request logging for /api
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      log(logLine);
    }
  });

  next();
});

function startListening(initialPort: number) {
  const host = "0.0.0.0";
  const isProd = process.env.NODE_ENV === "production";

  let port = initialPort;
  const maxDevRetries = 10; // tries 5000..5009 in dev

  const attempt = () => {
    const onError = (err: any) => {
      if (err?.code === "EADDRINUSE") {
        if (isProd) {
          // In production we should fail fast so Render restarts correctly
          console.error(`Port ${port} is already in use. Exiting.`);
          process.exit(1);
        }

        const base = initialPort;
        const tries = port - base;
        if (tries < maxDevRetries) {
          console.warn(`Port ${port} in use, trying ${port + 1}...`);
          port += 1;
          attempt();
          return;
        }

        console.error(
          `Ports ${base}-${base + maxDevRetries - 1} are all in use. Stop the other server or set PORT.`,
        );
        process.exit(1);
      }

      console.error("Server listen error:", err);
      process.exit(1);
    };

    httpServer.once("error", onError);

    httpServer.listen({ port, host }, () => {
      // Clean up the error listener if we successfully started
      httpServer.off("error", onError);

      log(
        `serving on http://localhost:${port} (NODE_ENV=${process.env.NODE_ENV || "unknown"})`,
        "server",
      );
    });
  };

  attempt();
}

// Graceful shutdown (Render sends SIGTERM on deploy / restart)
function setupGracefulShutdown() {
  const shutdown = (signal: string) => {
    log(`Received ${signal}. Shutting down...`, "server");

    httpServer.close(() => {
      log("HTTP server closed.", "server");
      process.exit(0);
    });

    // Force close if something hangs
    setTimeout(() => {
      console.error("Force exiting after 10s shutdown timeout.");
      process.exit(1);
    }, 10_000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

(async () => {
  // Dynamic import AFTER dotenv has loaded (per your setup)
  const { registerRoutes } = await import("./routes");
  await registerRoutes(httpServer, app);

  // ✅ Return JSON 404 for any unknown /api routes
  // Prevents SPA fallback from serving index.html for missing API endpoints.
  app.use("/api", (_req, res) => {
    res.status(404).json({ message: "Not found" });
  });

  // ✅ Error handler (DO NOT throw after responding)
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err?.status || err?.statusCode || 500;
    const message = err?.message || "Internal Server Error";

    console.error("API Error:", err);

    if (res.headersSent) return;
    res.status(status).json({ message });
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  setupGracefulShutdown();

  // ✅ Render provides PORT; default to 5000 locally
  const port = Number(process.env.PORT) || 5000;
  startListening(port);
})();
