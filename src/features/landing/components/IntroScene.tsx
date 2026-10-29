import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/state/AuthContext';
import { gsap, MOTION_QUERY, useGSAP } from '@/lib/gsap';

const seats = [
  { name: 'Lina', kills: 2, points: 11, seat: 'north', color: 'blue' },
  { name: 'Marco', kills: 1, points: 9, seat: 'east', color: 'green' },
  { name: 'Sofía', kills: 0, points: 8, seat: 'south', color: 'violet' },
  { name: 'Tomás', kills: 1, points: 6, seat: 'west', color: 'red' },
];

const MASK_FROM = 6000;
const MASK_TO = 26;

export function IntroScene() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const sectionRef = useRef<HTMLElement>(null);
  const primaryTarget = !loading && user ? '/dashboard' : '/register';
  const primaryLabel =
    !loading && user ? t('landing.navigation.dashboard') : t('landing.navigation.createAccount');

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_QUERY, () => {
        const masked = sectionRef.current?.querySelector<HTMLElement>('.intro__masked');
        if (!masked) return;
        const mask = { t: 0 };
        const applyMask = () =>
          masked.style.setProperty(
            '--intro-mask',
            `${MASK_FROM * (MASK_TO / MASK_FROM) ** mask.t}vh`,
          );
        applyMask();
        gsap.set('.intro__logo', { autoAlpha: 0 });
        gsap.set('.intro__final > *', { autoAlpha: 0, y: 28 });

        gsap
          .timeline({
            defaults: { ease: 'none' },
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top top',
              end: 'bottom bottom',
              scrub: 1,
            },
          })
          .fromTo('.intro__scene', { scale: 1.1 }, { scale: 1, duration: 0.82 }, 0)
          .to('.intro__overlay', { autoAlpha: 0, y: -40, duration: 0.1 }, 0)
          .to(mask, { t: 1, duration: 0.72, onUpdate: applyMask }, 0.1)
          .to('.intro__logo', { autoAlpha: 1, duration: 0.04 }, 0.8)
          .to(masked, { autoAlpha: 0, duration: 0.05 }, 0.83)
          .to('.intro__logo', { rotation: -7, ease: 'power2.out', duration: 0.08 }, 0.84)
          .to(['.intro__logo', masked], { y: '-10vh', ease: 'power2.inOut', duration: 0.08 }, 0.84)
          .to(
            '.intro__final > *',
            { autoAlpha: 1, y: 0, ease: 'power2.out', duration: 0.05, stagger: 0.02 },
            0.88,
          );
      });
      return () => mm.revert();
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} className="intro">
      <div className="intro__stage">
        <div className="intro__masked">
          <div className="intro__scene" aria-hidden="true">
            <span className="intro__oval" />
            {seats.map((player) => (
              <div
                key={player.name}
                className={`intro-seat intro-seat--${player.seat} intro-seat--${player.color}`}
              >
                <span className="intro-seat__token">{player.name[0]}</span>
                <span className="intro-seat__info">
                  <strong>{player.name}</strong>
                  <small>
                    ☠ {player.kills} {t('landing.preview.kills')}
                  </small>
                </span>
                <b>{player.points}</b>
              </div>
            ))}
          </div>
          <div className="intro__overlay">
            <p className="intro__kicker">
              <span aria-hidden="true">✦</span> {t('landing.intro.kicker')}
            </p>
            <p className="intro__headline">
              {t('landing.intro.titleBefore')}
              <em>{t('landing.intro.titleAccent')}</em>
              {t('landing.intro.titleAfter')}
            </p>
            <span className="intro__hint" aria-hidden="true">
              {t('landing.intro.scrollHint')}
              <svg viewBox="0 0 24 24">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </span>
          </div>
        </div>
        <img className="intro__logo" src="/edh-tournaments-icon.svg" alt="" />
        <div className="intro__final">
          <p className="intro__eyebrow">{t('landing.hero.eyebrow')}</p>
          <h1>
            EDH <span>Tournaments</span>
          </h1>
          <p className="intro__description">{t('landing.intro.description')}</p>
          <div className="intro__actions">
            <Button asChild variant="outline" size="lg">
              <Link to={user ? '/dashboard' : '/login'}>
                {user ? t('landing.navigation.dashboard') : t('landing.navigation.login')}
              </Link>
            </Button>
            <Button asChild size="lg">
              <Link to={primaryTarget}>{primaryLabel}</Link>
            </Button>
          </div>
          <p className="intro__note">
            <span aria-hidden="true">✦</span> {t('landing.hero.noAccount')}
          </p>
        </div>
      </div>
    </section>
  );
}
