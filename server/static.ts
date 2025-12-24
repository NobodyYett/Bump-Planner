// server/static.ts
import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Manually define __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function serveStatic(app: Express) {
  // dist/public from project root
  const distPath = path.resolve(__dirname, "..", "dist", "public");
  const indexHtml = path.join(distPath, "index.html");

  if (!fs.existsSync(indexHtml)) {
    throw new Error(
      `Could not find the build output: ${indexHtml}\n` +
        `distPath: ${distPath}\n` +
        `__dirname: ${__dirname}\n` +
        `Did Render run: npm run build:web ?`,
    );
  }

  // Serve static assets FIRST
  app.use(
    express.static(distPath, {
      index: false, // do not auto-serve index.html
      maxAge: "1y",
      immutable: true,
    }),
  );

  // SPA fallback (but NEVER hijack /api or /assets)
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    if (req.path.startsWith("/assets")) return next();
    res.sendFile(indexHtml);
  });
}
