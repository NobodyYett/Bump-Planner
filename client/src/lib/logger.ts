// client/src/lib/logger.ts
//
// Production-safe logger that suppresses debug/info logs in production
// while preserving warn/error logs.

const isProd = import.meta.env.PROD;

const logger = {
  debug: (...args: unknown[]) => {
    if (!isProd) console.log(...args);
  },
  info: (...args: unknown[]) => {
    if (!isProd) console.info(...args);
  },
  warn: (...args: unknown[]) => {
    console.warn(...args);
  },
  error: (...args: unknown[]) => {
    console.error(...args);
  },
};

export default logger;