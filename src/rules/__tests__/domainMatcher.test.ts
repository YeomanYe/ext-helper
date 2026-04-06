import { describe, expect, it } from "vitest"
import { domainMatcher } from "../domainMatcher"

describe("domainMatcher", () => {
  describe("extractHostname", () => {
    it("normal: should extract hostname from http URL", () => {
      expect(domainMatcher.extractHostname("http://example.com/path")).toBe("example.com")
    })

    it("normal: should extract hostname from https URL", () => {
      expect(domainMatcher.extractHostname("https://api.github.com/repos")).toBe("api.github.com")
    })

    it("normal: should extract hostname with port", () => {
      expect(domainMatcher.extractHostname("http://localhost:3000/app")).toBe("localhost")
    })

    it("edge: should return empty for chrome:// URLs", () => {
      expect(domainMatcher.extractHostname("chrome://extensions")).toBe("")
    })

    it("edge: should return empty for empty string", () => {
      expect(domainMatcher.extractHostname("")).toBe("")
    })

    it("abnormal: should return empty for invalid URL", () => {
      expect(domainMatcher.extractHostname("not-a-url")).toBe("")
    })
  })

  describe("matches - exact mode", () => {
    it("normal: should match exact hostname", () => {
      expect(domainMatcher.matches("github.com", "exact", "https://github.com/repo")).toBe(true)
    })

    it("normal: should not match different hostname", () => {
      expect(domainMatcher.matches("github.com", "exact", "https://gitlab.com/repo")).toBe(false)
    })

    it("normal: should not match subdomain in exact mode", () => {
      expect(domainMatcher.matches("github.com", "exact", "https://api.github.com/v1")).toBe(false)
    })
  })

  describe("matches - contains mode", () => {
    it("normal: should match partial hostname", () => {
      expect(domainMatcher.matches("github", "contains", "https://github.com/repo")).toBe(true)
    })

    it("normal: should match subdomain via contains", () => {
      expect(domainMatcher.matches("github.com", "contains", "https://api.github.com/v1")).toBe(true)
    })

    it("normal: should not match unrelated hostname", () => {
      expect(domainMatcher.matches("gitlab", "contains", "https://github.com")).toBe(false)
    })
  })

  describe("matches - wildcard mode", () => {
    it("normal: should match subdomain with *.domain pattern", () => {
      expect(domainMatcher.matches("*.github.com", "wildcard", "https://api.github.com/v1")).toBe(true)
    })

    it("normal: should not match root domain with *.domain pattern", () => {
      expect(domainMatcher.matches("*.github.com", "wildcard", "https://github.com/repo")).toBe(false)
    })

    it("normal: should match deep subdomain", () => {
      expect(domainMatcher.matches("*.github.com", "wildcard", "https://a.b.github.com")).toBe(true)
    })

    it("normal: should not match unrelated domain", () => {
      expect(domainMatcher.matches("*.github.com", "wildcard", "https://gitlab.com")).toBe(false)
    })
  })

  describe("matches - regex mode", () => {
    it("normal: should match with regex pattern", () => {
      expect(domainMatcher.matches("^github\\.com$", "regex", "https://github.com/repo")).toBe(true)
    })

    it("normal: should match partial regex", () => {
      expect(domainMatcher.matches("git(hub|lab)", "regex", "https://gitlab.com")).toBe(true)
    })

    it("normal: should not match non-matching regex", () => {
      expect(domainMatcher.matches("^google\\.com$", "regex", "https://github.com")).toBe(false)
    })

    it("abnormal: should return false for invalid regex", () => {
      expect(domainMatcher.matches("[invalid", "regex", "https://example.com")).toBe(false)
    })
  })

  describe("matches - edge cases", () => {
    it("edge: should return false for empty pattern", () => {
      expect(domainMatcher.matches("", "exact", "https://example.com")).toBe(false)
    })

    it("edge: should return false for non-http URL", () => {
      expect(domainMatcher.matches("extensions", "exact", "chrome://extensions")).toBe(false)
    })

    it("edge: should be case-insensitive for wildcard", () => {
      expect(domainMatcher.matches("*.GitHub.COM", "wildcard", "https://api.github.com")).toBe(true)
    })
  })

  describe("validatePattern", () => {
    it("normal: should validate non-empty patterns", () => {
      expect(domainMatcher.validatePattern("example.com", "exact")).toBe(true)
    })

    it("normal: should validate valid regex", () => {
      expect(domainMatcher.validatePattern("^github\\.com$", "regex")).toBe(true)
    })

    it("abnormal: should reject empty pattern", () => {
      expect(domainMatcher.validatePattern("", "exact")).toBe(false)
      expect(domainMatcher.validatePattern("   ", "wildcard")).toBe(false)
    })

    it("abnormal: should reject invalid regex", () => {
      expect(domainMatcher.validatePattern("[invalid", "regex")).toBe(false)
    })
  })
})
