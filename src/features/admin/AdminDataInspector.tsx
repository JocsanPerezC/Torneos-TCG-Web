import { useEffect, useState } from 'react';
import { loadAllTournaments } from '@/data/tournamentRepository';
import type { Tournament } from '@/domain/types';
import i18n from '@/i18n';
import { field, panel } from '@/components/ui/classes';

export function AdminDataInspector() {
  const [tournaments, setTournaments] = useState<Tournament[]>();
  const [error, setError] = useState<string>();
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;
    void loadAllTournaments()
      .then((data) => {
        if (active) setTournaments(data);
      })
      .catch((reason) => {
        if (active)
          setError(
            reason instanceof Error ? reason.message : i18n.t('app.admin.details.loadFailed'),
          );
      });
    return () => {
      active = false;
    };
  }, []);

  const visibleTournaments = tournaments?.filter((tournament) =>
    `${tournament.name} ${tournament.format}`
      .toLocaleLowerCase()
      .includes(search.toLocaleLowerCase()),
  );
  return (
    <section className={`${panel} mt-7`}>
      <div>
        <h2 className="text-xl font-black">{i18n.t('app.admin.tabs.details')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {i18n.t('app.admin.details.description')}
        </p>
      </div>
      {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
      {!tournaments && !error && (
        <p className="mt-4 text-sm text-muted-foreground">{i18n.t('app.admin.details.loading')}</p>
      )}
      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className={`${field} mt-4`}
        placeholder={i18n.t('app.admin.details.search')}
      />
      <div className="mt-4 max-h-[34rem] space-y-3 overflow-y-auto pr-1">
        {visibleTournaments?.map((tournament) => (
          <details
            key={tournament.id}
            className="rounded-lg border border-slate-700 bg-slate-950 p-4"
          >
            <summary className="cursor-pointer font-semibold">
              <span>{tournament.name}</span>
              <span className="ml-2 text-sm font-normal text-slate-400">
                {i18n.t('app.admin.details.summary', {
                  players: tournament.players.length,
                  rounds: tournament.rounds.length,
                })}
              </span>
            </summary>
            <pre className="mt-4 max-h-96 overflow-auto rounded-md bg-slate-900 p-4 text-xs leading-relaxed text-slate-300">
              {JSON.stringify(tournament, null, 2)}
            </pre>
          </details>
        ))}
      </div>
    </section>
  );
}
