import { useState, useEffect } from "react"

const SECTIONS = [
  { id: "hero", label: "Home" },
  { id: "features", label: "Features" },
  { id: "how-it-works", label: "How It Works" },
  { id: "roadmap", label: "Roadmap" },
  { id: "pricing", label: "Pricing" },
  { id: "install", label: "Download" },
]

export function TableOfContents() {
  const [active, setActive] = useState("hero")

  useEffect(() => {
    const update = () => {
      // Trigger line: 30% from the top of the viewport
      const triggerY = window.scrollY + window.innerHeight * 0.3
      let current = SECTIONS[0].id
      for (const { id } of SECTIONS) {
        const el = document.getElementById(id)
        if (el && el.offsetTop <= triggerY) current = id
      }
      setActive(current)
    }

    window.addEventListener("scroll", update, { passive: true })
    update()
    return () => window.removeEventListener("scroll", update)
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
