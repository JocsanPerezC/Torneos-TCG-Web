import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/ui/Avatar';
import {
  RECORD_ORDER,
  recordHolders,
  recordStatus,
  TABLE_RECORDS,
  type RecordKey,
  type TableHighlight,
  type TournamentStatistics,
} from '@/domain/statistics';
import type { Player } from '@/domain/types';
import {
  ArrowGlyph,
  BalanceGlyph,
  CountUp,
  FlameTrail,
  KillTally,
  RoundPips,
  Sparkline,
  SwordLink,
} from '@/features/tournaments/components/BattleGlyphs';

interface BattleLedgerProps {
  statistics: TournamentStatistics;
}

/** Columnas (de 6) para que cada fila de tarjetas cierre sin huecos. */
function recordSpans(count: number) {
  const spans = Array<number>(count).fill(2);
  if (count === 1) return [6];
  if (count % 3 === 2) spans.splice(-2, 2, 3, 3);
  if (count % 3 === 1) spans.splice(-4, 4, 3, 3, 3, 3);
  return spans;
}

function Crown({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 72 42" aria-hidden="true">
      <path d="M8 8 22 22 36 5l14 17L64 8l-5 27H13L8 8Z" />
      <path d="M14 39h44" />
    </svg>
  );
}

function recordGlyph(key: RecordKey, statistics: TournamentStatistics): ReactNode {
  const value = statistics[key].value;
  switch (key) {
    case 'hunter':
    case 'bloodiestTable':
      return <KillTally count={value} />;
    case 'unstoppable':
      return <FlameTrail count={value} />;
    case 'perfectAttendance':
      return <RoundPips count={value} />;
    case 'rivals':
      return <SwordLink />;
    case 'closestTable':
      return <BalanceGlyph difference={value} />;
    case 'comeback':
      return <ArrowGlyph value={value} />;
    case 'drawRoyalty':
      return (
        <div className="battle-draw-mark" aria-hidden="true">
          <span /> <span /> <span />
        </div>
      );
    case 'constant':
      return <Sparkline scores={statistics.constant.scores} />;
    case 'tableHead':
      return <Crown className="battle-crown" />;
    case 'punchingBag':
      return (
        <svg className="battle-target" viewBox="0 0 56 56" aria-hidden="true">
          <circle cx="28" cy="28" r="21" />
          <circle cx="28" cy="28" r="12" />
          <circle cx="28" cy="28" r="3" />
        </svg>
      );
    case 'losingStreak':
      return (
        <div className="battle-rain" aria-hidden="true">
          {Array.from({ length: Math.min(value, 6) }, (_, index) => (
            <i key={index} />
          ))}
        </div>
      );
    default:
      return null;
  }
}

export function BattleLedger({ statistics }: BattleLedgerProps) {
  const { t, i18n } = useTranslation();
  const list = new Intl.ListFormat(i18n.language, { type: 'conjunction' });
  const names = (players: Player[]) =>
    players.length > 3
      ? `${list.format(players.slice(0, 3).map((player) => player.name))} +${players.length - 3}`
      : list.format(players.map((player) => player.name));

  const statuses = RECORD_ORDER.map((key) => [key, recordStatus(statistics, key)] as const);
  const notable = statuses.filter(([, status]) => status === 'notable').map(([key]) => key);
  const playerRecords = notable.filter((key) => !TABLE_RECORDS.includes(key));
  const tableRecords = notable.filter((key) => TABLE_RECORDS.includes(key));
  const unsettled = statuses.filter(([, status]) => status !== 'notable');
  const spans = recordSpans(playerRecords.length);
  const stamp = (index: number) => String(index + 1).padStart(2, '0');

  const holders = (players: Player[]) => (
    <div className="battle-holders">
      <span className="battle-holders__faces">
        {players.slice(0, 4).map((player) => (
          <Avatar
            key={player.id}
            name={player.name}
            src={player.avatarUrl}
            className="battle-holder"
          />
        ))}
      </span>
      <strong>{names(players)}</strong>
    </div>
  );

  const value = (key: RecordKey) => (
    <div className="battle-record__value">
      <strong>
        <CountUp value={statistics[key].value} />
      </strong>
      <span>{t(`app.statistics.units.${key}`, { count: statistics[key].value })}</span>
    </div>
  );

  return (
    <section className="battle-ledger" aria-label={t('app.statistics.title')}>
      <header className="battle-ledger__masthead">
        <div>
          <p>{t('app.statistics.eyebrow')}</p>
          <h2>{t('app.statistics.title')}</h2>
          <span>{t('app.statistics.subtitle')}</span>
        </div>
        <aside>
          <strong>
            <CountUp value={statistics.completedRounds} />
          </strong>
          <span>{t('app.statistics.roundsDone', { count: statistics.completedRounds })}</span>
          <RoundPips count={statistics.completedRounds} />
        </aside>
      </header>

      {!statistics.completedRounds ? (
        <div className="battle-ledger__empty">
          <svg viewBox="0 0 90 58" aria-hidden="true">
            <path d="M15 46 45 10l30 36M24 46h42M36 34h18" />
          </svg>
          <p>{t('app.statistics.noData')}</p>
        </div>
      ) : (
        <>
          {statistics.figure && (
            <article className="battle-figure">
              <Avatar
                name={statistics.figure.player.name}
                src={statistics.figure.player.avatarUrl}
                className="battle-figure__avatar"
              />
              <div className="battle-figure__body">
                <p className="battle-note__stamp">{t('app.statistics.figure')}</p>
                <h3>{statistics.figure.player.name}</h3>
                <p>
                  {t('app.statistics.figureTitles', { count: statistics.figure.titles.length })}
                </p>
                <ul>
                  {statistics.figure.titles.map((key) => (
                    <li key={key}>{t(`app.statistics.${key}`)}</li>
                  ))}
                </ul>
              </div>
              <Crown className="battle-figure__crown" />
            </article>
          )}

          {playerRecords.length > 0 && (
            <section className="battle-section" aria-labelledby="battle-records-title">
              <h3 id="battle-records-title">{t('app.statistics.recordsTitle')}</h3>
              <div className="battle-records">
                {playerRecords.map((key, index) => (
                  <article
                    key={key}
                    className={`battle-note battle-record battle-note--${key}`}
                    style={{ gridColumn: `span ${spans[index]}` }}
                  >
                    <div className="battle-note__stamp">
                      {stamp(index)} / {t(`app.statistics.${key}`)}
                    </div>
                    {key === 'rivals'
                      ? statistics.rivals.pairs.map((pair) => (
                          <div key={pair.map((player) => player.id).join()}>{holders(pair)}</div>
                        ))
                      : holders(statistics[key as 'hunter'].players)}
                    <div className="battle-record__score">
                      {value(key)}
                      {recordGlyph(key, statistics)}
                    </div>
                    <p className="battle-record__tagline">{t(`app.statistics.taglines.${key}`)}</p>
                  </article>
                ))}
              </div>
            </section>
          )}

          {tableRecords.length > 0 && (
            <section className="battle-section" aria-labelledby="battle-tables-title">
              <h3 id="battle-tables-title">{t('app.statistics.tablesTitle')}</h3>
              <div className="battle-tables">
                {tableRecords.map((key, index) => {
                  const record = statistics[key] as TableHighlight;
                  const [table] = record.tables;
                  return (
                    <article key={key} className={`battle-note battle-table battle-note--${key}`}>
                      <div className="battle-note__stamp">
                        {stamp(playerRecords.length + index)} / {t(`app.statistics.${key}`)}
                      </div>
                      <p className="battle-table__label">
                        {record.tables
                          .map((entry) =>
                            t('app.statistics.tableLabel', {
                              table: entry.tableNumber,
                              round: entry.roundNumber,
                            }),
                          )
                          .join(' / ')}
                      </p>
                      <ol className="battle-table__seats">
                        {table.seats.map((seat) => (
                          <li key={seat.player.id}>
                            <Avatar
                              name={seat.player.name}
                              src={seat.player.avatarUrl}
                              className="battle-holder"
                            />
                            <span>{seat.player.name}</span>
                            <strong>
                              {key === 'bloodiestTable'
                                ? `☠ ${seat.kills}`
                                : t('app.common.pointsShort', { count: seat.points })}
                            </strong>
                          </li>
                        ))}
                      </ol>
                      <div className="battle-record__score">
                        {value(key)}
                        {recordGlyph(key, statistics)}
                      </div>
                      <p className="battle-record__tagline">
                        {t(`app.statistics.taglines.${key}`)}
                      </p>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {unsettled.length > 0 && (
            <section className="battle-unsettled" aria-labelledby="battle-unsettled-title">
              <h3 id="battle-unsettled-title">{t('app.statistics.unsettled')}</h3>
              <ul>
                {unsettled.map(([key, status]) => (
                  <li key={key}>
                    <strong>{t(`app.statistics.${key}`)}</strong>
                    <span>
                      {status === 'crowded'
                        ? t(
                            TABLE_RECORDS.includes(key)
                              ? 'app.statistics.tieTables'
                              : 'app.statistics.tiePlayers',
                            { count: recordHolders(statistics, key) },
                          )
                        : t(`app.statistics.empty.${key}`)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </section>
  );
}
