import { config } from "../config"

const DownloadIcon = () => (
  <svg
    width="16"
    height="16"
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

const GithubIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
  </svg>
)

const MOCK_EXTENSIONS = [
  { name: "uBlock Origin", version: "v1.58.0", color: "#4285f4", enabled: true },
  { name: "React DevTools", version: "v4.28.0", color: "#ff6b35", enabled: true },
  { name: "Grammarly", version: "v14.1", color: "#78859b", enabled: false },
  { name: "Vimium", version: "v1.67", color: "#10b981", enabled: true },
]

function PopupMockup() {
  return (
    <div className="mockup-wrap">
      <div className="mockup-glow" aria-hidden="true" />
      <div className="mockup hud-box" role="img" aria-label="Ext Helper popup screenshot mockup">
        <div className="mockup-header">
          <div className="mockup-logo">
            <svg width="20" height="20" viewBox="0 0 40 40" fill="none" aria-hidden="true">
              <rect width="40" height="40" fill="#0D1B2A" />
              <rect
                x="1.5"
                y="1.5"
                width="37"
                height="37"
                stroke="#00FFFF"
                strokeWidth="2"
                fill="none"
              />
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
            EXTHELPER
          </div>
          <span style={{ fontSize: "0.55rem", color: "var(--punk-text-muted)" }}>GRID</span>
        </div>

        <div className="mockup-tabs">
          {["Extensions", "Groups", "Rules"].map((tab, i) => (
            <div key={tab} className={`mockup-tab${i === 0 ? " active" : ""}`}>
              {tab}
            </div>
          ))}
        </div>

        <div className="mockup-search">
          <span className="mockup-search-dollar">$</span>
          <span>search extensions...</span>
          <span style={{ marginLeft: "auto", color: "var(--punk-accent)", fontSize: "0.55rem" }}>
            ALL ▾
          </span>
        </div>

        <div className="mockup-ext-list">
          {MOCK_EXTENSIONS.map((ext) => (
            <div key={ext.name} className="mockup-ext-item">
              <div className="mockup-ext-dot" style={{ background: ext.color }} />
              <div className="mockup-ext-info">
                <div className="mockup-ext-name">{ext.name}</div>
                <div className="mockup-ext-sub">
                  {ext.version} · {ext.enabled ? "enabled" : "disabled"}
                </div>
              </div>
              <div className={`mockup-toggle${ext.enabled ? " on" : " off"}`} />
            </div>
          ))}
        </div>

        <div className="mockup-footer">
          <span>
            SYS_STATUS: <span style={{ color: "var(--punk-success)" }}>3/4 ONLINE</span>
          </span>
          <div className="mockup-footer-live">
            <div className="mockup-footer-dot" />
            LIVE
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Hero() {
  return (
    <section className="hero section" aria-labelledby="hero-title">
      <div className="container">
        <div className="hero-inner">
          <div className="hero-content">
            <div className="hero-badge" role="status">
              Browser Extension Manager
            </div>

            <h1 className="hero-title" id="hero-title">
              <span className="hero-title-line1">TAKE CONTROL</span>
              <span className="hero-title-line2">OF YOUR</span>
              <span className="hero-title-line3">EXTENSIONS</span>
            </h1>

            <p className="hero-desc">
              Organize, automate, and debug all your browser extensions from one powerful dashboard.
              Custom groups, domain-based rules, and binary search debugging — built for power
              users.
            </p>

            <div className="hero-actions">
              <a
                href={config.chromeStoreUrl}
                className="btn-primary"
                aria-label="Install Ext Helper for Chrome"
              >
                <DownloadIcon />
                Install for Chrome
              </a>
              <a
                href={config.githubUrl}
                className="btn-secondary"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View source on GitHub"
              >
                <GithubIcon />
                View Source
              </a>
            </div>

            <div className="hero-stats" role="list" aria-label="Key statistics">
              {[
                { value: "Free", label: "Open Source" },
                { value: "3+", label: "Browsers" },
                { value: "0ms", label: "Toggle Delay" },
              ].map((stat) => (
                <div key={stat.label} className="stat-item" role="listitem">
                  <span className="stat-value">{stat.value}</span>
                  <span className="stat-label">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <PopupMockup />
          </div>
        </div>
      </div>
    </section>
  )
}
