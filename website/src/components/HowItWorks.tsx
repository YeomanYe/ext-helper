import { useReveal } from "../hooks/useReveal"

interface Step {
  num: string
  title: string
  desc: string
  terminal: React.ReactNode
}

const STEPS: Step[] = [
  {
    num: "01",
    title: "Install the Extension",
    desc: "Add Ext Helper from the Chrome Web Store, Firefox Add-ons, or Microsoft Edge Add-ons. No account required.",
    terminal: (
      <>
        <span style={{ color: "var(--punk-neon-cyan)" }}>// Chrome Web Store</span>
        <br />
        Search "Ext Helper"
        <br />→ Click "Add to Chrome"
      </>
    ),
  },
  {
    num: "02",
    title: "Organize into Groups",
    desc: "Create named groups for different contexts — development, work, social, security. Drag extensions into groups and assign colors.",
    terminal: (
      <>
        <span style={{ color: "var(--punk-neon-cyan)" }}>// Example groups</span>
        <br />[ DEV_TOOLS ] — 4 extensions
        <br />[ WORK ] ——— 3 extensions
      </>
    ),
  },
  {
    num: "03",
    title: "Set Automation Rules",
    desc: "Define rules to auto-enable/disable extensions when visiting specific domains or at scheduled times. Let Ext Helper do the switching for you.",
    terminal: (
      <>
        <span style={{ color: "var(--punk-neon-cyan)" }}>// Example rule</span>
        <br />
        github.com → enable DEV_TOOLS
        <br />
        Mon–Fri 9–18h → enable WORK
      </>
    ),
  },
]

export default function HowItWorks() {
  const headerRef = useReveal()

  return (
    <section className="how-it-works section" id="how-it-works" aria-labelledby="how-title">
      <div className="container">
        <div ref={headerRef} className="reveal">
          <div className="section-label" aria-hidden="true">
            Process
          </div>
          <h2 className="section-title" id="how-title">
            Up and Running in
            <br />
            <span className="neon-text-purple">Three Steps</span>
          </h2>
          <p className="section-desc">
            No configuration files, no complex setup. Install and start managing your extensions
            immediately.
          </p>
        </div>

        <div className="steps-grid" role="list">
          {STEPS.map((step, i) => (
            <StepCard key={step.num} step={step} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

function StepCard({ step, index }: { step: Step; index: number }) {
  const ref = useReveal<HTMLElement>()
  return (
    <article
      ref={ref}
      className="step-card reveal"
      role="listitem"
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="step-number" aria-hidden="true">
        {step.num}
      </div>
      <h3 className="step-title">{step.title}</h3>
      <p className="step-desc">{step.desc}</p>
      <div className="terminal-block" aria-label={`${step.title} example`}>
        {step.terminal}
      </div>
    </article>
  )
}
