import { Navigate } from 'react-router-dom'
import { FeatureList } from '@/components/landing/FeatureList'
import { FinalCta } from '@/components/landing/FinalCta'
import { Hero } from '@/components/landing/Hero'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { LandingHeader } from '@/components/landing/LandingHeader'
import { StandingsPreview } from '@/components/landing/StandingsPreview'
import { useAuth } from '@/state/AuthContext'

export function LandingPage() {
  const { user, loading } = useAuth()

  if (!loading && user) return <Navigate to="/dashboard" replace />

  return (
    <div className="landing-theme min-h-screen">
      <LandingHeader />
      <main>
        <Hero />
        <StandingsPreview />
        <FeatureList />
        <HowItWorks />
        <FinalCta />
        <section id="puntuacion" className="sr-only" aria-label="Puntuación configurable" />
      </main>
      <LandingFooter />
    </div>
  )
}
