import { Accordion, AccordionItem } from '@/components/ui/accordion'
import { useTranslation } from 'react-i18next'

export function Faq() {
  const { t } = useTranslation()
  const questions = [[t('landing.faq.accountQuestion'), t('landing.faq.accountAnswer')], [t('landing.faq.scoringQuestion'), t('landing.faq.scoringAnswer')], [t('landing.faq.gameQuestion'), t('landing.faq.gameAnswer')], [t('landing.faq.shareQuestion'), t('landing.faq.shareAnswer')]]
  return <section id="preguntas" className="faq-notebook landing-deferred"><div className="mx-auto grid max-w-6xl gap-8 px-5 py-18 sm:grid-cols-[.75fr_1.25fr] sm:py-24"><header><p>{t('landing.faq.eyebrow')}</p><h2>{t('landing.faq.title')}</h2><span>{t('landing.faq.description')}</span><i aria-hidden>?</i></header><div className="faq-notebook__accordion"><Accordion>{questions.map(([title, answer], index) => <AccordionItem key={title as string} title={`${String(index + 1).padStart(2, '0')} · ${title}`}>{answer}</AccordionItem>)}</Accordion></div></div></section>
}
