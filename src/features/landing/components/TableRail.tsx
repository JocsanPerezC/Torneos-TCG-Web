import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { gsap, MOTION_QUERY, ScrollTrigger, useGSAP } from '@/lib/gsap';

function SeatMap() {
  return (
    <svg viewBox="0 0 220 156" aria-hidden="true">
      <path d="M110 18c50 0 91 27 91 60s-41 60-91 60-91-27-91-60 41-60 91-60Z" />
      <path d="M110 41v74M54 78h112" />
      <circle cx="110" cy="78" r="23" />
      <path d="m99 78 8 8 16-17" />
      <rect x="94" y="2" width="32" height="23" rx="4" />
      <rect x="195" y="66" width="23" height="32" rx="4" />
      <rect x="94" y="131" width="32" height="23" rx="4" />
      <rect x="2" y="66" width="23" height="32" rx="4" />
    </svg>
  );
}

export function TableRail() {
  const { t, i18n } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const cards = [
    null,
    [t('landing.benefits.groupTitle'), t('landing.benefits.groupDescription')],
    [t('landing.benefits.gameTitle'), t('landing.benefits.gameDescription')],
    [t('landing.benefits.simpleTitle'), t('landing.benefits.simpleDescription')],
    [t('landing.rail.roundsTitle'), t('landing.rail.roundsDescription')],
    [t('landing.idea.title'), t('landing.idea.description')],
  ];

  // El ancho del riel cambia con el idioma; recalcula los recorridos.
  useEffect(() => {
    ScrollTrigger.refresh();
  }, [i18n.resolvedLanguage]);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      // Debe coincidir con la media query del riel en landing-scroll.css.
      mm.add(`${MOTION_QUERY} and (min-width: 768px)`, () => {
        const track = sectionRef.current?.querySelector<HTMLElement>('.rail__track');
        if (!track) return;
        gsap.to(track, {
          x: () => -Math.max(0, track.scrollWidth - document.documentElement.clientWidth),
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 1,
            invalidateOnRefresh: true,
          },
        });
      });
      // En celular las tarjetas van apiladas: cada una entra desde un lado al aparecer.
      mm.add(`${MOTION_QUERY} and (max-width: 767px)`, () => {
        gsap.utils.toArray<HTMLElement>('.rail-card', sectionRef.current).forEach((card, index) => {
          const side = index % 2 ? 1 : -1;
          gsap.from(card, {
            autoAlpha: 0,
            x: side * 48,
            rotation: side * 4,
            duration: 0.6,
            ease: 'back.out(1.4)',
            scrollTrigger: { trigger: card, start: 'top 88%', once: true },
          });
        });
      });
      return () => mm.revert();
    },
    { scope: sectionRef },
  );

  let number = 0;
  return (
    <section ref={sectionRef} className="rail">
      <div className="rail__stage">
        <header className="rail__intro">
          <p>{t('landing.benefits.eyebrow')}</p>
          <h2>{t('landing.benefits.title')}</h2>
          <span>{t('landing.benefits.description')}</span>
        </header>
        <div className="rail__track">
          {cards.map((card, index) =>
            card ? (
              <article className="rail-card" key={card[0]}>
                <b>{String(++number).padStart(2, '0')}</b>
                <h3>{card[0]}</h3>
                <p>{card[1]}</p>
              </article>
            ) : (
              <article className="rail-card rail-card--felt" key={index}>
                <SeatMap />
                <strong>{t('landing.benefits.mapLabel')}</strong>
              </article>
            ),
          )}
          <p className="rail-card rail-card--note">{t('landing.benefits.marginNote')}</p>
        </div>
      </div>
    </section>
  );
}
