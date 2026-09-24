import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Player } from '../../domain/types';
import type { TableStatistic, TournamentStatistics } from '../../domain/statistics';

interface BattleLedgerProps {
  statistics: TournamentStatistics;
}

function CountUp({ value }: { value: number }) {
  const { i18n } = useTranslation();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      setDisplay(value);
      return;
    }
    const startedAt = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / 650, 1);
      setDisplay(Math.round(value * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <>{new Intl.NumberFormat(i18n.language).format(display)}</>;
}

function playerNames(players: Player[]) {
  return players.map((player) => player.name).join(' · ');
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function AvatarStack({ players }: { players: Player[] }) {
  const visiblePlayers = players.slice(0, 4);
  return <div className="battle-avatar-stack" aria-label={playerNames(players)}>
    {visiblePlayers.map((player, index) => <span key={player.id} title={player.name} style={{ zIndex: visiblePlayers.length - index }}>{initials(player.name)}</span>)}
    {players.length > visiblePlayers.length && <strong>+{players.length - visiblePlayers.length}</strong>}
  </div>;
}

function KillTally({ count }: { count: number }) {
  const marks = Math.min(count, 10);
  return <svg className="battle-tally" viewBox="0 0 160 28" aria-hidden="true">
    {Array.from({ length: marks }, (_, index) => <path key={index} d={`M${10 + index * 15} 4l-4 20`} />)}
    {count > marks && <text x="152" y="21" textAnchor="end">+{count - marks}</text>}
  </svg>;
}

function FlameTrail({ count }: { count: number }) {
  return <svg className="battle-flames" viewBox="0 0 160 54" aria-hidden="true">
    {Array.from({ length: Math.min(count, 6) }, (_, index) => <path key={index} transform={`translate(${index * 24} ${12 - Math.min(index * 2, 10)}) scale(${0.7 + index * 0.06})`} d="M17 34c-8-3-9-13-3-20 1 7 6 5 6-4 8 8 9 18 3 24-2 3-4 4-6 4Z" />)}
  </svg>;
}

function RoundPips({ count }: { count: number }) {
  return <div className="battle-round-pips" aria-hidden="true">{Array.from({ length: Math.min(count, 10) }, (_, index) => <span key={index} />)}{count > 10 && <small>+{count - 10}</small>}</div>;
}

function SwordLink() {
  return <svg className="battle-swords" viewBox="0 0 64 42" aria-hidden="true"><path d="m9 5 37 30M8 35 45 5M6 4l7 2-5 5M51 34 58 37l-5-7M6 37l7-2-5-5M51 8l7-3-5 7" /></svg>;
}

function BalanceGlyph({ difference }: { difference: number }) {
  return <svg className="battle-balance" viewBox="0 0 90 54" aria-hidden="true"><path d="M45 6v38M21 19h48M12 19l12 20 12-20M54 19l12 20 12-20M31 47h28" /><text x="45" y="17" textAnchor="middle">{difference}</text></svg>;
}

function ArrowGlyph({ value }: { value: number }) {
  return <svg className="battle-arrow" viewBox="0 0 76 54" aria-hidden="true"><path d="M9 45 52 11M37 11h15v15" /><text x="13" y="22">+{value}</text></svg>;
}

function Sparkline({ scores }: { scores: number[] }) {
  const max = Math.max(...scores, 1);
  const min = Math.min(...scores);
  const range = Math.max(max - min, 1);
  const points = scores.map((score, index) => `${8 + (index * 104) / Math.max(scores.length - 1, 1)},${38 - ((score - min) / range) * 25}`).join(' ');
  return <svg className="battle-sparkline" viewBox="0 0 120 48" aria-hidden="true"><path d="M6 41h108" /><polyline points={points} />{scores.map((score, index) => <circle key={`${score}-${index}`} cx={8 + (index * 104) / Math.max(scores.length - 1, 1)} cy={38 - ((score - min) / range) * 25} r="3" />)}</svg>;
}

function EmptyMark({ message }: { message: string }) {
  return <p className="battle-empty">{message}</p>;
}

function tableNames(table: TableStatistic) {
  return playerNames(table.players);
}

export function BattleLedger({ statistics }: BattleLedgerProps) {
  const { t } = useTranslation();
  const attendanceSentence = statistics.perfectAttendance.players.length > 4
    ? t('app.statistics.copy.attendanceMany', { count: statistics.perfectAttendance.players.length })
    : t('app.statistics.copy.attendance', { names: playerNames(statistics.perfectAttendance.players) });
  const rivalNames = statistics.rivals.pairs.map(([first, second]) => `${first.name} × ${second.name}`);

  return <section className="battle-ledger" aria-label={t('app.statistics.title')}>
    <header className="battle-ledger__masthead">
      <div><p>{t('app.statistics.eyebrow')}</p><h2>{t('app.statistics.title')}</h2><span>{t('app.statistics.subtitle')}</span></div>
      <aside><RoundPips count={statistics.completedRounds} /><strong><CountUp value={statistics.completedRounds} /></strong><span>{t('app.statistics.completedRounds')}</span></aside>
    </header>
    {!statistics.completedRounds ? <div className="battle-ledger__empty"><svg viewBox="0 0 90 58" aria-hidden="true"><path d="M15 46 45 10l30 36M24 46h42M36 34h18" /></svg><p>{t('app.statistics.noData')}</p></div> : <div className="battle-ledger__grid">
      <article className="battle-note battle-note--hunter">
        <div className="battle-note__stamp">01 / {t('app.statistics.hunter')}</div>
        {statistics.hunter.players.length ? <><div className="battle-note__hero-number"><CountUp value={statistics.hunter.value} /></div><KillTally count={statistics.hunter.value} /><p>{t('app.statistics.copy.hunter', { names: playerNames(statistics.hunter.players), count: statistics.hunter.value })}</p></> : <EmptyMark message={t('app.statistics.empty.hunter')} />}
      </article>
      <article className="battle-note battle-note--unstoppable">
        <div className="battle-note__stamp">02 / {t('app.statistics.unstoppable')}</div>
        {statistics.unstoppable.players.length ? <><FlameTrail count={statistics.unstoppable.value} /><div className="battle-note__hero-number"><CountUp value={statistics.unstoppable.value} /></div><p>{t('app.statistics.copy.unstoppable', { names: playerNames(statistics.unstoppable.players), count: statistics.unstoppable.value })}</p></> : <EmptyMark message={t('app.statistics.empty.unstoppable')} />}
      </article>
      <article className="battle-note battle-note--attendance">
        <div className="battle-note__stamp">03 / {t('app.statistics.perfectAttendance')}</div>
        {statistics.perfectAttendance.players.length ? <><div className="battle-attendance__visual"><AvatarStack players={statistics.perfectAttendance.players} /><RoundPips count={statistics.perfectAttendance.value} /></div><p>{attendanceSentence}</p></> : <EmptyMark message={t('app.statistics.empty.attendance')} />}
      </article>
      <article className="battle-note battle-note--rivals">
        <div className="battle-note__stamp">04 / {t('app.statistics.rivals')}</div>
        {statistics.rivals.pairs.length ? <><div className="battle-rivals__visual"><AvatarStack players={statistics.rivals.pairs[0]} /><SwordLink /></div><p>{t('app.statistics.copy.rivals', { names: rivalNames.join(' · '), count: statistics.rivals.value })}</p></> : <EmptyMark message={t('app.statistics.empty.rivals')} />}
      </article>
      <article className="battle-note battle-note--close">
        <div className="battle-note__stamp">05 / {t('app.statistics.closestTable')}</div>
        {statistics.closestTable.tables.length ? <><BalanceGlyph difference={statistics.closestTable.value} /><div className="battle-table-list">{statistics.closestTable.tables.map((table) => <span key={`${table.roundNumber}-${table.tableNumber}`}>{t('app.statistics.copy.closestTable', { round: table.roundNumber, table: table.tableNumber, count: table.pointDifference, names: tableNames(table) })}</span>)}</div></> : <EmptyMark message={t('app.statistics.empty.closestTable')} />}
      </article>
      <article className="battle-note battle-note--bloodiest">
        <div className="battle-note__stamp">09 / {t('app.statistics.bloodiestTable')}</div>
        {statistics.bloodiestTable.tables.length ? <><KillTally count={statistics.bloodiestTable.value} /><div className="battle-table-list">{statistics.bloodiestTable.tables.map((table) => <span key={`${table.roundNumber}-${table.tableNumber}`}>{t('app.statistics.copy.bloodiestTable', { round: table.roundNumber, table: table.tableNumber, count: table.kills })}</span>)}</div></> : <EmptyMark message={t('app.statistics.empty.bloodiestTable')} />}
      </article>
      <article className="battle-note battle-note--comeback">
        <div className="battle-note__stamp">06 / {t('app.statistics.comeback')}</div>
        {statistics.comeback.players.length ? <><ArrowGlyph value={statistics.comeback.value} /><p>{t('app.statistics.copy.comeback', { names: playerNames(statistics.comeback.players), count: statistics.comeback.value })}</p></> : <EmptyMark message={t('app.statistics.empty.comeback')} />}
      </article>
      <article className="battle-note battle-note--draws">
        <div className="battle-note__stamp">07 / {t('app.statistics.drawRoyalty')}</div>
        {statistics.drawRoyalty.players.length ? <><div className="battle-draw-mark"><span /> <span /> <span /></div><p>{t('app.statistics.copy.draws', { names: playerNames(statistics.drawRoyalty.players), count: statistics.drawRoyalty.value })}</p></> : <EmptyMark message={t('app.statistics.empty.draws')} />}
      </article>
      <article className="battle-note battle-note--best-round">
        <div className="battle-note__stamp">08 / {t('app.statistics.bestRound')}</div>
        {statistics.bestRound.players.length ? <><strong className="battle-score"><CountUp value={statistics.bestRound.value} /></strong><p>{t('app.statistics.copy.bestRound', { names: playerNames(statistics.bestRound.players), count: statistics.bestRound.value })}</p></> : <EmptyMark message={t('app.statistics.empty.bestRound')} />}
      </article>
      <article className="battle-note battle-note--bag">
        <div className="battle-note__stamp">10 / {t('app.statistics.punchingBag')}</div>
        {statistics.punchingBag.players.length ? <><svg className="battle-target" viewBox="0 0 56 56" aria-hidden="true"><circle cx="28" cy="28" r="21" /><circle cx="28" cy="28" r="12" /><circle cx="28" cy="28" r="3" /></svg><p>{t('app.statistics.copy.punchingBag', { names: playerNames(statistics.punchingBag.players), count: statistics.punchingBag.value })}</p></> : <EmptyMark message={t('app.statistics.empty.punchingBag')} />}
      </article>
      <article className="battle-note battle-note--losing">
        <div className="battle-note__stamp">11 / {t('app.statistics.losingStreak')}</div>
        {statistics.losingStreak.players.length ? <><div className="battle-rain">{Array.from({ length: Math.min(statistics.losingStreak.value, 6) }, (_, index) => <i key={index} />)}</div><p>{t('app.statistics.copy.losingStreak', { names: playerNames(statistics.losingStreak.players), count: statistics.losingStreak.value })}</p></> : <EmptyMark message={t('app.statistics.empty.losingStreak')} />}
      </article>
      <article className="battle-note battle-note--constant">
        <div className="battle-note__stamp">12 / {t('app.statistics.constant')}</div>
        {statistics.constant.players.length ? <><Sparkline scores={statistics.constant.scores} /><p>{t('app.statistics.copy.constant', { names: playerNames(statistics.constant.players), count: statistics.constant.value })}</p></> : <EmptyMark message={t('app.statistics.empty.constant')} />}
      </article>
      <article className="battle-note battle-note--head">
        <div className="battle-note__stamp">13 / {t('app.statistics.tableHead')}</div>
        {statistics.tableHead.players.length ? <><svg className="battle-crown" viewBox="0 0 72 42" aria-hidden="true"><path d="M8 8 22 22 36 5l14 17L64 8l-5 27H13L8 8Z" /><path d="M14 39h44" /></svg><p>{t('app.statistics.copy.tableHead', { names: playerNames(statistics.tableHead.players), count: statistics.tableHead.value })}</p></> : <EmptyMark message={t('app.statistics.empty.tableHead')} />}
      </article>
    </div>}
  </section>;
}
