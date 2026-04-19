import { useState, useEffect, useCallback, useRef } from "react"

const BASE = import.meta.env.BASE_URL

const SLIDES = [
  {
    src: `${BASE}screenshots/screenshot-card.png`,
    label: "Card View",
    tag: "ORGANIZATION",
    desc: "Grid layout with color-coded groups — see all your extensions at a glance.",
    glow: "rgba(124,58,237,0.55)",
  },
  {
    src: `${BASE}screenshots/screenshot-bisect.png`,
    label: "Bisect Debugger",
    tag: "DEBUG",
    desc: "Binary search narrows down the problematic extension in log₂(n) steps.",
    glow: "rgba(244,63,94,0.5)",
  },
  {
    src: `${BASE}screenshots/screenshot-rules.png`,
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

  const next = useCallback(() => goTo((current + 1) % SLIDES.length), [current, goTo])
  const prev = useCallback(
    () => goTo((current - 1 + SLIDES.length) % SLIDES.length),
    [current, goTo]
  )

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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev()
      if (e.key === "ArrowRight") next()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [prev, next])

  const slide = SLIDES[current]

  return (
    <div className="sc-stage" role="region" aria-label="Product screenshots">
      {/* Ambient glow behind image */}
      <div
        className="sc-spotlight"
        aria-hidden="true"
        style={{
          background: `radial-gradient(ellipse at 50% 55%, ${slide.glow} 0%, rgba(34,211,238,0.07) 55%, transparent 72%)`,
        }}
      />

      {/* Screenshot frame — no overlaid buttons */}
      <div className={`sc-frame sc-${phase}`}>
        <img src={slide.src} alt={slide.label} className="sc-img" draggable={false} />
        <div className="sc-scanlines" aria-hidden="true" />
      </div>

      {/* All controls below the image */}
      <div className="sc-footer">
        {/* [←] [tab1][tab2][tab3] [01/03] [→] */}
        <div className="sc-controls" role="group" aria-label="Screenshot navigation">
          <button className="sc-ctrl-btn" onClick={prev} aria-label="Previous screenshot">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden="true"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <div className="sc-tabs" role="tablist" aria-label="Screenshots">
            {SLIDES.map((s, i) => (
              <button
                key={s.label}
                role="tab"
                aria-selected={i === current}
                aria-label={`View ${s.label}`}
                className={`sc-tab${i === current ? " active" : ""}`}
                onClick={() => goTo(i)}
              >
                <span className="sc-tab-tag">{s.tag}</span>
                <span className="sc-tab-name">{s.label}</span>
                <span
                  className="sc-tab-bar"
                  style={i === current ? { transform: `scaleX(${progress})` } : undefined}
                />
              </button>
            ))}
          </div>

          <span className="sc-count" aria-live="polite">
            <span className="sc-count-cur">{String(current + 1).padStart(2, "0")}</span>
            <span className="sc-count-sep">/</span>
            <span className="sc-count-tot">{String(SLIDES.length).padStart(2, "0")}</span>
          </span>

          <button className="sc-ctrl-btn" onClick={next} aria-label="Next screenshot">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden="true"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        <p className="sc-desc" aria-live="polite">
          {slide.desc}
        </p>
      </div>
    </div>
  )
}
