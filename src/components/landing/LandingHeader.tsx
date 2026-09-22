import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { LanguageSelector } from '@/components/ui/LanguageSelector'
import { useAuth } from '@/state/AuthContext'

export function LandingHeader() {
  const { user, loading } = useAuth()
  const { t } = useTranslation()

  return (
    <header className="app-header border-b border-border">
      <div className="relative mx-auto flex min-h-[72px] max-w-6xl items-center justify-between px-3 sm:px-5">
        <Link to="/" className="brand-wiggle inline-flex shrink-0 items-center gap-2 text-lg font-bold tracking-tight text-foreground sm:text-xl"><img src="/tcg-tournament-icon.svg" alt="" className="size-5" />Torneos TCG</Link>
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 lg:flex">
          <a href="#como-funciona" className="nav-sparkle px-3 py-2 text-sm font-semibold text-foreground hover:text-accent">{t('landing.navigation.howItWorks')}</a><a href="#puntuacion" className="nav-sparkle px-3 py-2 text-sm font-semibold text-accent">{t('landing.navigation.scoring')}</a><a href="#preguntas" className="nav-sparkle px-3 py-2 text-sm font-semibold text-foreground hover:text-accent">{t('landing.navigation.faq')}</a>
        </nav>
        <div className="flex shrink-0 items-center gap-1 text-sm sm:gap-2">
          {!loading && user ? <Button asChild className="h-9 px-3 sm:h-10 sm:px-5"><Link to="/dashboard">{t('landing.navigation.dashboard')}</Link></Button> : <><Link to="/login" className="nav-wiggle hidden font-semibold text-foreground sm:inline">{t('landing.navigation.login')}</Link><Button asChild className="h-9 px-3 sm:h-10 sm:px-5"><Link to="/register">{t('landing.navigation.createAccount')}</Link></Button></>}
          <LanguageSelector />
        </div>
      </div>
    </header>
  )
}
