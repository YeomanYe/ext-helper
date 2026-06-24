import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// Regression guard for the P0 privacy fix: `logger.log` MUST be silent in
// production builds. Several sites (aiProvider, siteRecommendationService,
// background) log AI raw responses that can contain the user's installed
// extension list + visited URLs. Those were migrated from bare `console.log`
// to `logger.log`; this suite locks in that they never reach the console in a
// production build, while warn/error always do.
//
// `logger.ts` reads the env once at module-load time (`const DEV = isDevEnv()`),
// so each scenario resets modules and re-imports after stubbing the env.

async function loadLoggerWith(env: Record<string, unknown>) {
  vi.resetModules()
  for (const [key, value] of Object.entries(env)) {
    vi.stubEnv(key as never, value as never)
  }
  const mod = await import("../logger")
  return mod.logger
}

describe("logger", () => {
  let logSpy: ReturnType<typeof vi.spyOn>
  let warnSpy: ReturnType<typeof vi.spyOn>
  let errorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    logSpy.mockRestore()
    warnSpy.mockRestore()
    errorSpy.mockRestore()
    vi.resetModules()
  })

  it("is SILENT for logger.log in a production build", async () => {
    // Simulate Vite prod: PROD true, DEV false, and not test MODE.
    const logger = await loadLoggerWith({ MODE: "production", DEV: false, PROD: true })
    logger.log("[AI] raw response payload", { installed: ["ext-a"], url: "https://x.test" })
    expect(logSpy).not.toHaveBeenCalled()
  })

  it("still emits warn/error in a production build", async () => {
    const logger = await loadLoggerWith({ MODE: "production", DEV: false, PROD: true })
    logger.warn("a real warning")
    logger.error("a real error")
    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(errorSpy).toHaveBeenCalledTimes(1)
  })

  it("emits logger.log in a dev build", async () => {
    const logger = await loadLoggerWith({ MODE: "development", DEV: true, PROD: false })
    logger.log("dev message")
    expect(logSpy).toHaveBeenCalledTimes(1)
  })
})
