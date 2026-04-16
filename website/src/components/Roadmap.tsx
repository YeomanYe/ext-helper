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
    id: "sync-profiles",
    tag: "Sync",
    title: "Cross-Profile Sync",
    desc: "Share Groups and Rules across multiple Chrome profiles on the same browser — keep work and personal environments in sync.",
    tagColor: "#22d3ee",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" aria-hidden="true">
        <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
        <polyline points="16 6 12 2 8 6" />
        <line x1="12" y1="2" x2="12" y2="15" />
      </svg>
    ),
  },
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
    id: "cloud-sync",
    tag: "Cloud",
    title: "Cloud Data Sync",
    desc: "Store your Groups, Rules, and preferences in the cloud. Switch machines without losing your setup — everything follows you.",
    tagColor: "#a78bfa",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" aria-hidden="true">
        <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" />
      </svg>
    ),
  },
]

function RoadmapCard({ item, index }: { item: RoadmapItem; index: number }) {
  const ref = useReveal<HTMLLIElement>()
  return (
    <li
      ref={ref}
      className="roadmap-card reveal"
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="roadmap-card-inner">
        <div className="roadmap-icon" style={{ borderColor: `${item.tagColor}33` }}>
          {item.icon}
        </div>
        <div className="roadmap-body">
          <div className="roadmap-tag" style={{ color: item.tagColor, borderColor: `${item.tagColor}33`, background: `${item.tagColor}10` }}>
            {item.tag}
          </div>
          <h3 className="roadmap-title">{item.title}</h3>
          <p className="roadmap-desc">{item.desc}</p>
        </div>
      </div>
      <div className="roadmap-badge" aria-label="Coming soon">COMING SOON</div>
    </li>
  )
}

export default function Roadmap() {
  const headerRef = useReveal()

  return (
    <section className="roadmap section" id="roadmap" aria-labelledby="roadmap-title">
      <div className="container">
        <div ref={headerRef} className="reveal">
          <div className="section-label" aria-hidden="true">Roadmap</div>
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
