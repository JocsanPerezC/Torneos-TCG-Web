import { FeatureList } from '@/components/landing/FeatureList'
import { Hero } from '@/components/landing/Hero'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { LandingHeader } from '@/components/landing/LandingHeader'
import { StandingsPreview } from '@/components/landing/StandingsPreview'

export function LandingPage() { return <div className="landing-theme min-h-screen bg-background"><LandingHeader /><main><Hero /><StandingsPreview /><FeatureList /><section id="puntuacion" className="sr-only" aria-label="Puntuación configurable" /></main><LandingFooter /></div> }
