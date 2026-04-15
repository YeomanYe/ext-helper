import { useState, useEffect, useCallback, useRef } from "react"

const SLIDES = [
  {
    src: "/screenshots/screenshot-card.png",
    label: "Card View",
    tag: "ORGANIZATION",
    desc: "Grid layout with color-coded groups — see all your extensions at a glance.",
    glow: "rgba(124,58,237,0.55)",
  },
  {
    src: "/screenshots/screenshot-bisect.png",
    label: "Bisect Debugger",
    tag: "DEBUG",
    desc: "Binary search narrows down the problematic extension in log₂(n) steps.",
    glow: "rgba(244,63,94,0.5)",
  },
  {
    src: "/screenshots/screenshot-rules.png",
    label: "Auto Rules",
    tag: "AUTOMATION",
    desc: "Domain-based rules with schedule conditions auto-manage your extensions.",
    glow: "rgba(34,211,238,0.45)",
  },
]

const DURATION = 4500

export function ScreenshotCarousel() {
  const [current, setCurrent] = useState(0)
  const [phase, setPhase] = useState<"enter" | "exit">("enter")
  const [progress, setProgress] = useState(0)
  const rafRef = useRef<number>(0)

  const goTo = useCallback(
    (index: number) => {
      if (index === current) return
      cancelAnimationFrame(rafRef.current)
      setPhase("exit")
      setTimeout(() => {
        setCurrent(index)
        setProgress(0)
        setPhase("enter")
      }, 280)
    },
    [current]
  )

  const next = useCallback(() => {
    goTo((current + 1) % SLIDES.length)
  }, [current, goTo])

  useEffect(() => {
    setProgress(0)
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - start) / DURATION, 1)
      setProgress(p)
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        next()
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [current]) // eslint-disable-line react-hooks/exhaustive-deps

  const slide = SLIDES[current]

  return (
    <div className="sc-stage" role="region" aria-label="Product screenshots">
      {/* Ambient spotlight */}
      <div
        className="sc-spotlight"
        aria-hidden="true"
        style={{
          background: `radial-gradient(ellipse at 50% 55%, ${slide.glow} 0%, rgba(34,211,238,0.07) 55%, transparent 72%)`,
        }}
      />

      {/* Screenshot */}
      <div className={`sc-frame sc-${phase}`}>
        <img src={slide.src} alt={slide.label} className="sc-img" draggable={false} />
        <div className="sc-scanlines" aria-hidden="true" />
      </div>

      {/* Caption */}
      <div className="sc-caption">
        <div className="sc-meta">
          <span className="sc-tag">{slide.tag}</span>
          <span className="sc-title">{slide.label}</span>
        </div>
        <p className="sc-desc">{slide.desc}</p>

        {/* Progress dots */}
        <div className="sc-nav" role="tablist" aria-label="Slide navigation">
          {SLIDES.map((s, i) => (
            <button
              key={s.label}
              role="tab"
              aria-selected={i === current}
              aria-label={`Go to ${s.label}`}
              className={`sc-dot${i === current ? " active" : ""}`}
              onClick={() => goTo(i)}
            >
              {i === current && (
                <span
                  className="sc-dot-fill"
                  style={{ transform: `scaleX(${progress})` }}
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
