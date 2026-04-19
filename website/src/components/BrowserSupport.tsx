import { useReveal } from "../hooks/useReveal"
import { config } from "../config"

interface Browser {
  name: string
  url: string
  icon: string
}

const BASE = import.meta.env.BASE_URL

const BROWSERS: Browser[] = [
  { name: "Chrome", url: config.chromeStoreUrl, icon: `${BASE}icons/chrome.png` },
  { name: "Edge", url: config.edgeAddonUrl, icon: `${BASE}icons/edge.png` },
  { name: "Firefox", url: config.firefoxAddonUrl, icon: `${BASE}icons/firefox.svg` },
]

export default function BrowserSupport() {
  const headerRef = useReveal()
  const gridRef = useReveal()

  return (
    <section className="browsers section" id="install" aria-labelledby="browsers-title">
      <div className="container" style={{ textAlign: "center" }}>
        <div ref={headerRef} className="reveal">
          <div className="section-label" aria-hidden="true">
            Compatibility
          </div>
          <h2 className="section-title" id="browsers-title" style={{ marginBottom: "1rem" }}>
            Available On Your
            <br />
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
              <div className="browser-icon">
                <img src={browser.icon} alt={browser.name} width={48} height={48} />
              </div>
              <span className="browser-name">{browser.name}</span>
              <span className="browser-status">Available</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
