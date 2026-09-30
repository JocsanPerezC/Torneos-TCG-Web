import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/state/AuthContext'

export function FinalCta() {
  const { t } = useTranslation()
  const { user, loading } = useAuth()
  const target = !loading && user ? '/dashboard' : '/register'
  const label = !loading && user ? t('landing.navigation.dashboard') : t('landing.cta.button')
  return <section className="last-call landing-deferred"><div className="mx-auto max-w-6xl px-5 py-18 sm:py-24"><div className="last-call__sheet"><svg viewBox="0 0 180 120" aria-hidden="true"><path d="M33 93 90 25l57 68H33Z" /><path d="m54 83 36-42 36 42M90 25v68" /><circle cx="90" cy="25" r="8" /></svg><div><p>{t('landing.cta.eyebrow')}</p><h2>{t('landing.cta.title')}</h2><span>{t('landing.cta.description')}</span><Button asChild size="lg"><Link to={target}>{label}</Link></Button></div><i>{t('landing.cta.sideNote')}</i></div></div></section>
}
