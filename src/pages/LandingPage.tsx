import { FeatureList } from '../components/landing/FeatureList'
import { Hero } from '../components/landing/Hero'
import { LandingFooter } from '../components/landing/LandingFooter'
import { LandingHeader } from '../components/landing/LandingHeader'

export function LandingPage() { return <div className="min-h-screen bg-slate-950"><LandingHeader /><main className="mx-auto max-w-6xl px-4"><Hero /><FeatureList /></main><div className="mx-auto max-w-6xl px-4"><LandingFooter /></div></div> }
