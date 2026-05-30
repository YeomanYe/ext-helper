// Lightweight logger that suppresses noisy debug output in production builds.
// Why: shipping `console.log` in a published extension floods user devtools and
// triggers low-quality signals from store reviewers.
//
// Behavior:
//   - `logger.log`   — dev only (silent in production)
//   - `logger.warn`  — always (rare, intentional warnings)
//   - `logger.error` — always (users need to see real errors)
//
// Build-time env var detection:
//   - Vite preview build: import.meta.env.PROD === true in production
//   - Plasmo build:       process.env.NODE_ENV === "production"
//   - Test (vitest):      import.meta.env.MODE === "test" → log enabled

function isDevEnv(): boolean {
  // Vite/Plasmo both inject these; one of them is truthy in dev.
  // Use loose access — `import.meta.env` is set up via vite/plasmo plugins
  // but its typing varies across the dual-runtime build setup.
  try {
    const meta = import.meta as unknown as { env?: Record<string, unknown> }
    const env = meta?.env
    if (env) {
      if (env.MODE === "test") return true
      if (env.DEV === true) return true
      if (env.PROD === true) return false
    }
  } catch {
    // ignore
  }
  try {
    if (typeof process !== "undefined" && process.env?.NODE_ENV) {
      return process.env.NODE_ENV !== "production"
    }
  } catch {
    // ignore
  }
  // Default: assume production (safer to be quiet by default)
  return false
}

const DEV = isDevEnv()

export const logger = {
  log: (...args: unknown[]): void => {
    if (DEV) {
      // eslint-disable-next-line no-console
      console.log(...args)
    }
  },
  warn: (...args: unknown[]): void => {
    // eslint-disable-next-line no-console
    console.warn(...args)
  },
  error: (...args: unknown[]): void => {
    // eslint-disable-next-line no-console
    console.error(...args)
  },
}
