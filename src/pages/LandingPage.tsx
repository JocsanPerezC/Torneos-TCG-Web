import { FeatureList } from '@/components/landing/FeatureList'
import { ConceptPanel } from '@/components/landing/ConceptPanel'
import { Faq } from '@/components/landing/Faq'
import { FinalCta } from '@/components/landing/FinalCta'
import { Hero } from '@/components/landing/Hero'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { LandingHeader } from '@/components/landing/LandingHeader'
import { ProjectIdea } from '@/components/landing/ProjectIdea'

export function LandingPage() {
  return (
    <div className="landing-theme min-h-screen pt-[72px]">
      <LandingHeader />
      <main>
        <Hero />
        <ProjectIdea />
        <ConceptPanel />
        <FeatureList />
        <HowItWorks />
        <Faq />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  )
}
