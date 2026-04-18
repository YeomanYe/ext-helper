import { useReveal } from "../hooks/useReveal"
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

export default function CTASection() {
  const ref = useReveal()

  return (
    <section className="cta-section section" aria-labelledby="cta-title">
      <div className="container">
        <div ref={ref} className="reveal">
          <h2 className="cta-title" id="cta-title">
            Ready to Take Control
            <br />
            <span className="neon-text-cta">of Your Browser?</span>
          </h2>
          <p className="cta-desc">
            Free, open-source, and privacy-first. No accounts, no data collection, no subscription.
          </p>
          <div className="cta-actions">
            <a
              href={config.chromeStoreUrl}
              className="btn-primary"
              aria-label="Install Ext Helper — free browser extension manager"
            >
              <DownloadIcon />
              Install for Free
            </a>
            <a
              href={config.githubUrl}
              className="btn-secondary"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Star Ext Helper on GitHub"
            >
              <GithubIcon />
              Star on GitHub
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
