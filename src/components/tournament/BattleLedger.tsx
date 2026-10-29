import { useTranslation } from 'react-i18next';
import type { TableStatistic, TournamentStatistics } from '../../domain/statistics';
import { ArrowGlyph, AvatarStack, BalanceGlyph, CountUp, EmptyMark, FlameTrail, KillTally, RoundPips, Sparkline, SwordLink } from './BattleGlyphs';
import { playerNames } from './battleText';

interface BattleLedgerProps {
  statistics: TournamentStatistics;
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
