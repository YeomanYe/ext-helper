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
    id: "style-pack-switching",
    tag: "Design",
    title: "Style Pack Switching",
    desc: "Swap the current punk aesthetic for other visual themes — minimal, skeuomorphic, cartoon. Style packs stay orthogonal to dark / light mode, so every theme works in both.",
    tagColor: "#f472b6",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#f472b6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="13.5" cy="6.5" r="2.5" />
        <circle cx="19" cy="13" r="2.5" />
        <circle cx="6" cy="12" r="2.5" />
        <circle cx="10" cy="20" r="2.5" />
        <path d="M12 2a10 10 0 0 0 0 20 2.5 2.5 0 0 0 2-4 2.5 2.5 0 0 1 2-4h2a4 4 0 0 0 4-4 10 10 0 0 0-10-8z" />
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
