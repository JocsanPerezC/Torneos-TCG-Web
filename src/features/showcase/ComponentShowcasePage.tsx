import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { ToastViewport } from '@/components/ui/toast';
import {
  BadgesSection,
  ButtonsSection,
  ContainersSection,
  FeedbackSection,
  FieldsSection,
  FoundationsSection,
  IdentitySection,
} from '@/features/showcase/BaseSections';
import {
  CounterSection,
  LandingSection,
  MetricsSection,
  NavigationSection,
  StatisticsSection,
  TournamentSection,
} from '@/features/showcase/AppSections';

const sections = [
  ['foundations', 'app.showcase.foundations'],
  ['buttons', 'app.showcase.buttons'],
  ['fields', 'app.showcase.fields'],
  ['badges', 'app.showcase.statuses'],
  ['feedback', 'app.showcase.feedback'],
  ['containers', 'app.showcase.containers'],
  ['identity', 'app.showcase.identity'],
  ['navigation', 'app.showcase.navigation'],
  ['metrics', 'app.showcase.metrics'],
  ['tournament', 'app.showcase.tournament'],
  ['statistics', 'app.showcase.statistics'],
  ['counter', 'app.shell.counter'],
  ['landing', 'app.showcase.landing'],
] as const;

export function ComponentShowcasePage() {
  const { t } = useTranslation();
  const [whiteBackground, setWhiteBackground] = useState(false);
  const [mobileWidth, setMobileWidth] = useState(false);

  return (
    <>
      <main className="showcase-page mx-auto min-h-screen w-full max-w-7xl px-4 py-10 sm:py-16">
        <header className="app-panel flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl">
            <h1 className="m-0 text-4xl leading-none sm:text-5xl">{t('app.showcase.title')}</h1>
            <p className="mb-0 mt-4 text-sm leading-6 text-muted-foreground sm:text-base">
              {t('app.showcase.description')}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="showcase-toggle">
              <input
                type="checkbox"
                checked={whiteBackground}
                onChange={(event) => setWhiteBackground(event.target.checked)}
              />
              {t('app.showcase.whiteBackground')}
            </label>
            <label className="showcase-toggle">
              <input
                type="checkbox"
                checked={mobileWidth}
                onChange={(event) => setMobileWidth(event.target.checked)}
              />
              {t('app.showcase.mobileWidth')}
            </label>
            <LanguageSelector />
          </div>
        </header>

        <div className="showcase-layout mt-6">
          <nav className="showcase-index" aria-label={t('app.showcase.index')}>
            <p>{t('app.showcase.index')}</p>
            <ol>
              {sections.map(([id, key]) => (
                <li key={id}>
                  <a href={`#${id}`}>{t(key)}</a>
                </li>
              ))}
            </ol>
          </nav>
          <div
            className={`showcase-canvas ${whiteBackground ? 'is-white' : ''} ${mobileWidth ? 'is-mobile' : ''}`}
          >
            <FoundationsSection />
            <ButtonsSection />
            <FieldsSection />
            <BadgesSection />
            <FeedbackSection />
            <ContainersSection />
            <IdentitySection />
            <NavigationSection />
            <MetricsSection />
            <TournamentSection />
            <StatisticsSection />
            <CounterSection />
            <LandingSection />
          </div>
        </div>
      </main>
      <ToastViewport />
    </>
  );
}
