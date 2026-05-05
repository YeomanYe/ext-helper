import { useReveal } from "../hooks/useReveal"

interface RoadmapItem {
  id: string
  tag: string
  title: string
  desc: string
  icon: React.ReactNode
  tagColor: string
}

const ITEMS: RoadmapItem[] = [
  {
    id: "activity-log",
    tag: "Analytics",
    title: "Extension Activity Log",
    desc: "Full history of every enable, disable, install, and uninstall event — timestamped and searchable so you always know what changed.",
    tagColor: "#fbbf24",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" aria-hidden="true">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    id: "cross-browser-sync",
    tag: "Sync",
    title: "Cross-Browser Sync",
    desc: "Sync your Groups, Rules, and preferences across Chrome, Edge, and Firefox. Same setup wherever you browse — transport (cloud, browser-native sync, or file export) is still being decided.",
    tagColor: "#a78bfa",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="23 4 23 10 17 10" />
        <polyline points="1 20 1 14 7 14" />
        <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
      </svg>
    ),
  },
  {
    id: "site-aware-picker",
    tag: "Context",
    title: "Site-Aware Extension Picker",
    desc: "On any website, instantly see which of your installed extensions actually work here — based on host permissions, content-script matches, and how you've used them before.",
    tagColor: "#34d399",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    id: "cloud-suggestions",
    tag: "Discovery",
    title: "Cloud-Suggested Extensions",
    desc: "Query a curated cloud catalog for extensions that target the current website's domain — ranked by community signal so you discover the best tool for the page you're on.",
    tagColor: "#f472b6",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#f472b6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" />
      </svg>
    ),
  },
]

function RoadmapCard({ item, index }: { item: RoadmapItem; index: number }) {
  const ref = useReveal<HTMLLIElement>()
  return (
    <li ref={ref} className="roadmap-card reveal" style={{ transitionDelay: `${index * 100}ms` }}>
      <div className="roadmap-card-inner">
        <div className="roadmap-icon" style={{ borderColor: `${item.tagColor}33` }}>
          {item.icon}
        </div>
        <div className="roadmap-body">
          <div
            className="roadmap-tag"
            style={{
              color: item.tagColor,
              borderColor: `${item.tagColor}33`,
              background: `${item.tagColor}10`,
            }}
          >
            {item.tag}
          </div>
          <h3 className="roadmap-title">{item.title}</h3>
          <p className="roadmap-desc">{item.desc}</p>
        </div>
      </div>
      <div className="roadmap-badge" aria-label="Coming soon">
        COMING SOON
      </div>
    </li>
  )
}

export default function Roadmap() {
  const headerRef = useReveal()

  return (
    <section className="roadmap section" id="roadmap" aria-labelledby="roadmap-title">
      <div className="container">
        <div ref={headerRef} className="reveal">
          <div className="section-label" aria-hidden="true">
            Roadmap
          </div>
          <h2 className="section-title" id="roadmap-title">
            What's Coming
            <br />
            <span className="neon-text-purple">Next</span>
          </h2>
          <p className="section-desc">
            Features in active development — built based on real user needs.
          </p>
        </div>

        <ul className="roadmap-list" role="list">
          {ITEMS.map((item, i) => (
            <RoadmapCard key={item.id} item={item} index={i} />
          ))}
        </ul>
      </div>
    </section>
  )
}
