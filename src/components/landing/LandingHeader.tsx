import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { LanguageSelector } from '@/components/ui/LanguageSelector'
import { useAuth } from '@/state/AuthContext'

export function LandingHeader() {
  const { user, loading } = useAuth()
  const { t } = useTranslation()
  const accountTarget = !loading && user ? '/dashboard' : '/register'
  const accountLabel = !loading && user ? t('landing.navigation.dashboard') : t('landing.navigation.createAccount')

  return <header className="app-header landing-header">
    <div className="landing-header__bar mx-auto max-w-6xl">
      <Link to="/" className="landing-header__brand"><img src="/edh-tournaments-icon.svg" alt="" />EDH <span>Tournaments</span></Link>
      <nav className="landing-header__links" aria-label={t('landing.navigation.label')}><a href="#como-funciona">{t('landing.navigation.howItWorks')}</a><a href="#puntuacion">{t('landing.navigation.scoring')}</a><a href="#preguntas">{t('landing.navigation.faq')}</a></nav>
      <div className="landing-header__actions">
        {!loading && !user && <Button asChild variant="outline" className="landing-login"><Link to="/login">{t('landing.navigation.login')}</Link></Button>}
        <Button asChild className="landing-account"><Link to={accountTarget}>{accountLabel}</Link></Button>
        <LanguageSelector />
        <details className="landing-menu"><summary aria-label={t('landing.navigation.menu')}><i /><i /><i /></summary><div><a href="#como-funciona">{t('landing.navigation.howItWorks')}</a><a href="#puntuacion">{t('landing.navigation.scoring')}</a><a href="#preguntas">{t('landing.navigation.faq')}</a>{!user && <Link to="/login">{t('landing.navigation.login')}</Link>}</div></details>
      </div>
    </div>
  </header>
}
