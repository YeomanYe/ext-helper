import { useState, useEffect, useCallback } from "react"

const SLIDES = [
  {
    src: "/screenshots/screenshot-card.png",
    label: "Card View",
    tag: "ORGANIZATION",
    desc: "Grid layout with color-coded groups — see all your extensions at a glance.",
  },
  {
    src: "/screenshots/screenshot-bisect.png",
    label: "Bisect Debugger",
    tag: "DEBUG",
    desc: "Binary search narrows down the problematic extension in log₂(n) steps.",
  },
  {
    src: "/screenshots/screenshot-rules.png",
    label: "Auto Rules",
    tag: "AUTOMATION",
    desc: "Domain-based rules with schedule conditions auto-manage your extensions.",
  },
]

export function ScreenshotCarousel() {
  const [current, setCurrent] = useState(0)
  const [animating, setAnimating] = useState(false)

  const goTo = useCallback(
    (index: number) => {
      if (animating || index === current) return
      setAnimating(true)
      setTimeout(() => {
        setCurrent(index)
        setAnimating(false)
      }, 200)
    },
    [animating, current]
  )

  const next = useCallback(() => {
    goTo((current + 1) % SLIDES.length)
  }, [current, goTo])

  useEffect(() => {
    const timer = setInterval(next, 4000)
    return () => clearInterval(timer)
  }, [next])

  const slide = SLIDES[current]

  return (
    <div className="screenshot-carousel hud-box" role="region" aria-label="Product screenshots">
      {/* HUD header */}
      <div className="sc-header">
        <span className="sc-tag">{slide.tag}</span>
        <div className="sc-dots" role="tablist" aria-label="Slide navigation">
          {SLIDES.map((s, i) => (
            <button
              key={s.label}
              role="tab"
              aria-selected={i === current}
              aria-label={`Go to slide: ${s.label}`}
              className={`sc-dot${i === current ? " active" : ""}`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      </div>

      {/* Screenshot */}
      <div className="sc-image-wrap">
        <img
          key={current}
          src={slide.src}
          alt={slide.label}
          className={`sc-image${animating ? " fade-out" : " fade-in"}`}
          draggable={false}
        />
      </div>

      {/* Caption */}
      <div className="sc-caption">
        <span className="sc-label">{slide.label}</span>
        <p className="sc-desc">{slide.desc}</p>
      </div>

      {/* Prev / Next */}
      <button
        className="sc-arrow sc-arrow-prev"
        onClick={() => goTo((current - 1 + SLIDES.length) % SLIDES.length)}
        aria-label="Previous screenshot"
      >
        ‹
      </button>
      <button
        className="sc-arrow sc-arrow-next"
        onClick={() => next()}
        aria-label="Next screenshot"
      >
        ›
      </button>
    </div>
  )
}
