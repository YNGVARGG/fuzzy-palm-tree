import { BusinessCloud } from "@/components/landing/business-cloud"
import { Cta } from "@/components/landing/cta"
import { Demo } from "@/components/landing/demo"
import { Faq } from "@/components/landing/faq"
import { Features } from "@/components/landing/features"
import { Footer } from "@/components/landing/footer"
import { Hero } from "@/components/landing/hero"
import { Nav } from "@/components/landing/nav"
import { Pricing } from "@/components/landing/pricing"
import { Problem } from "@/components/landing/problem"

export default function LandingPage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <BusinessCloud />
        <Problem />
        <Features />
        <Demo />
        <Pricing />
        <Faq />
        <Cta />
      </main>
      <Footer />
    </>
  )
}
