import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, ScanLine, ShieldCheck, Table, Trophy, Users } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { AuthenticatedShell, NavigationLink } from '../../components/layout/AuthenticatedShell';
import { Header } from '../../components/layout/PublicHeader';
import { Metric } from '../tournaments/components/Metric';
import { Metric as TrialMetric } from '../trial/components/Metric';
import { AdminMetric } from '../admin/components/AdminMetric';
import { RoundTimer } from '../tournaments/components/RoundTimer';
import { DraftPodCard } from '../tournaments/components/DraftPodCard';
import { PodCard } from '../tournaments/components/PodCard';
import { OutcomeButtons } from '../tournaments/components/OutcomeButtons';
import { Standings } from '../tournaments/components/Standings';
import { TournamentJoinLink } from '../tournaments/components/TournamentJoinLink';
import { QrScannerModal } from '../tournaments/components/QrScannerModal';
import { RoundEditor } from '../trial/components/RoundEditor';
import { PodResults } from '../trial/components/PodResults';
import { BattleLedger } from '../tournaments/components/BattleLedger';
import {
  ArrowGlyph,
  BalanceGlyph,
  CountUp,
  FlameTrail,
  KillTally,
  RoundPips,
  Sparkline,
  SwordLink,
} from '../tournaments/components/BattleGlyphs';
import { LandingHeader } from '../landing/components/LandingHeader';
import { FeatureList } from '../landing/components/FeatureList';
import { Faq } from '../landing/components/Faq';
import { FinalCta } from '../landing/components/FinalCta';
import { LandingFooter } from '../landing/components/LandingFooter';
import { ScaledFrame, ShowcaseSection, Variant } from './ShowcaseSection';
import { ShowcaseAuthProvider, ShowcaseTournamentProvider } from './providers';
import {
  podComplete,
  podEmpty,
  podPartial,
  roundActive,
  roundCompleted,
  roundDraft,
  showcaseEmptyStatistics,
  showcaseJoinPreview,
  showcaseNames,
  showcaseStatistics,
  showcaseTournament,
} from './fixtures';

const noop = () => undefined;

export function NavigationSection() {
  const { t } = useTranslation();
  return (
    <ShowcaseSection
      id="navigation"
      titleKey="app.showcase.navigation"
      sources={[
        'AuthenticatedShell, NavigationLink · src/components/layout/AuthenticatedShell.tsx',
        'Header · src/components/layout/PublicHeader.tsx',
        '.landing-menu · src/features/landing/components/LandingHeader.tsx',
      ]}
    >
      <Variant label="NavigationLink">
        <nav className="showcase-nav-sample" aria-label={t('app.showcase.navigation')}>
          <NavigationLink
            item={{ to: '/muestrario', label: t('app.showcase.active'), icon: LayoutDashboard }}
          />
          <NavigationLink
            item={{ to: '/dashboard', label: t('app.showcase.inactive'), icon: Trophy }}
          />
          <NavigationLink
            item={{ to: '/admin', label: 'accent', icon: ShieldCheck, accent: true }}
          />
          <NavigationLink
            item={{ to: '/dashboard', label: 'compact', compactLabel: 'compact', icon: Users }}
            compact
          />
        </nav>
      </Variant>
      <Variant label="AuthenticatedShell">
        <ScaledFrame height={620} scale={0.55}>
          <ShowcaseAuthProvider>
            <AuthenticatedShell
              tournament={{ id: showcaseTournament.id, name: showcaseTournament.name }}
            >
              <div className="app-panel">{t('app.showcase.shellContent')}</div>
            </AuthenticatedShell>
          </ShowcaseAuthProvider>
        </ScaledFrame>
      </Variant>
      <div className="grid gap-5 lg:grid-cols-2">
        <Variant label={`Header · ${t('app.showcase.signedIn')}`}>
          <ScaledFrame height={110} scale={0.45}>
            <ShowcaseAuthProvider>
              <Header />
            </ShowcaseAuthProvider>
          </ScaledFrame>
        </Variant>
        <Variant label={`Header · ${t('app.showcase.signedOut')}`}>
          <ScaledFrame height={110} scale={0.45}>
            <ShowcaseAuthProvider signedIn={false}>
              <Header />
            </ShowcaseAuthProvider>
          </ScaledFrame>
        </Variant>
      </div>
      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <Variant label="LandingHeader">
          <ScaledFrame height={110} scale={0.5}>
            <ShowcaseAuthProvider signedIn={false}>
              <LandingHeader />
            </ShowcaseAuthProvider>
          </ScaledFrame>
        </Variant>
        <Variant label=".landing-menu">
          <ScaledFrame width={390} height={360} scale={0.8}>
            <iframe
              className="showcase-iframe"
              src="/"
              title={t('app.showcase.landingFrame')}
              loading="lazy"
            />
          </ScaledFrame>
          <p className="showcase-note">{t('app.showcase.menuHint')}</p>
        </Variant>
      </div>
    </ShowcaseSection>
  );
}

export function MetricsSection() {
  const { t } = useTranslation();
  return (
    <ShowcaseSection
      id="metrics"
      titleKey="app.showcase.metrics"
      sources={[
        'Metric · src/features/tournaments/components/Metric.tsx',
        'Metric · src/features/trial/components/Metric.tsx',
        'AdminMetric · src/features/admin/components/AdminMetric.tsx',
      ]}
    >
      <p className="showcase-note m-0">{t('app.showcase.metricsDuplicate')}</p>
      <div className="grid gap-5 lg:grid-cols-3">
        <Variant label="Metric" source="tournament/Metric.tsx" duplicate>
          <div className="overview-board__metrics">
            <Metric label={t('app.tournament.activePlayers')} value={7} icon={Users} />
            <Metric label={t('app.tournament.rounds')} value="2/3" icon={Table} />
          </div>
        </Variant>
        <Variant label="Metric" source="trial/Metric.tsx" duplicate>
          <div className="grid gap-3 sm:grid-cols-2">
            <TrialMetric label={t('landing.trial.activePlayers')} value={7} />
            <TrialMetric label={t('landing.trial.rounds')} value="2/3" />
          </div>
        </Variant>
        <Variant label="AdminMetric" source="admin/AdminMetric.tsx" duplicate>
          <div className="grid gap-3">
            <AdminMetric
              icon={<Users size={19} />}
              label={t('app.admin.metrics.accounts')}
              value={42}
            />
          </div>
        </Variant>
      </div>
    </ShowcaseSection>
  );
}

export function TournamentSection() {
  const { t } = useTranslation();
  const [qrOpen, setQrOpen] = useState(false);
  const trialLabels = {
    start: t('landing.trial.startRound'),
    complete: t('landing.trial.completeRound'),
    table: t('landing.trial.table'),
    players: t('landing.trial.players'),
    points: t('landing.trial.points'),
    kills: t('landing.trial.kills'),
    outcome: t('landing.trial.outcome'),
    chooseOutcome: t('landing.trial.chooseOutcome'),
    win: t('landing.trial.win'),
    loss: t('landing.trial.loss'),
    draw: t('landing.trial.draw'),
    draft: t('landing.trial.roundStatus.borrador'),
    active: t('landing.trial.roundStatus.activa'),
    completed: t('landing.trial.roundStatus.completada'),
  };
  const draftPod = roundDraft.pods[1];
  return (
    <ShowcaseTournamentProvider>
      <ShowcaseSection
        id="tournament"
        titleKey="app.showcase.tournament"
        sources={[
          'RoundTimer, DraftPodCard, PodCard, OutcomeButtons, Standings · src/features/tournaments/components/',
          'RoundEditor, PodResults · src/features/trial/components/',
          'TournamentJoinLink, QrScannerModal · src/features/tournaments/components/',
        ]}
      >
        <Variant label="RoundTimer">
          <div className="flex flex-wrap items-center gap-6">
            <span className="showcase-inline">
              <RoundTimer round={roundDraft} />
              <small>{t('app.showcase.notStarted')}</small>
            </span>
            <span className="showcase-inline">
              <RoundTimer round={roundActive} />
              <small>{t('app.showcase.running')}</small>
            </span>
            <span className="showcase-inline">
              <RoundTimer round={roundCompleted} />
              <small>{t('app.showcase.stopped')}</small>
            </span>
          </div>
          <p className="showcase-note">{t('app.showcase.timerNote')}</p>
        </Variant>
        <Variant label="DraftPodCard">
          <div className="rounds-deck__tables">
            <DraftPodCard
              pod={roundDraft.pods[0]}
              names={showcaseNames}
              isDropTarget={false}
              onDragStart={noop}
              onDragEnter={noop}
              onDragEnd={noop}
              onDrop={noop}
            />
            <DraftPodCard
              pod={draftPod}
              names={showcaseNames}
              draggedPlayer={draftPod.playerIds[0]}
              isDropTarget
              onDragStart={noop}
              onDragEnter={noop}
              onDragEnd={noop}
              onDrop={noop}
            />
          </div>
        </Variant>
        <Variant label="PodCard">
          <div className="rounds-deck__tables">
            {[
              [podEmpty, t('app.showcase.noResults')],
              [podPartial, t('app.showcase.partial')],
              [podComplete, t('app.showcase.complete')],
            ].map(([pod, label]) => (
              <div key={label as string} className="grid content-start gap-2">
                <small className="showcase-note m-0">{label as string}</small>
                <PodCard
                  tournamentId={showcaseTournament.id}
                  roundId={roundActive.id}
                  pod={pod as typeof podEmpty}
                  names={showcaseNames}
                  readOnly={false}
                  editable={false}
                />
              </div>
            ))}
            <div className="grid content-start gap-2">
              <small className="showcase-note m-0">{t('app.showcase.editable')}</small>
              <PodCard
                tournamentId={showcaseTournament.id}
                roundId={roundActive.id}
                pod={podPartial}
                names={showcaseNames}
                readOnly={false}
                editable
              />
            </div>
          </div>
        </Variant>
        <Variant label="OutcomeButtons">
          <div className="grid gap-3">
            {([undefined, 'win', 'loss', 'draw'] as const).map((outcome) => (
              <div key={outcome ?? 'none'} className="flex flex-wrap items-center gap-3">
                <code className="w-12 text-xs">{outcome ?? '—'}</code>
                <OutcomeButtons playerId={`showcase-${outcome ?? 'none'}`} outcome={outcome} />
              </div>
            ))}
          </div>
        </Variant>
        <Variant label="RoundEditor · PodResults" source="src/features/trial/components/" duplicate>
          <RoundEditor
            round={roundActive}
            tournament={showcaseTournament}
            disabled={false}
            onStart={noop}
            onResult={noop}
            onComplete={noop}
            labels={trialLabels}
          />
          <div className="mt-4 max-w-md">
            <PodResults
              pod={podComplete}
              tournament={showcaseTournament}
              roundId={roundCompleted.id}
              disabled
              onResult={noop}
              labels={trialLabels}
            />
          </div>
          <p className="showcase-note">{t('app.showcase.trialDuplicate')}</p>
        </Variant>
        <Variant label="Standings">
          <Standings />
        </Variant>
        <Variant label="TournamentJoinLink">
          <TournamentJoinLink tournamentId={showcaseTournament.id} preview={showcaseJoinPreview} />
        </Variant>
        <Variant label="QrScannerModal">
          <Button
            type="button"
            className="app-button app-button--secondary"
            onClick={() => setQrOpen(true)}
          >
            <ScanLine size={16} aria-hidden="true" />
            {t('app.showcase.openQr')}
          </Button>
          {qrOpen && <QrScannerModal preview onClose={() => setQrOpen(false)} onScan={noop} />}
        </Variant>
      </ShowcaseSection>
    </ShowcaseTournamentProvider>
  );
}

export function StatisticsSection() {
  const { t } = useTranslation();
  const glyphs = [
    [
      'CountUp',
      <strong className="text-3xl" key="c">
        <CountUp value={128} />
      </strong>,
    ],
    ['KillTally', <KillTally count={13} key="k" />],
    ['FlameTrail', <FlameTrail count={5} key="f" />],
    ['RoundPips', <RoundPips count={12} key="r" />],
    ['SwordLink', <SwordLink key="s" />],
    ['BalanceGlyph', <BalanceGlyph difference={2} key="b" />],
    ['ArrowGlyph +', <ArrowGlyph value={4} key="a1" />],
    ['ArrowGlyph −', <ArrowGlyph value={-3} key="a2" />],
    ['ArrowGlyph 0', <ArrowGlyph value={0} key="a3" />],
    ['Sparkline', <Sparkline scores={[3, 5, 4, 7, 6]} key="sp" />],
  ] as const;
  return (
    <ShowcaseSection
      id="statistics"
      titleKey="app.showcase.statistics"
      sources={[
        'BattleLedger · src/features/tournaments/components/BattleLedger.tsx',
        'BattleGlyphs · src/features/tournaments/components/BattleGlyphs.tsx',
      ]}
    >
      <Variant label="BattleGlyphs">
        <ul className="showcase-glyphs">
          {glyphs.map(([name, glyph]) => (
            <li key={name}>
              {glyph}
              <code>{name}</code>
            </li>
          ))}
        </ul>
        <p className="showcase-note">{t('app.showcase.arrowNote')}</p>
      </Variant>
      <Variant label={`BattleLedger · ${t('app.showcase.complete')}`}>
        <BattleLedger statistics={showcaseStatistics} />
      </Variant>
      <Variant label={`BattleLedger · ${t('app.showcase.noResults')}`}>
        <BattleLedger statistics={showcaseEmptyStatistics} />
      </Variant>
    </ShowcaseSection>
  );
}

export function LandingSection() {
  const { t } = useTranslation();
  return (
    <ShowcaseSection
      id="landing"
      titleKey="app.showcase.landing"
      sources={[
        'LandingPage · src/features/landing/LandingPage.tsx',
        'src/features/landing/components/*.tsx',
      ]}
    >
      <p className="showcase-note m-0">{t('app.showcase.landingRemoved')}</p>
      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <Variant label={`IntroScene · NightScroll · TableRail (${t('app.showcase.desktop')})`}>
          <ScaledFrame height={800} scale={0.5}>
            <iframe
              className="showcase-iframe"
              src="/"
              title={t('app.showcase.landingFrame')}
              loading="lazy"
            />
          </ScaledFrame>
        </Variant>
        <Variant label={`LandingPage (${t('app.showcase.mobile')})`}>
          <ScaledFrame width={390} height={760} scale={0.55}>
            <iframe
              className="showcase-iframe"
              src="/"
              title={t('app.showcase.landingFrame')}
              loading="lazy"
            />
          </ScaledFrame>
        </Variant>
      </div>
      <p className="showcase-note m-0">{t('app.showcase.landingFrameHint')}</p>
      <ShowcaseAuthProvider signedIn={false}>
        <div className="landing-theme grid gap-5">
          <Variant label="FeatureList" className="showcase-variant--bleed">
            <FeatureList />
          </Variant>
          <Variant label="Faq" className="showcase-variant--bleed">
            <Faq />
          </Variant>
          <Variant label="FinalCta" className="showcase-variant--bleed">
            <FinalCta />
          </Variant>
          <Variant label="LandingFooter" className="showcase-variant--bleed">
            <LandingFooter />
          </Variant>
        </div>
      </ShowcaseAuthProvider>
    </ShowcaseSection>
  );
}
