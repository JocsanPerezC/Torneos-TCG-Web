import { useTranslation } from 'react-i18next'

export function ProjectIdea() {
  const { t } = useTranslation()
  const steps = ['rules', 'players', 'rounds', 'standings']

  return <section className="project-idea landing-deferred" aria-labelledby="la-idea">
    <div className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
      <div className="project-idea__card">
        <div className="project-idea__copy">
          <p>{t('landing.idea.eyebrow')}</p>
          <h2 id="la-idea">{t('landing.idea.title')}</h2>
          <span>{t('landing.idea.description')}</span>
          <div className="project-idea__support">
            <a href="https://paypal.me/JocsanPerezCoto" target="_blank" rel="noreferrer"><img src="https://www.paypalobjects.com/webstatic/icon/pp258.png" alt="" />{t('landing.footer.support')}</a>
            <small>{t('landing.idea.supportNote')}</small>
          </div>
        </div>
        <ol className="project-idea__flow" aria-label={t('landing.idea.flowLabel')}>
          {steps.map((step, index) => <li key={step}><b>0{index + 1}</b><span>{t(`landing.idea.${step}`)}</span></li>)}
        </ol>
      </div>
    </div>
  </section>
}
