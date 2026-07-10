import { useReveal } from "../hooks/useReveal"

interface Feature {
  id: string
  tag: string
  title: string
  desc: string
  large?: boolean
  chips?: { label: string; active?: boolean }[]
  icon: React.ReactNode
}

const FEATURES: Feature[] = [
  {
    id: "groups",
    tag: "Organization",
    title: "Extension Groups",
    desc: "Organize extensions into named, color-coded groups. Enable or disable an entire group with one click. Perfect for separating work, development, and personal browsing contexts.",
    large: true,
    chips: [
      { label: "DEV_TOOLS", active: true },
      { label: "WORK", active: true },
      { label: "SOCIAL" },
      { label: "PERSONAL" },
      { label: "SECURITY", active: true },
    ],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" aria-hidden="true">
        <rect x="2" y="3" width="6" height="6" />
        <rect x="9" y="3" width="6" height="6" />
        <rect x="16" y="3" width="6" height="6" />
        <rect x="2" y="12" width="6" height="6" />
        <rect x="9" y="12" width="6" height="6" />
      </svg>
    ),
  },
  {
    id: "rules",
    tag: "Automation",
    title: "Domain-Based Rules",
    desc: "Auto-enable or disable extensions based on the current tab's domain. Set schedules by day and time range for full automated control.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" aria-hidden="true">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    id: "toggle",
    tag: "Control",
    title: "Instant Toggle",
    desc: "Enable or disable any extension instantly with zero delay. Bulk actions let you toggle multiple extensions simultaneously.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" aria-hidden="true">
        <rect x="1" y="5" width="22" height="14" rx="7" />
        <circle cx="16" cy="12" r="4" fill="#10b981" />
      </svg>
    ),
  },
  {
    id: "bisect",
    tag: "Debug",
    title: "Bisect Debugger",
    desc: "Binary search to find the problematic extension in log₂(n) steps. Protect critical extensions with a whitelist — password managers, input methods, and translators stay on during the entire process.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2" aria-hidden="true">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
        <line x1="11" y1="8" x2="11" y2="14" />
        <line x1="8" y1="11" x2="14" y2="11" />
      </svg>
    ),
  },
  {
    id: "site-discovery",
    tag: "Discovery",
    title: "Site Extension Discovery",
    desc: "An AI-powered panel surfaces which of your installed extensions work on the current website. Cloud-suggested recommendations show relevant extensions you haven't installed yet — ranked by community signal.",
    large: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
  {
    id: "ai-groups",
    tag: "AI",
    title: "AI Group Suggestions",
    desc: "Let an LLM pick the right extensions for a group. Click the robot icon in any group panel and AI recommends candidates based on extension names, descriptions, and permissions.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#c084fc" strokeWidth="2" aria-hidden="true">
        <rect x="3" y="11" width="18" height="10" rx="2" />
        <circle cx="12" cy="5" r="2" />
        <path d="M12 7v4" />
        <line x1="8" y1="16" x2="8" y2="16" />
        <line x1="16" y1="16" x2="16" y2="16" />
      </svg>
    ),
  },
  {
    id: "usage-log",
    tag: "Analytics",
    title: "Usage Log",
    desc: "Full timestamped history of every enable, disable, install, and uninstall event. Per-extension stats show exactly what changed and when.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" aria-hidden="true">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    id: "history",
    tag: "Safety",
    title: "Undo / Redo History",
    desc: "Full snapshot-based history of all extension state changes. Instantly revert any mistake — never lose your extension configuration again.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="2" aria-hidden="true">
        <path d="M3 7v6h6" />
        <path d="M3 13A9 9 0 1 0 6 6.3" />
      </svg>
    ),
  },
  {
    id: "import-export",
    tag: "Backup",
    title: "Config & Log Import / Export",
    desc: "Back up and restore groups, rules, preferences, and usage logs. Import with preview and confirmation so you always know what's coming in.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" aria-hidden="true">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
        <polyline points="17 4 12 9 7 4" transform="translate(0 -1)" opacity="0.5" />
      </svg>
    ),
  },
  {
    id: "theme-toggle",
    tag: "Personalization",
    title: "Theme Toggle",
    desc: "Dark, light, or follow system. Punk-themed design system with a deep-blue dark variant — switch instantly without page reload.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" aria-hidden="true">
        <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
      </svg>
    ),
  },
  {
    id: "sync-profiles",
    tag: "Sync",
    title: "Cross-Profile Sync",
    desc: "Groups and Rules sync automatically across all Chrome profiles signed into the same account — set it up once, take it everywhere on the same browser.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" aria-hidden="true">
        <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
        <polyline points="16 6 12 2 8 6" />
        <line x1="12" y1="2" x2="12" y2="15" />
      </svg>
    ),
  },
  {
    id: "cross",
    tag: "Compatibility",
    title: "Cross-Browser",
    desc: "Works seamlessly on Chrome, Firefox, and Edge. Single codebase, consistent experience across all major browsers.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
]

export default function Features() {
  const headerRef = useReveal()

  return (
    <section className="features section" id="features" aria-labelledby="features-title">
      <div className="container">
        <div ref={headerRef} className="reveal">
          <div className="section-label" aria-hidden="true">
            Features
          </div>
          <h2 className="section-title" id="features-title">
            Everything You Need to
            <br />
            <span className="neon-text-cyan">Master Your Extensions</span>
          </h2>
          <p className="section-desc">
            Purpose-built tools for developers and power users who work with many browser extensions
            daily.
          </p>
        </div>

        <div className="bento-grid" role="list">
          {FEATURES.map((feature, i) => (
            <FeatureCard key={feature.id} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const ref = useReveal<HTMLElement>()
  return (
    <article
      ref={ref}
      className={`bento-card reveal${feature.large ? " large" : ""}`}
      role="listitem"
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <div className="bento-icon">{feature.icon}</div>
      <div className="bento-tag">{feature.tag}</div>
      <h3 className="bento-title">{feature.title}</h3>
      <p className="bento-desc">{feature.desc}</p>
      {feature.chips && (
        <div className="bento-demo" aria-label="Example groups">
          {feature.chips.map(({ label, active }) => (
            <span key={label} className={`bento-chip${active ? " active" : ""}`}>
              {label}
            </span>
          ))}
        </div>
      )}
    </article>
  )
}
