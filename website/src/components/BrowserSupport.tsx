import { useReveal } from "../hooks/useReveal"
import { config } from "../config"

interface Browser {
  name: string
  url: string
  icon: React.ReactNode
}

const ChromeIcon = () => (
  <svg viewBox="0 0 48 48" aria-hidden="true">
    <circle cx="24" cy="24" r="22" fill="#fff" />
    <circle cx="24" cy="24" r="10" fill="#1a73e8" />
    <path d="M24 14h20a22 22 0 0 1 0 20" fill="#ea4335" />
    <path d="M44 34A22 22 0 0 1 4 34l10-17.3" fill="#fbbc05" />
    <path d="M4 34A22 22 0 0 1 24 2v20" fill="#34a853" />
    <circle cx="24" cy="24" r="6" fill="#fff" />
  </svg>
)

const EdgeIcon = () => (
  <svg viewBox="0 0 48 48" aria-hidden="true">
    <defs>
      <linearGradient id="eg1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#0078d7" />
        <stop offset="100%" stopColor="#00b4d8" />
      </linearGradient>
      <linearGradient id="eg2" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#00b4d8" />
        <stop offset="100%" stopColor="#0078d7" />
      </linearGradient>
    </defs>
    <ellipse cx="24" cy="28" rx="20" ry="16" fill="url(#eg1)" />
    <path d="M8 24C8 14 15 8 24 8c6 0 11 3 14 8H24c-5 0-9 4-9 9s4 9 9 9h18a22 22 0 0 1-18 8C14 42 8 33.97 8 24z" fill="url(#eg2)" />
  </svg>
)

const FirefoxIcon = () => (
  <svg viewBox="0 0 48 48" aria-hidden="true">
    <circle cx="24" cy="24" r="20" fill="#ff9500" />
    <circle cx="24" cy="24" r="13" fill="#ff6611" />
    <path d="M24 11c-7 0-13 6-13 13 0 5 2.8 9.3 7 11.5-1.5-2-2.5-4.5-2.5-7A9.5 9.5 0 0 1 24 19c3 0 5.7 1.4 7.5 3.5C30 17 27.3 14 24 14c-1 0-2 .2-3 .5A9.5 9.5 0 0 1 33.5 24a9.5 9.5 0 0 1-9.5 9.5 9.5 9.5 0 0 1-7-3C19 34 21.3 37 24 37c7 0 13-6 13-13S31 11 24 11z" fill="#ff3750" />
  </svg>
)

export default function BrowserSupport() {
  const headerRef = useReveal()
  const gridRef = useReveal()

  const BROWSERS: Browser[] = [
    { name: "Chrome", url: config.chromeStoreUrl, icon: <ChromeIcon /> },
    { name: "Edge", url: config.edgeAddonUrl, icon: <EdgeIcon /> },
    { name: "Firefox", url: config.firefoxAddonUrl, icon: <FirefoxIcon /> },
  ]

  return (
    <section className="browsers section" id="install" aria-labelledby="browsers-title">
      <div className="container" style={{ textAlign: "center" }}>
        <div ref={headerRef} className="reveal">
          <div className="section-label" aria-hidden="true">Compatibility</div>
          <h2 className="section-title" id="browsers-title" style={{ marginBottom: "1rem" }}>
            Available On Your<br />
            <span className="neon-text-cyan">Favorite Browser</span>
          </h2>
          <p className="section-desc" style={{ marginInline: "auto", marginBottom: "3.5rem" }}>
            Ext Helper works on all major Chromium-based browsers and Firefox.
          </p>
        </div>

        <div ref={gridRef} className="browsers-grid reveal" role="list">
          {BROWSERS.map((browser) => (
            <a
              key={browser.name}
              href={browser.url}
              className="browser-card"
              role="listitem"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Install Ext Helper for ${browser.name}`}
            >
              <div className="browser-icon">{browser.icon}</div>
              <span className="browser-name">{browser.name}</span>
              <span className="browser-status">Available</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
