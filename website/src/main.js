// ============================================================
// Nav scroll effect
// ============================================================
const nav = document.querySelector(".nav")
window.addEventListener("scroll", () => {
  nav.classList.toggle("scrolled", window.scrollY > 20)
})

// ============================================================
// Scroll reveal — IntersectionObserver for .reveal elements
// ============================================================
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible")
        revealObserver.unobserve(entry.target)
      }
    })
  },
  { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
)

document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el))

// ============================================================
// Stagger bento cards for smoother reveal
// ============================================================
document.querySelectorAll(".bento-card").forEach((card, i) => {
  card.style.transitionDelay = `${i * 80}ms`
})

document.querySelectorAll(".step-card").forEach((card, i) => {
  card.style.transitionDelay = `${i * 100}ms`
})

// ============================================================
// Smooth scroll for anchor links
// ============================================================
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (e) => {
    const target = document.querySelector(link.getAttribute("href"))
    if (target) {
      e.preventDefault()
      target.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  })
})
