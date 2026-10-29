import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Accordion, AccordionItem } from '@/components/ui/accordion';
import { gsap, MOTION_QUERY, useGSAP } from '@/lib/gsap';

export function Faq() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const questions = [
    [t('landing.faq.accountQuestion'), t('landing.faq.accountAnswer')],
    [t('landing.faq.scoringQuestion'), t('landing.faq.scoringAnswer')],
    [t('landing.faq.gameQuestion'), t('landing.faq.gameAnswer')],
    [t('landing.faq.shareQuestion'), t('landing.faq.shareAnswer')],
  ];

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_QUERY, () => {
        gsap.from(['.faq-notebook header > *', '.faq-notebook__accordion details'], {
          autoAlpha: 0,
          y: 28,
          duration: 0.55,
          ease: 'power2.out',
          stagger: 0.08,
          scrollTrigger: { trigger: sectionRef.current, start: 'top 72%', once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} id="preguntas" className="faq-notebook">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-18 sm:grid-cols-[.75fr_1.25fr] sm:py-24">
        <header>
          <p>{t('landing.faq.eyebrow')}</p>
          <h2>{t('landing.faq.title')}</h2>
          <span>{t('landing.faq.description')}</span>
          <i aria-hidden>?</i>
        </header>
        <div className="faq-notebook__accordion">
          <Accordion>
            {questions.map(([title, answer], index) => (
              <AccordionItem key={title} title={`${String(index + 1).padStart(2, '0')} · ${title}`}>
                {answer}
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
