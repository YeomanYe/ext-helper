import { useEffect, useState } from "react"
import { config } from "../config"

const ExtIcon = () => (
  <svg width="36" height="36" viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <rect width="40" height="40" fill="#0D1B2A" />
    <rect x="1.5" y="1.5" width="37" height="37" stroke="#00FFFF" strokeWidth="2" fill="none" />
    <text
      x="20"
      y="20"
      textAnchor="middle"
      dominantBaseline="central"
      fill="#00FFFF"
      fontSize="22"
      fontWeight="bold"
      fontFamily="monospace"
    >
      E
    </text>
  </svg>
)

const DownloadIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handler, { passive: true })
    return () => window.removeEventListener("scroll", handler)
  }, [])

  return (
    <nav className={`nav${scrolled ? " scrolled" : ""}`} aria-label="Main navigation">
      <div className="container">
        <div className="nav-inner">
          <a href="/" className="nav-logo" aria-label="Ext Helper home">
            <ExtIcon />
            <div className="nav-logo-text">
              <span className="nav-logo-name">Ext Helper</span>
              <span className="nav-logo-sub">Extension Manager</span>
            </div>
          </a>
          <a href={config.chromeStoreUrl} className="nav-cta" aria-label="Install Ext Helper">
            <DownloadIcon />
            Install Free
          </a>
        </div>
      </div>
    </nav>
  )
}
