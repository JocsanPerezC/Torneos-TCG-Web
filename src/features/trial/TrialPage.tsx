import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { GitBranch, LockKeyhole, Plus, Sparkles, Table, Trophy, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { Metric } from '@/components/ui/Metric';
import { Modal } from '@/components/ui/modal';
import { AccountLock } from '@/features/trial/components/AccountLock';
import { RoundEditor } from '@/features/trial/components/RoundEditor';
import { makePairings } from '@/domain/pairing';
import { hasCompletePodOutcomes, isValidPodResult, standings } from '@/domain/scoring';
import { normalizeName, uid, type Result, type Tournament } from '@/domain/types';
import { field, panel, primary } from '@/components/ui/classes';

type TrialTab = 'overview' | 'players' | 'rounds' | 'standings' | 'statistics' | 'settings';

export function TrialPage() {
  const { t } = useTranslation();
  const [tournament, setTournament] = useState<Tournament>();
  const [tab, setTab] = useState<TrialTab>('overview');
  const [message, setMessage] = useState('');
  const [addingPlayers, setAddingPlayers] = useState(false);
  const [playerSearch, setPlayerSearch] = useState('');

  const updateTournament = (change: (current: Tournament) => void) => {
    setTournament((current) => {
      if (!current) return current;
      const next = structuredClone(current);
      change(next);
      return next;
    });
  };

  function createTournament(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const plannedRounds = Number(values.get('rounds'));
    const maxPlayers = Number(values.get('maxPlayers'));
    const maxTables = Number(values.get('maxTables'));
    const name = String(values.get('name')).trim();

    if (
      !name ||
      !Number.isInteger(plannedRounds) ||
      plannedRounds < 1 ||
      !Number.isInteger(maxPlayers) ||
      maxPlayers < 3 ||
      !Number.isInteger(maxTables) ||
      maxTables < 1
    ) {
      setMessage(t('landing.trial.invalidSetup'));
      return;
    }

    setTournament({
      id: uid(),
      ownerId: 'trial',
      name,
      format: String(values.get('format')).trim() || 'Commander',
      information: '',
      plannedRounds,
      status: 'activo',
      isPublic: false,
      publicSlug: '',
      maxPlayers,
      maxTables,
      players: [],
      rounds: [],
      createdAt: new Date().toISOString(),
    });
    setMessage('');
  }

  function addPlayers(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!tournament) return;
    const names = String(new FormData(event.currentTarget).get('names'))
      .split('\n')
      .map((name) => name.trim())
      .filter(Boolean);
    const known = new Set(tournament.players.map((player) => normalizeName(player.name)));
    const playersToAdd: string[] = [];
    let duplicate = false;
    let full = false;

    for (const name of names) {
      if (known.has(normalizeName(name))) {
        duplicate = true;
        continue;
      }
      if (tournament.players.length + playersToAdd.length >= tournament.maxPlayers) {
        full = true;
        break;
      }
      known.add(normalizeName(name));
      playersToAdd.push(name);
    }

    if (playersToAdd.length) {
      updateTournament((current) => {
        playersToAdd.forEach((name) =>
          current.players.push({
            id: uid(),
            name,
            active: true,
            tieBreaker: current.players.length + 1,
          }),
        );
      });
      event.currentTarget.reset();
      setAddingPlayers(false);
    }
    setMessage(
      full
        ? t('landing.trial.playerLimit', { count: tournament.maxPlayers })
        : playersToAdd.length
          ? t('landing.trial.playersAdded', { count: playersToAdd.length })
          : duplicate
            ? t('landing.trial.duplicatePlayer')
            : t('landing.trial.enterPlayer'),
    );
  }

  function generateRound() {
    if (!tournament) return;
    if (tournament.status === 'finalizado') return setMessage(t('landing.trial.finishedReadOnly'));
    if (tournament.rounds.some((round) => round.status !== 'completada'))
      return setMessage(t('landing.trial.completeCurrentRound'));
    if (tournament.rounds.length >= tournament.plannedRounds)
      return setMessage(t('landing.trial.allRoundsGenerated'));
    const players = tournament.players.filter((player) => player.active);
    if (players.length < 3) return setMessage(t('landing.trial.minimumPlayers'));

    const seed = Math.floor(Math.random() * 2 ** 31);
    const points = Object.fromEntries(
      standings(tournament).map((row) => [row.player.id, row.points]),
    );
    const pods = makePairings(players, tournament.rounds, points, seed, tournament.maxTables);
    updateTournament((current) => {
      current.rounds.push({
        id: uid(),
        number: current.rounds.length + 1,
        status: 'borrador',
        seed,
        pods: pods.map((playerIds, index) => ({ id: uid(), number: index + 1, playerIds })),
      });
    });
    setMessage(t('landing.trial.roundGenerated'));
  }

  function startRound(roundId: string) {
    updateTournament((current) => {
      const round = current.rounds.find((item) => item.id === roundId);
      if (round) {
        round.status = 'activa';
        round.startedAt = new Date().toISOString();
      }
    });
    setMessage(t('landing.trial.roundStarted'));
  }

  function updateResult(roundId: string, podId: string, playerId: string, patch: Partial<Result>) {
    updateTournament((current) => {
      const pod = current.rounds
        .find((round) => round.id === roundId)
        ?.pods.find((item) => item.id === podId);
      if (!pod) return;
      const results = pod.playerIds.map((id) => {
        const previous = pod.results?.find((result) => result.playerId === id) ?? {
          playerId: id,
          points: 0,
          kills: 0,
        };
        return id === playerId ? { ...previous, ...patch } : previous;
      });
      pod.results = results;
    });
  }

  function completeRound(roundId: string) {
    if (!tournament) return;
    const round = tournament.rounds.find((item) => item.id === roundId);
    if (!round) return;
    if (!round.pods.every(isValidPodResult)) return setMessage(t('landing.trial.completeResults'));
    if (!round.pods.every(hasCompletePodOutcomes))
      return setMessage(t('landing.trial.completeOutcomes'));

    updateTournament((current) => {
      const currentRound = current.rounds.find((item) => item.id === roundId);
      if (currentRound) {
        currentRound.status = 'completada';
        currentRound.endedAt = new Date().toISOString();
      }
    });
    setMessage(t('landing.trial.roundCompleted'));
  }

  function finishTournament() {
    if (!tournament) return;
    if (tournament.rounds.some((round) => round.status !== 'completada'))
      return setMessage(t('landing.trial.finishIncomplete'));
    updateTournament((current) => {
      current.status = 'finalizado';
    });
    setMessage(t('landing.trial.tournamentFinished'));
  }

  if (!tournament) {
    return (
      <TrialShell>
        <main className="mx-auto w-full max-w-2xl px-4 pb-10 pt-28">
          <section className={panel}>
            <p className="text-xs font-bold tracking-[.15em] text-accent">
              {t('landing.trial.eyebrow')}
            </p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
              {t('landing.trial.createTitle')}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
              {t('landing.trial.createDescription')}
            </p>
            <p className="mt-5 rounded-xl border border-dashed border-border bg-secondary/50 px-4 py-3 text-sm font-semibold text-muted-foreground">
              {t('landing.trial.reloadWarning')}
            </p>
            {message && (
              <p role="alert" className="mt-4 text-sm font-semibold text-danger-text">
                {message}
              </p>
            )}
            <form className="mt-6 space-y-4" onSubmit={createTournament}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold sm:col-span-2">
                  {t('landing.trial.tournamentName')}
                  <input
                    autoFocus
                    required
                    name="name"
                    className={field}
                    placeholder={t('landing.trial.namePlaceholder')}
                  />
                </label>
                <label className="text-sm font-semibold">
                  {t('landing.trial.format')}
                  <input name="format" defaultValue="Commander" className={field} />
                </label>
                <label className="text-sm font-semibold">
                  {t('landing.trial.plannedRounds')}
                  <input
                    required
                    name="rounds"
                    type="number"
                    min="1"
                    max="30"
                    defaultValue="3"
                    className={field}
                  />
                </label>
                <label className="text-sm font-semibold">
                  {t('landing.trial.maxPlayers')}
                  <input
                    required
                    name="maxPlayers"
                    type="number"
                    min="3"
                    max="50"
                    defaultValue="16"
                    className={field}
                  />
                </label>
                <label className="text-sm font-semibold">
                  {t('landing.trial.maxTables')}
                  <input
                    required
                    name="maxTables"
                    type="number"
                    min="1"
                    max="25"
                    defaultValue="4"
                    className={field}
                  />
                </label>
              </div>
              <div className="flex justify-end">
                <button className={primary}>{t('landing.trial.create')}</button>
              </div>
            </form>
          </section>
        </main>
      </TrialShell>
    );
  }

  const rows = standings(tournament);
  const filteredPlayers = tournament.players.filter((player) =>
    player.name.toLocaleLowerCase().includes(playerSearch.trim().toLocaleLowerCase()),
  );
  const currentRound = tournament.rounds.at(-1);
  const locked = tournament.status === 'finalizado';
  const tabs: { id: TrialTab; label: string }[] = [
    { id: 'overview', label: t('landing.trial.tabs.overview') },
    { id: 'players', label: t('landing.trial.tabs.players') },
    { id: 'rounds', label: t('landing.trial.tabs.rounds') },
    { id: 'standings', label: t('landing.trial.tabs.standings') },
    { id: 'statistics', label: t('landing.trial.tabs.statistics') },
    { id: 'settings', label: t('landing.trial.tabs.settings') },
  ];

  return (
    <TrialShell>
      <main className="mx-auto w-full max-w-6xl px-4 pb-10 pt-24">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold tracking-[.15em] text-accent">
              {t('landing.trial.eyebrow')}
            </p>
            <h1 className="mt-1 text-3xl font-bold sm:text-4xl">{tournament.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{tournament.format}</p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${locked ? 'bg-violet-soft text-violet' : 'bg-success-soft text-primary-strong'}`}
          >
            {locked ? t('landing.trial.finished') : t('landing.trial.active')}
          </span>
        </div>
        <p className="mb-5 rounded-xl border border-dashed border-border bg-secondary/50 px-4 py-3 text-sm font-semibold text-muted-foreground">
          {t('landing.trial.reloadWarning')}
        </p>
        <nav
          aria-label={t('landing.trial.navigation')}
          className="mb-6 flex gap-1 overflow-x-auto rounded-2xl border border-border bg-card p-1"
        >
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-bold transition-colors ${tab === item.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
            >
              {item.label}
            </button>
          ))}
        </nav>
        {message && (
          <p
            role="status"
            className="mb-5 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold text-muted-foreground"
          >
            {message}
          </p>
        )}

        {tab === 'overview' && (
          <section className={panel}>
            <h2 className="text-xl font-bold">{t('landing.trial.overviewTitle')}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Metric
                label={t('landing.trial.activePlayers')}
                value={tournament.players.filter((player) => player.active).length}
                icon={Users}
              />
              <Metric
                label={t('landing.trial.rounds')}
                value={`${tournament.rounds.length}/${tournament.plannedRounds}`}
                icon={GitBranch}
              />
              <Metric
                label={t('landing.trial.currentRound')}
                value={currentRound ? currentRound.number : '—'}
                icon={Table}
              />
            </div>
            <div className="mt-5 rounded-2xl bg-secondary/60 p-4 text-sm text-muted-foreground">
              <strong className="block text-foreground">
                {currentRound
                  ? t('landing.trial.currentRoundLabel', { number: currentRound.number })
                  : t('landing.trial.readyForPlayers')}
              </strong>
              <p className="mt-1">
                {currentRound
                  ? t(`landing.trial.roundStatus.${currentRound.status}`)
                  : t('landing.trial.readyForPlayersDescription')}
              </p>
            </div>
          </section>
        )}

        {tab === 'players' && (
          <section className={panel}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">{t('landing.trial.tabs.players')}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('landing.trial.playerCount', {
                    count: tournament.players.length,
                    max: tournament.maxPlayers,
                  })}
                </p>
              </div>
              <button disabled={locked} onClick={() => setAddingPlayers(true)} className={primary}>
                <Plus size={16} />
                {t('landing.trial.addPlayers')}
              </button>
            </div>
            <label className="mt-5 block">
              <span className="sr-only">{t('app.tournament.searchPlayers')}</span>
              <input
                type="search"
                value={playerSearch}
                onChange={(event) => setPlayerSearch(event.target.value)}
                placeholder={t('app.tournament.searchPlayers')}
                className={`${field} mt-0 max-w-md`}
              />
            </label>
            <div className="mt-4 max-h-[32rem] space-y-2 overflow-y-auto pr-1">
              {filteredPlayers.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
                >
                  <span className="font-semibold">{player.name}</span>
                  <span className="text-xs font-bold text-primary-strong">
                    {t('landing.trial.active')}
                  </span>
                </div>
              ))}
              {!filteredPlayers.length && (
                <p className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
                  {playerSearch ? t('app.tournament.noPlayersFound') : t('landing.trial.noPlayers')}
                </p>
              )}
            </div>
            {addingPlayers && (
              <Modal
                title={t('landing.trial.addPlayers')}
                description={t('landing.trial.addPlayersDescription')}
                onClose={() => setAddingPlayers(false)}
              >
                <form className="space-y-4" onSubmit={addPlayers}>
                  <textarea
                    required
                    name="names"
                    rows={7}
                    className={`${field} mt-0 resize-y`}
                    placeholder={t('landing.trial.playersPlaceholder')}
                  />
                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => setAddingPlayers(false)}>
                      {t('app.common.cancel')}
                    </Button>
                    <button className={primary}>
                      <Plus size={16} />
                      {t('landing.trial.addPlayers')}
                    </button>
                  </div>
                </form>
              </Modal>
            )}
          </section>
        )}

        {tab === 'rounds' && (
          <section className="space-y-5">
            <div className={`${panel} flex flex-wrap items-center justify-between gap-4`}>
              <div>
                <h2 className="text-xl font-bold">{t('landing.trial.tabs.rounds')}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('landing.trial.roundsDescription')}
                </p>
              </div>
              <button
                disabled={
                  locked ||
                  Boolean(currentRound && currentRound.status !== 'completada') ||
                  tournament.rounds.length >= tournament.plannedRounds
                }
                onClick={generateRound}
                className={primary}
              >
                <Sparkles size={16} />
                {t('landing.trial.generateRound')}
              </button>
            </div>
            {!currentRound && (
              <p className={`${panel} text-sm text-muted-foreground`}>
                {t('landing.trial.noRounds')}
              </p>
            )}
            {currentRound && (
              <RoundEditor
                round={currentRound}
                tournament={tournament}
                disabled={locked}
                onStart={startRound}
                onResult={updateResult}
                onComplete={completeRound}
                labels={{
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
                }}
              />
            )}
          </section>
        )}

        {tab === 'standings' && (
          <section className={panel}>
            <h2 className="text-xl font-bold">{t('landing.trial.tabs.standings')}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('landing.trial.standingsDescription')}
            </p>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[430px] text-left text-sm">
                <thead>
                  <tr>
                    <th className="p-2">#</th>
                    <th className="p-2">{t('landing.trial.player')}</th>
                    <th className="p-2">{t('landing.trial.points')}</th>
                    <th className="p-2">{t('landing.trial.kills')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 3).map((row) => (
                    <tr key={row.player.id} className="border-b border-border">
                      <td className="p-2 font-bold text-accent">{row.rank}</td>
                      <td className="p-2 font-semibold">{row.player.name}</td>
                      <td className="p-2">{row.points}</td>
                      <td className="p-2">{row.kills}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!rows.length && (
              <p className="mt-5 text-sm text-muted-foreground">{t('landing.trial.noStandings')}</p>
            )}
            {rows.length > 3 && (
              <div className="mt-5 rounded-2xl border border-dashed border-border bg-secondary/50 p-5 text-center">
                <LockKeyhole className="mx-auto text-violet" size={20} />
                <p className="mt-2 font-bold">{t('landing.trial.standingsLocked')}</p>
              </div>
            )}
          </section>
        )}

        {tab === 'statistics' && (
          <AccountLock
            title={t('landing.trial.statisticsTitle')}
            description={t('landing.trial.statisticsLocked')}
          />
        )}

        {tab === 'settings' && (
          <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <form className={panel}>
              <h2 className="text-xl font-bold">{t('landing.trial.settingsTitle')}</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-semibold">
                  {t('landing.trial.tournamentName')}
                  <input disabled defaultValue={tournament.name} className={field} />
                </label>
                <label className="text-sm font-semibold">
                  {t('landing.trial.format')}
                  <input disabled defaultValue={tournament.format} className={field} />
                </label>
                <label className="text-sm font-semibold">
                  {t('landing.trial.plannedRounds')}
                  <input disabled defaultValue={tournament.plannedRounds} className={field} />
                </label>
                <label className="text-sm font-semibold">
                  {t('landing.trial.maxPlayers')}
                  <input disabled defaultValue={tournament.maxPlayers} className={field} />
                </label>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                {t('landing.trial.settingsLocked')}
              </p>
            </form>
            <aside className={panel}>
              <Trophy className="text-violet" size={24} />
              <h2 className="mt-3 text-xl font-bold">{t('landing.trial.finishTitle')}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t('landing.trial.finishDescription')}
              </p>
              <button
                disabled={
                  locked || tournament.rounds.some((round) => round.status !== 'completada')
                }
                onClick={finishTournament}
                className={`${primary} mt-5 w-full`}
              >
                {t('landing.trial.finish')}
              </button>
            </aside>
          </section>
        )}
      </main>
    </TrialShell>
  );
}

function TrialShell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen">
      <header className="app-header app-shell-header trial-header">
        <div className="app-shell-header__bar mx-auto max-w-6xl">
          <Link to="/" className="app-shell-header__brand">
            <img src="/edh-tournaments-icon.svg" alt="" />
            EDH <span>Tournaments</span>
          </Link>
          <div className="trial-header__actions">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="app-button--danger trial-header__exit"
            >
              <Link to="/">
                <span className="trial-header__full-label">{t('landing.trial.exit')}</span>
                <span className="trial-header__short-label">{t('landing.trial.exitShort')}</span>
              </Link>
            </Button>
            <Button asChild size="sm" className="trial-header__account">
              <Link to="/register">
                <span className="trial-header__full-label">{t('landing.trial.createAccount')}</span>
                <span className="trial-header__short-label">
                  {t('landing.trial.createAccountShort')}
                </span>
              </Link>
            </Button>
            <LanguageSelector />
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
