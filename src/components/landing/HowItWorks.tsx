import { Gamepad2, Store, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function HowItWorks() {
  const { t } = useTranslation()
  const steps = [[t('landing.benefits.groupTitle'), t('landing.benefits.groupDescription'), Users, '#21B876'], [t('landing.benefits.gameTitle'), t('landing.benefits.gameDescription'), Gamepad2, '#5B1FE0'], [t('landing.benefits.simpleTitle'), t('landing.benefits.simpleDescription'), Store, '#3D5AFB']]

  return (
    <section aria-labelledby="como-funciona-title" className="landing-deferred border-y border-border bg-white/70">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <div className="text-center"><p className="text-xs font-bold tracking-[.18em] text-accent">{t('landing.benefits.eyebrow')}</p><h2 id="como-funciona-title" className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">{t('landing.benefits.title')}</h2></div>
        <ol className="mt-10 grid gap-6 md:grid-cols-3">{steps.map(([title, description, Icon, color]) => <li key={title as string} className="text-center"><span className="feature-icon mx-auto inline-flex size-14 items-center justify-center rounded-full text-white" style={{ background: color as string }}><Icon size={25} /></span><h3 className="mt-4 text-xl font-bold text-foreground">{title as string}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{description as string}</p></li>)}</ol>
      </div>
    </section>
  )
}
