import Nav from "./components/Nav"
import Hero from "./components/Hero"
import Features from "./components/Features"
import HowItWorks from "./components/HowItWorks"
import Roadmap from "./components/Roadmap"
import Pricing from "./components/Pricing"
import BrowserSupport from "./components/BrowserSupport"
import CTASection from "./components/CTASection"
import Footer from "./components/Footer"
import { TableOfContents } from "./components/TableOfContents"
import { DonateBadge } from "./components/DonateBadge"

export default function App() {
  return (
    <>
      <Nav />
      <TableOfContents />
      <DonateBadge />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Roadmap />
        <Pricing />
        <BrowserSupport />
        <CTASection />
      </main>
      <Footer />
    </>
  )
}
