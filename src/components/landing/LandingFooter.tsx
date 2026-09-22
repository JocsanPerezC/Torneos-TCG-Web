import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export function LandingFooter() {
  const { t } = useTranslation()

  return (
    <footer className="bg-[#5B1FE0] text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-5 gap-y-3 px-5 py-10 text-center text-base font-bold">
        <a href="#como-funciona">{t('landing.navigation.howItWorks')}</a><a href="#preguntas">{t('landing.navigation.faq')}</a><Link to="/login">{t('landing.navigation.login')}</Link><Link to="/privacy" target="_blank" rel="noreferrer">Privacy Policy</Link><Link to="/terms" target="_blank" rel="noreferrer">Terms &amp; Conditions</Link><a href="https://paypal.me/JocsanPerezCoto" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5"><img src="https://www.paypalobjects.com/webstatic/icon/pp258.png" alt="" className="size-5" />{t('landing.footer.support')}</a>
        <a href="https://company.wizards.com/en/legal/fancontentpolicy" target="_blank" rel="noreferrer" className="w-full max-w-3xl text-sm font-medium text-white/80 underline decoration-white/40 underline-offset-2 hover:text-white">EDH Tournaments is unofficial Fan Content permitted under the Fan Content Policy. Not approved/endorsed by Wizards. Portions of the materials used are property of Wizards of the Coast. © Wizards of the Coast LLC.</a>
        <span className="w-full text-sm font-medium text-white/70">{t('landing.footer.copyright')}</span>
        <a href="https://github.com/JocsanPerezC" target="_blank" rel="noreferrer" aria-label="GitHub de Jocsan Pérez Coto" title="GitHub" className="inline-flex text-white hover:text-white/70">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-current"><path d="M12 .6a11.4 11.4 0 0 0-3.6 22.2c.6.1.8-.3.8-.6v-2.2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.4-1.3-1.7-1.3-1.7-1.1-.8.1-.8.1-.8 1.2.1 1.9 1.3 1.9 1.3 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.6-.3-5.4-1.3-5.4-5.8 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0c2.2-1.5 3.2-1.2 3.2-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.5-2.8 5.5-5.4 5.8.4.4.8 1.1.8 2.1v3.1c0 .3.2.7.8.6A11.4 11.4 0 0 0 12 .6Z" /></svg>
        </a>
      </div>
    </footer>
  )
}
