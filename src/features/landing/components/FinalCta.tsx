import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { gsap, MOTION_QUERY, useGSAP } from '@/lib/gsap';

export function FinalCta() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const title = t('landing.cta.title');

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_QUERY, () => {
        gsap
          .timeline({
            scrollTrigger: { trigger: sectionRef.current, start: 'top 70%', once: true },
          })
          .from('.last-call__sheet', {
            autoAlpha: 0,
            scale: 0.92,
            rotation: -2,
            duration: 0.6,
            ease: 'back.out(1.5)',
          })
          .from(
            '.last-call__word',
            {
              autoAlpha: 0,
              y: 40,
              rotation: () => gsap.utils.random(-8, 8),
              duration: 0.5,
              ease: 'back.out(1.8)',
              stagger: 0.06,
            },
            '-=0.3',
          );
      });
      return () => mm.revert();
    },
    { scope: sectionRef, dependencies: [title], revertOnUpdate: true },
  );

  return (
    <section ref={sectionRef} id="probar" className="last-call">
      <div className="mx-auto max-w-6xl px-5 py-18 sm:py-24">
        <div className="last-call__sheet">
          <svg viewBox="0 0 180 120" aria-hidden="true">
            <path d="M33 93 90 25l57 68H33Z" />
            <path d="m54 83 36-42 36 42M90 25v68" />
            <circle cx="90" cy="25" r="8" />
          </svg>
          <div>
            <p>{t('landing.cta.eyebrow')}</p>
            <h2 aria-label={title}>
              {title.split(' ').map((word, index) => (
                <span className="last-call__word" aria-hidden="true" key={`${word}-${index}`}>
                  {word}
                </span>
              ))}
            </h2>
            <span>{t('landing.trial.ctaDescription')}</span>
            <Button asChild size="lg">
              <Link to="/trial">{t('landing.trial.create')}</Link>
            </Button>
          </div>
          <i>{t('landing.cta.sideNote')}</i>
        </div>
      </div>
    </section>
  );
}
