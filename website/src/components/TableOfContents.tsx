import { useState, useEffect } from "react"

const SECTIONS = [
  { id: "hero",         label: "Home" },
  { id: "features",    label: "Features" },
  { id: "how-it-works",label: "How It Works" },
  { id: "roadmap",     label: "Roadmap" },
  { id: "install",     label: "Download" },
]

export function TableOfContents() {
  const [active, setActive] = useState("hero")

  useEffect(() => {
    const observers: IntersectionObserver[] = []

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActive(id)
        },
        { threshold: 0.35, rootMargin: "-10% 0px -55% 0px" }
      )
      obs.observe(el)
      observers.push(obs)
    })

    return () => observers.forEach((o) => o.disconnect())
  }, [])

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <nav className="toc" aria-label="Page outline">
      <ul className="toc-list">
        {SECTIONS.map(({ id, label }) => (
          <li key={id} className="toc-item">
            <button
              className={`toc-btn${active === id ? " active" : ""}`}
              onClick={() => scrollTo(id)}
              aria-current={active === id ? "location" : undefined}
            >
              <span className="toc-dot" aria-hidden="true" />
              <span className="toc-label">{label}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
