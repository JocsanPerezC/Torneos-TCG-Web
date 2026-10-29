import { useRef, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { useAuth } from '@/state/AuthContext';
import { gsap, MOTION_QUERY, prefersReducedMotion, useGSAP } from '@/lib/gsap';

export function LandingHeader() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const headerRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDetailsElement>(null);
  const accountTarget = !loading && user ? '/dashboard' : '/register';
  const accountLabel =
    !loading && user ? t('landing.navigation.dashboard') : t('landing.navigation.createAccount');
  const closeMenu = () => menuRef.current?.removeAttribute('open');
  // Ya estamos en "/": el enlace no navega, así que volvemos arriba manualmente.
  const scrollToTop = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    closeMenu();
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };
  const anchors = [
    ['#como-funciona', t('landing.navigation.howItWorks')],
    ['#puntuacion', t('landing.navigation.scoring')],
    ['#preguntas', t('landing.navigation.faq')],
    ['#probar', t('landing.trial.action')],
  ];

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_QUERY, () => {
        gsap.fromTo(
          '.landing-header__progress',
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: 'none',
            scrollTrigger: { trigger: document.documentElement, start: 0, end: 'max', scrub: true },
          },
        );
      });
      return () => mm.revert();
    },
    { scope: headerRef },
  );

  return (
    <header ref={headerRef} className="landing-header">
      <div className="landing-header__bar">
        <Link to="/" className="landing-header__brand" onClick={scrollToTop}>
          <img src="/edh-tournaments-icon.svg" alt="" />
          <span className="landing-header__brand-name">
            EDH <span>Tournaments</span>
          </span>
        </Link>
        <nav className="landing-header__links" aria-label={t('landing.navigation.label')}>
          {anchors.map(([href, label]) => (
            <a key={href} href={href}>
              {label}
            </a>
          ))}
        </nav>
        <div className="landing-header__actions">
          <LanguageSelector compact />
          {!loading && !user && (
            <Button asChild variant="outline" className="landing-login">
              <Link to="/login">{t('landing.navigation.login')}</Link>
            </Button>
          )}
          <Button asChild className="landing-account">
            <Link to={accountTarget}>{accountLabel}</Link>
          </Button>
          <details ref={menuRef} className="landing-menu">
            <summary aria-label={t('landing.navigation.menu')}>
              <i />
              <i />
              <i />
            </summary>
            <div onClick={closeMenu}>
              {anchors.map(([href, label]) => (
                <a key={href} href={href}>
                  {label}
                </a>
              ))}
              {!user && <Link to="/login">{t('landing.navigation.login')}</Link>}
            </div>
          </details>
        </div>
      </div>
      <span className="landing-header__track" aria-hidden="true">
        <span className="landing-header__progress" />
      </span>
    </header>
  );
}
