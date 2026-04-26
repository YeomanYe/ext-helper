import { useReveal } from "../hooks/useReveal"

interface Tier {
  id: string
  name: string
  price: string
  cadence?: string
  desc: string
  features: string[]
  highlight?: boolean
  badge?: string
  ctaLabel: string
}

const TIERS: Tier[] = [
  {
    id: "free",
    name: "Free Forever",
    price: "$0",
    cadence: "always",
    desc: "Core extension manager — open source, no ads, no telemetry.",
    features: [
      "Enable / disable / group extensions",
      "Snapshot-based undo / redo",
      "Bisect debugger",
      "Domain-based automation rules",
      "Light / dark theme",
    ],
    ctaLabel: "Install Free",
  },
  {
    id: "pro",
    name: "Pro",
    price: "$9",
    cadence: "per year",
    desc: "Power-user features for people who live inside their browser.",
    features: [
      "Priority email support",
      "Custom theme tokens & accent colors",
      "Batch import / export across browsers",
      "Advanced rule library + sharing",
      "Early access to roadmap features",
    ],
    highlight: true,
    badge: "Coming Soon",
    ctaLabel: "Notify me",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    desc: "Self-hosted deployment, team collaboration, audit and compliance.",
    features: [
      "Self-hosted distribution",
      "Team-shared groups & rules",
      "SSO / SCIM provisioning",
      "Audit log export",
      "Onboarding & SLA",
    ],
    badge: "On request",
    ctaLabel: "Contact us",
  },
]

export default function Pricing() {
  const headerRef = useReveal()
  const gridRef = useReveal()

  return (
    <section className="pricing section" id="pricing" aria-labelledby="pricing-title">
      <div className="container">
        <div ref={headerRef} className="reveal" style={{ textAlign: "center" }}>
          <div className="section-label" aria-hidden="true">
            Pricing
          </div>
          <h2 className="section-title" id="pricing-title">
            Free today,
            <br />
            <span className="neon-text-cyan">growing tomorrow</span>
          </h2>
          <p className="section-desc" style={{ marginInline: "auto" }}>
            All current features stay free, forever. Pro and Enterprise tiers
            are on the roadmap to fund continued development.
          </p>
        </div>

        <ul ref={gridRef} className="pricing-grid reveal" role="list">
          {TIERS.map((tier) => (
            <li
              key={tier.id}
              className={`pricing-card${tier.highlight ? " pricing-card--highlight" : ""}`}
              role="listitem"
            >
              {tier.badge && <div className="pricing-badge">{tier.badge}</div>}
              <div className="pricing-name">{tier.name}</div>
              <div className="pricing-price-row">
                <span className="pricing-price">{tier.price}</span>
                {tier.cadence && <span className="pricing-cadence">/ {tier.cadence}</span>}
              </div>
              <p className="pricing-desc">{tier.desc}</p>
              <ul className="pricing-features" role="list">
                {tier.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <div className="pricing-cta" aria-disabled={!!tier.badge}>
                {tier.ctaLabel}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
