import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { loadPublicTournament } from '../../data/tournamentRepository';
import type { Tournament } from '../../domain/types';
import { panel, RoundTimer } from './shared';

export function PublicView() {
  const { slug } = useParams();
  const [tournament, setTournament] = useState<Tournament>();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    const loadTournament = () => {
      void loadPublicTournament(slug ?? '')
        .then((data) => {
          if (active) setTournament(data);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    };
    loadTournament();
    const interval = window.setInterval(loadTournament, 10_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [slug]);
  if (loading)
    return <div className="min-h-screen bg-slate-950 p-8 text-slate-300">Cargando ronda…</div>;
  if (!tournament)
    return (
      <div className="min-h-screen bg-slate-950 p-8 text-red-300">
        Esta vista publica no está disponible.
      </div>
    );
  const round = tournament.rounds.at(-1);
  const names = Object.fromEntries(tournament.players.map((player) => [player.id, player.name]));
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1800px]">
        <p className="text-xs font-bold tracking-[.16em] text-amber-300">INFORMACIÓN DEL TORNEO</p>
        <h1 className="mt-1 text-3xl font-black">{tournament.name}</h1>
        <p className="mt-1 text-slate-300">{tournament.format}</p>
        {tournament.information && (
          <section className={`${panel} mt-7`}>
            <h2 className="text-xl font-bold">Información del torneo</h2>
            <p className="mt-3 whitespace-pre-wrap text-slate-300">{tournament.information}</p>
          </section>
        )}
        {round ? (
          <section className={`${panel} mt-7`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold">Ronda {round.number}</h2>
              <RoundTimer round={round} />
            </div>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {round.pods.map((pod) => (
                <article
                  className="rounded-lg border border-slate-700 bg-slate-950 p-4"
                  key={pod.id}
                >
                  <h3 className="font-bold text-amber-300">Mesa {pod.number}</h3>
                  <div className="mt-3 grid gap-3">
                    {pod.playerIds.map((playerId) => (
                      <section
                        className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-3"
                        key={playerId}
                      >
                        <h4 className="text-sm font-semibold">{names[playerId]}</h4>
                      </section>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : (
          <section className={`${panel} mt-7 text-slate-300`}>
            Las mesas aparecerán cuando el organizador genere la primera ronda.
          </section>
        )}
      </div>
    </main>
  );
}
