import { useTranslation } from 'react-i18next'

function SeatMap() { return <svg viewBox="0 0 220 156" aria-hidden="true"><path d="M110 18c50 0 91 27 91 60s-41 60-91 60-91-27-91-60 41-60 91-60Z" /><path d="M110 41v74M54 78h112" /><circle cx="110" cy="78" r="23" /><path d="m99 78 8 8 16-17" /><rect x="94" y="2" width="32" height="23" rx="4" /><rect x="195" y="66" width="23" height="32" rx="4" /><rect x="94" y="131" width="32" height="23" rx="4" /><rect x="2" y="66" width="23" height="32" rx="4" /></svg> }

export function HowItWorks() {
  const { t } = useTranslation()
  const notes = [[t('landing.benefits.groupTitle'), t('landing.benefits.groupDescription'), '01'], [t('landing.benefits.gameTitle'), t('landing.benefits.gameDescription'), '02'], [t('landing.benefits.simpleTitle'), t('landing.benefits.simpleDescription'), '03']]
  return <section className="table-corner landing-deferred"><div className="mx-auto max-w-6xl px-5 py-18 sm:py-24"><div className="table-corner__intro"><p>{t('landing.benefits.eyebrow')}</p><h2>{t('landing.benefits.title')}</h2><span>{t('landing.benefits.description')}</span></div><div className="table-corner__board"><div className="table-corner__map"><SeatMap /><strong>{t('landing.benefits.mapLabel')}</strong></div><div className="table-corner__notes">{notes.map(([title, description, index]) => <article key={title as string}><b>{index}</b><div><h3>{title as string}</h3><p>{description as string}</p></div></article>)}</div><p className="table-corner__margin-note">{t('landing.benefits.marginNote')}</p></div></div></section>
}
