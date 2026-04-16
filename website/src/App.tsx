import Nav from "./components/Nav"
import Hero from "./components/Hero"
import Features from "./components/Features"
import HowItWorks from "./components/HowItWorks"
import Roadmap from "./components/Roadmap"
import BrowserSupport from "./components/BrowserSupport"
import CTASection from "./components/CTASection"
import Footer from "./components/Footer"

export default function App() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Roadmap />
        <BrowserSupport />
        <CTASection />
      </main>
      <Footer />
    </>
  )
}
