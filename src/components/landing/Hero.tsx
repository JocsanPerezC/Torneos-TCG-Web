import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

export function Hero() {
  const { t } = useTranslation()

  return <section className="mx-auto w-full max-w-[800px] px-5 pb-10 pt-18 text-center sm:pb-14 sm:pt-24">
    <p className="mb-5 text-xs font-semibold tracking-[.18em] text-accent">
      {t('landing.hero.eyebrow')}</p>
    <h1 className="mx-auto max-w-[14ch] text-4xl leading-[.96] font-bold tracking-[-.045em] text-foreground sm:max-w-[18ch] sm:text-5xl lg:max-w-none lg:text-7xl">
      {t('landing.hero.title')}</h1>
    <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
      {t('landing.hero.description')}</p>
    <div className="mt-8 flex flex-wrap items-center justify-center gap-3"><Button asChild variant="outline" size="lg"><Link to="/login">{t('landing.navigation.login')}</Link></Button><Button asChild size="lg"><Link to="/register">{t('landing.navigation.createAccount')}</Link></Button></div>
    <p className="mt-4 text-sm text-muted-foreground">{t('landing.hero.noAccount')}</p></section>
}
