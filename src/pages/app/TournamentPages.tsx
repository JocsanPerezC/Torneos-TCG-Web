import { useEffect, useState, type FormEvent } from 'react';
import { Link, NavLink, Route, Routes, useParams } from 'react-router-dom';
import { ExternalLink, Eye, Info, Play, RefreshCw, Square, Trash2 } from 'lucide-react';
import { type Pod, type Tournament } from '../../domain/types';
import { useTournament, useTournaments } from '../../state/TournamentContext';
import { Modal } from '../../components/ui/modal';
import { Badge, ConfirmModal, field, Layout, Notice, panel, primary, RoundTimer } from './shared';

export function TournamentLayout() {
  const { id } = useParams();
  const tournament = useTournament(id);
  if (!tournament)
    return (
      <Layout>
        <Notice error>Torneo no encontrado.</Notice>
      </Layout>
    );
  const base = `/tournaments/${tournament.id}`;
  return (
    <Layout>
      <div className="mb-6 flex flex-wrap justify-between gap-3">
        <div>
          <p className="text-sm text-amber-300">{tournament.format}</p>
          <h1 className="text-3xl font-black">{tournament.name}</h1>
        </div>
        <Badge>{tournament.status}</Badge>
      </div>
      <nav className="mb-6 flex gap-1 overflow-x-auto rounded-lg border border-slate-700 bg-slate-900 p-1">
        {[
          ['', 'Resumen'],
          ['players', 'Jugadores'],
          ['rounds', 'Rondas'],
          ['standings', 'Clasificación'],
          ['settings', 'Configuración'],
        ].map(([suffix, label]) => (
          <NavLink
            end={!suffix}
            className={({ isActive }) =>
              `whitespace-nowrap rounded-md px-3 py-2 text-sm ${isActive ? 'bg-amber-400 font-bold text-slate-950' : 'hover:bg-slate-800'}`
            }
            key={label}
            to={`${base}${suffix ? `/${suffix}` : ''}`}
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <Routes>
        <Route index element={<Overview />} />
        <Route path="players" element={<Players />} />
        <Route path="rounds" element={<Rounds />} />
        <Route path="standings" element={<Standings />} />
        <Route path="settings" element={<Settings />} />
      </Routes>
    </Layout>
  );
}
function Current() {
  const { id } = useParams();
  const tournament = useTournament(id);
  if (!tournament) throw new Error('Torneo no encontrado');
  return tournament;
}
function Overview() {
  const tournament = Current();
  const current = tournament.rounds.at(-1);
  return (
    <section className={panel}>
      <h2 className="text-xl font-bold">Estado del torneo</h2>
      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <Metric
          label="Jugadores activos"
          value={tournament.players.filter((p) => p.active).length}
        />
        <Metric label="Rondas" value={`${tournament.rounds.length}/${tournament.plannedRounds}`} />
        <Metric label="Mesa actual" value={current ? `R${current.number}` : '—'} />
      </div>
      {current && (
        <div className="mt-5 rounded-lg bg-slate-950 p-4">
          <p className="font-bold">
            Ronda {current.number}{' '}
            <span className="ml-2">
              <Badge>{current.status}</Badge>
            </span>
          </p>
          <p className="mt-2 text-sm text-slate-300">
            {current.pods.length} mesas generadas.{' '}
            {current.status === 'completada'
              ? 'Resultados registrados.'
              : 'Registra los resultados de cada mesa.'}
          </p>
          <Link
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-amber-400 px-3 py-2 text-sm font-bold text-slate-950 hover:bg-amber-300"
            to="rounds"
          >
            <Play size={15} />
            Ir a rondas
          </Link>
        </div>
      )}
    </section>
  );
}
function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-slate-950 p-3">
      <strong className="block text-xl text-amber-300">{value}</strong>
      <span className="text-xs text-slate-400">{label}</span>
    </div>
  );
}
function Players() {
  const tournament = Current();
  const { id } = useParams();
  const { addPlayers, togglePlayer, removePlayer, renamePlayer } = useTournaments();
  const [message, setMessage] = useState('');
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Tournament['players'][number]>();
  const [pending, setPending] = useState<{
    player: Tournament['players'][number];
    action: 'toggle' | 'delete';
  }>();
  function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = addPlayers(
      id!,
      String(new FormData(event.currentTarget).get('names')).split('\n'),
    );
    setMessage(
      result.error ??
        (result.added
          ? `${result.added} jugador(es) agregado(s).${result.duplicate ? ` Se omitió duplicado: ${result.duplicate}.` : ''}`
          : result.duplicate
            ? `No se agregó ningún jugador; “${result.duplicate}” ya existe.`
            : 'Escribe al menos un nombre.'),
    );
    setAdding(false);
  }
  function edit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const result = renamePlayer(
      id!,
      editing.id,
      String(new FormData(event.currentTarget).get('name')),
    );
    setMessage(result ?? 'Nombre actualizado.');
    if (!result) setEditing(undefined);
  }
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const filteredPlayers = tournament.players.filter((player) =>
    player.name.toLocaleLowerCase().includes(normalizedSearch),
  );
  return (
    <section>
      <div className={panel}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-bold">Jugadores</h2>
            <span className="text-sm text-slate-300">
              {tournament.players.filter((p) => p.active).length} activos ·{' '}
              {tournament.players.length}/{tournament.maxPlayers} cupos usados
            </span>
          </div>
          <button
            disabled={tournament.status === 'finalizado'}
            className={primary}
            onClick={() => setAdding(true)}
          >
            + Agregar jugadores
          </button>
        </div>
        {message && <Notice error={message.includes('máximo')}>{message}</Notice>}
        <label className="mb-3 block">
          <span className="sr-only">Buscar jugadores</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar jugadores..."
            className={`${field} mt-0`}
          />
        </label>
        <div className="max-h-[22rem] space-y-2 overflow-y-auto pr-2">
          {filteredPlayers.map((player) => (
            <div
              key={player.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-950 p-3"
            >
              <div>
                <strong>{player.name}</strong>
                <span
                  className={`ml-2 text-xs ${player.active ? 'text-emerald-300' : 'text-slate-400'}`}
                >
                  {player.active ? 'Activo' : 'Retirado'}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  className="text-xs text-amber-300 underline"
                  onClick={() => setEditing(player)}
                >
                  Editar
                </button>
                <button
                  className="text-xs text-slate-300 underline"
                  onClick={() => setPending({ player, action: 'toggle' })}
                >
                  {player.active ? 'Retirar' : 'Activar'}
                </button>
                <button
                  className="text-xs text-red-300 underline"
                  onClick={() => setPending({ player, action: 'delete' })}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
          {!filteredPlayers.length && (
            <p className="text-sm text-slate-400">
              {search ? 'No se encontraron jugadores.' : 'Aún no hay jugadores.'}
            </p>
          )}
        </div>
      </div>
      {adding && (
        <Modal
          title="Agregar jugadores"
          description={`Escribe un nombre por línea. ${tournament.maxPlayers - tournament.players.length} cupo(s) disponible(s).`}
          onClose={() => setAdding(false)}
        >
          <form className="space-y-4" onSubmit={add}>
            <textarea
              required
              name="names"
              className={field}
              rows={7}
              placeholder={'Ana\nBruno\nCarla'}
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="rounded-lg border border-slate-500 px-4 py-2 text-sm font-semibold hover:bg-slate-800"
                onClick={() => setAdding(false)}
              >
                Cancelar
              </button>
              <button className={primary}>Agregar</button>
            </div>
          </form>
        </Modal>
      )}
      {editing && (
        <Modal
          title="Editar jugador"
          description="Actualiza el nombre del participante."
          onClose={() => setEditing(undefined)}
        >
          <form className="space-y-4" onSubmit={edit}>
            <label className="block text-sm">
              Nombre
              <input autoFocus required name="name" defaultValue={editing.name} className={field} />
            </label>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="rounded-lg border border-slate-500 px-4 py-2 text-sm font-semibold hover:bg-slate-800"
                onClick={() => setEditing(undefined)}
              >
                Cancelar
              </button>
              <button className={primary}>Guardar</button>
            </div>
          </form>
        </Modal>
      )}
      {pending && (
        <ConfirmModal
          title={
            pending.action === 'delete'
              ? 'Eliminar jugador'
              : pending.player.active
                ? 'Retirar jugador'
                : 'Activar jugador'
          }
          description={
            pending.action === 'delete'
              ? `¿Eliminar a ${pending.player.name}? No se puede eliminar a alguien que ya esté en una ronda.`
              : pending.player.active
                ? `${pending.player.name} no se incluirá en las próximas rondas.`
                : `${pending.player.name} volverá a incluirse en las próximas rondas.`
          }
          confirmLabel={pending.action === 'delete' ? 'Eliminar' : 'Confirmar'}
          destructive={pending.action === 'delete'}
          onClose={() => setPending(undefined)}
          onConfirm={() => {
            const result =
              pending.action === 'delete'
                ? removePlayer(id!, pending.player.id)
                : (togglePlayer(id!, pending.player.id), undefined);
            setMessage(
              result ??
                (pending.action === 'delete'
                  ? 'Jugador eliminado.'
                  : pending.player.active
                    ? 'Jugador retirado.'
                    : 'Jugador activado.'),
            );
            setPending(undefined);
          }}
        />
      )}
    </section>
  );
}

function Rounds() {
  const tournament = Current();
  const { id } = useParams();
  const { generateRound, deleteLastRound, startRound, completeRound, movePlayer } =
    useTournaments();
  const [message, setMessage] = useState('');
  const [deletingLast, setDeletingLast] = useState(false);
  const [roundToComplete, setRoundToComplete] = useState<Tournament['rounds'][number]>();
  const [selectedRoundId, setSelectedRoundId] = useState<string>();
  const [draggedPlayer, setDraggedPlayer] = useState<string>();
  const last = tournament.rounds.at(-1);
  const hasOpenRound = tournament.rounds.some((round) => round.status !== 'completada');
  const names = Object.fromEntries(tournament.players.map((player) => [player.id, player.name]));
  const selectedRound = tournament.rounds.find((round) => round.id === selectedRoundId) ?? last;
  const selectedIndex = selectedRound
    ? tournament.rounds.findIndex((round) => round.id === selectedRound.id)
    : -1;

  useEffect(() => {
    setSelectedRoundId(tournament.rounds.at(-1)?.id);
  }, [tournament.rounds.length]);

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Rondas y mesas</h2>
        <div className="flex flex-wrap justify-end gap-2">
          <button
            disabled={selectedIndex <= 0}
            className="rounded-lg border border-slate-500 px-4 py-2 text-sm font-semibold hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => setSelectedRoundId(tournament.rounds[selectedIndex - 1].id)}
          >
            Anterior
          </button>
          <button
            disabled={selectedIndex >= tournament.rounds.length - 1}
            className="rounded-lg border border-slate-500 px-4 py-2 text-sm font-semibold hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => setSelectedRoundId(tournament.rounds[selectedIndex + 1].id)}
          >
            Siguiente
          </button>
          <button
            disabled={
              tournament.status === 'finalizado' ||
              hasOpenRound ||
              tournament.rounds.length >= tournament.plannedRounds
            }
            className={`${primary} inline-flex items-center gap-2`}
            onClick={() =>
              setMessage(
                generateRound(id!) ?? 'Ronda generada. Iníciala cuando las mesas estén listas.',
              )
            }
          >
            <RefreshCw size={16} />
            Generar siguiente ronda
          </button>
          <button
            disabled={!last}
            className="inline-flex items-center gap-2 rounded-lg border border-red-700 px-3 py-2 text-sm text-red-200 hover:bg-red-950 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => setDeletingLast(true)}
          >
            <Trash2 size={16} />
            Eliminar última
          </button>
        </div>
      </div>
      {message && (
        <Notice
          error={
            message.includes('requieren') ||
            message.includes('Completa') ||
            message.includes('finalizado') ||
            message.includes('Primero') ||
            message.includes('Espera')
          }
        >
          {message}
        </Notice>
      )}
      {selectedRound ? (
        <article className={panel}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="font-bold">
                Ronda {selectedRound.number}{' '}
                <span className="ml-2">
                  <Badge>{selectedRound.status}</Badge>
                </span>
              </h3>
              <RoundTimer round={selectedRound} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                className="inline-flex items-center gap-2 rounded-lg border border-slate-500 px-3 py-2 text-sm font-semibold hover:bg-slate-800"
                to={`/t/${tournament.publicSlug}`}
                target="_blank"
                rel="noreferrer"
              >
                <Eye size={16} />
                Vista pública
                <ExternalLink size={14} />
              </Link>
              <button
                disabled={selectedRound.status !== 'borrador' || tournament.status === 'finalizado'}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() =>
                  setMessage(
                    startRound(id!, selectedRound.id) ??
                      'Ronda iniciada. El cronómetro está en marcha.',
                  )
                }
              >
                <Play size={16} fill="currentColor" />
                Iniciar ronda
              </button>
              <button
                disabled={selectedRound.status !== 'activa' || tournament.status === 'finalizado'}
                className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-3 py-2 text-sm font-bold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => setRoundToComplete(selectedRound)}
              >
                <Square size={15} fill="currentColor" />
                Terminar ronda
              </button>
            </div>
          </div>
          {selectedRound.status === 'borrador' && (
            <p className="mt-3 text-sm text-slate-300">
              Arrastra un jugador hacia otra mesa para reorganizarla. Cada mesa debe quedar con 3 a
              5 jugadores.
            </p>
          )}
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {selectedRound.pods.map((pod) =>
              selectedRound.status === 'borrador' ? (
                <DraftPodCard
                  key={pod.id}
                  pod={pod}
                  names={names}
                  draggedPlayer={draggedPlayer}
                  onDragStart={setDraggedPlayer}
                  onDrop={(playerId) => {
                    const error = movePlayer(id!, selectedRound.id, playerId, pod.id);
                    if (error) setMessage(error);
                  }}
                />
              ) : (
                <PodCard
                  key={pod.id}
                  tournamentId={id!}
                  roundId={selectedRound.id}
                  pod={pod}
                  readOnly={tournament.status === 'finalizado' || selectedRound.status !== 'activa'}
                  names={names}
                  editable={selectedRound.status === 'activa'}
                />
              ),
            )}
          </div>
        </article>
      ) : (
        <div className={`${panel} text-sm text-slate-300`}>
          No hay rondas todavía. Agrega al menos tres jugadores activos y genera la primera.
        </div>
      )}
      {deletingLast && last && (
        <ConfirmModal
          title="Eliminar última ronda"
          description={
            last.pods.some((p) => p.results?.length)
              ? 'Se eliminarán las mesas y resultados de esta ronda. Esta acción no se puede deshacer.'
              : 'Se eliminarán las mesas de esta ronda.'
          }
          confirmLabel="Eliminar ronda"
          destructive
          onClose={() => setDeletingLast(false)}
          onConfirm={() => {
            setMessage(
              deleteLastRound(id!) ?? 'Última ronda eliminada y clasificación recalculada.',
            );
            setDeletingLast(false);
          }}
        />
      )}
      {roundToComplete && (
        <ConfirmModal
          title={`Terminar ronda ${roundToComplete.number}`}
          description="La ronda se bloqueará después de validar todos los resultados y guardar el tiempo transcurrido."
          confirmLabel="Terminar ronda"
          destructive
          onClose={() => setRoundToComplete(undefined)}
          onConfirm={() => {
            setMessage(
              completeRound(id!, roundToComplete.id) ??
                'Ronda terminada. La clasificación se actualizó.',
            );
            setRoundToComplete(undefined);
          }}
        />
      )}
    </section>
  );
}
function DraftPodCard({
  pod,
  names,
  draggedPlayer,
  onDragStart,
  onDrop,
}: {
  pod: Pod;
  names: Record<string, string>;
  draggedPlayer?: string;
  onDragStart: (playerId: string) => void;
  onDrop: (playerId: string) => void;
}) {
  return (
    <div
      className="rounded-lg border border-dashed border-amber-400/60 bg-slate-950 p-4"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const playerId = event.dataTransfer.getData('text/plain') || draggedPlayer;
        if (playerId) onDrop(playerId);
      }}
    >
      <h4 className="font-bold text-amber-300">
        Mesa {pod.number}{' '}
        <span className="text-xs font-normal text-slate-400">({pod.playerIds.length}/5)</span>
      </h4>
      <div className="mt-3 grid gap-2">
        {pod.playerIds.map((playerId) => (
          <button
            type="button"
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData('text/plain', playerId);
              onDragStart(playerId);
            }}
            className="cursor-grab rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-left text-sm font-semibold active:cursor-grabbing"
            key={playerId}
          >
            {names[playerId]}
          </button>
        ))}
      </div>
    </div>
  );
}
function PodCard({
  tournamentId,
  roundId,
  pod,
  names,
  readOnly,
  editable,
}: {
  tournamentId: string;
  roundId: string;
  pod: Pod;
  names: Record<string, string>;
  readOnly: boolean;
  editable: boolean;
}) {
  const { savePod } = useTournaments();
  const [message, setMessage] = useState('');
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const next: Pod = {
      ...pod,
      results: pod.playerIds.map((playerId) => ({
        playerId,
        points: Number(form.get(`points-${playerId}`)),
        kills: Number(form.get(`kills-${playerId}`)),
      })),
    };
    setMessage(
      savePod(tournamentId, roundId, pod.id, next) ??
        'Resultado guardado. La clasificación se actualizó.',
    );
  }
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950 p-4">
      <h4 className="font-bold text-amber-300">Mesa {pod.number}</h4>
      {!editable && (
        <div className="mt-3 grid gap-2">
          {pod.playerIds.map((playerId) => {
            const result = pod.results?.find((item) => item.playerId === playerId);
            return (
              <section
                className="overflow-hidden rounded-lg border border-slate-700 bg-slate-900"
                key={playerId}
              >
                <h5 className="px-3 py-2 text-sm font-semibold">{names[playerId]}</h5>
                {result ? (
                  <div className="grid grid-cols-2 border-t border-slate-700 text-xs">
                    <p className="border-r border-slate-700 px-3 py-2 text-slate-300">
                      Puntos <strong className="ml-1 text-slate-100">{result.points}</strong>
                    </p>
                    <p className="px-3 py-2 text-slate-300">
                      Kills <strong className="ml-1 text-slate-100">{result.kills}</strong>
                    </p>
                  </div>
                ) : (
                  <p className="border-t border-slate-700 px-3 py-2 text-xs text-slate-400">
                    Resultados pendientes.
                  </p>
                )}
              </section>
            );
          })}
        </div>
      )}
      {editable && (
        <form onSubmit={save} className="mt-3 space-y-4">
          <p className="rounded-md bg-slate-900 px-3 py-2 text-xs text-slate-300">
            Escribe los puntos acordados para cada jugador de la mesa.
          </p>
          <div className="grid gap-3">
            {pod.playerIds.map((playerId) => (
              <section
                className="overflow-hidden rounded-lg border border-slate-700 bg-slate-900"
                key={playerId}
              >
                <h5 className="px-4 py-3 text-sm font-semibold">{names[playerId]}</h5>
                <div className="grid grid-cols-2 border-t border-slate-700">
                  <label className="border-r border-slate-700 p-3 text-xs font-semibold text-slate-300">
                    Puntos
                    <input
                      required
                      min="0"
                      name={`points-${playerId}`}
                      defaultValue={pod.results?.find((r) => r.playerId === playerId)?.points ?? ''}
                      type="number"
                      className="mt-2 w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400"
                    />
                  </label>
                  <label className="p-3 text-xs font-semibold text-slate-300">
                    Kills
                    <input
                      required
                      min="0"
                      name={`kills-${playerId}`}
                      defaultValue={pod.results?.find((r) => r.playerId === playerId)?.kills ?? 0}
                      type="number"
                      className="mt-2 w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400"
                    />
                  </label>
                </div>
              </section>
            ))}
          </div>
          {message && <Notice error={message.includes('Completa')}>{message}</Notice>}
          <button disabled={readOnly} className={primary}>
            Guardar resultado
          </button>
        </form>
      )}
    </div>
  );
}
function Standings() {
  const tournament = Current();
  const { id } = useParams();
  const rows = useTournaments().standingsFor(id!);
  const opponentHelp = 'Suma de los puntos obtenidos por las personas contra quienes jugaste.';
  return (
    <section className={panel}>
      <h2 className="text-xl font-bold">Clasificación</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-slate-700 text-slate-400">
            <tr>
              <th className="p-2">#</th>
              <th className="p-2">Nombre</th>
              <th className="p-2">Puntos</th>
              <th className="p-2">
                <span className="inline-flex items-center gap-1">
                  Fuerza de oponentes
                  <span
                    title={opponentHelp}
                    aria-label={opponentHelp}
                    className="cursor-help text-amber-300"
                  >
                    <Info size={15} strokeWidth={2} />
                  </span>
                </span>
              </th>
              <th className="p-2">Kills</th>
              <th className="p-2">Rondas</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr className="border-b border-slate-800" key={row.player.id}>
                <td className="p-2 font-bold text-amber-300">{row.rank}</td>
                <td className="p-2">
                  {row.player.name}
                  {!row.player.active && (
                    <span className="ml-2 text-xs text-slate-500">Retirado</span>
                  )}
                </td>
                <td className="p-2 font-bold">{row.points}</td>
                <td className="p-2">{row.opponentStrength}</td>
                <td className="p-2">{row.kills}</td>
                <td className="p-2">{row.roundsPlayed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!tournament.rounds.length && (
        <p className="mt-4 text-sm text-slate-400">
          La clasificación se llenará al guardar resultados.
        </p>
      )}
    </section>
  );
}

function Settings() {
  const tournament = Current();
  const { id } = useParams();
  const { updateTournament } = useTournaments();
  const [message, setMessage] = useState('');
  const [statusAction, setStatusAction] = useState<'finalizar' | 'reabrir'>();
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const plannedRounds = Number(form.get('rounds'));
    const maxPlayers = Number(form.get('maxPlayers'));
    const maxTables = Number(form.get('maxTables'));
    if (
      !Number.isInteger(plannedRounds) ||
      plannedRounds < tournament.rounds.length ||
      plannedRounds < 1
    )
      return setMessage(
        `Las rondas planificadas deben ser un entero de al menos ${Math.max(1, tournament.rounds.length)}.`,
      );
    if (
      !Number.isInteger(maxPlayers) ||
      maxPlayers < tournament.players.length ||
      !Number.isInteger(maxTables) ||
      maxTables < 1
    )
      return setMessage(
        `El máximo debe cubrir los ${tournament.players.length} jugadores actuales y al menos una mesa.`,
      );
    updateTournament(id!, {
      name: String(form.get('name')).trim(),
      format: String(form.get('format')).trim(),
      plannedRounds,
      maxPlayers,
      maxTables,
      isPublic: true,
    });
    setMessage('Configuración guardada.');
  }
  const canFinish = !tournament.rounds.some((round) => round.status !== 'completada');
  return (
    <section className="grid gap-5 lg:grid-cols-3">
      <form onSubmit={save} className={`${panel} space-y-4 lg:col-span-2`}>
        <h2 className="text-xl font-bold">Configuración del torneo</h2>
        {message && (
          <Notice error={message.includes('deben') || message.includes('máximo')}>{message}</Notice>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            Nombre
            <input required name="name" defaultValue={tournament.name} className={field} />
          </label>
          <label className="text-sm">
            Formato
            <input required name="format" defaultValue={tournament.format} className={field} />
          </label>
          <label className="text-sm">
            Rondas planificadas
            <input
              required
              type="number"
              min="1"
              name="rounds"
              defaultValue={tournament.plannedRounds}
              className={field}
            />
          </label>
          <label className="text-sm">
            Máximo de jugadores
            <input
              required
              type="number"
              min="3"
              name="maxPlayers"
              defaultValue={tournament.maxPlayers}
              className={field}
            />
          </label>
          <label className="text-sm">
            Máximo de mesas por ronda
            <input
              required
              type="number"
              min="1"
              name="maxTables"
              defaultValue={tournament.maxTables}
              className={field}
            />
          </label>
        </div>
        <p className="text-sm text-slate-300">Los puntos se registran manualmente en cada mesa.</p>
        <button disabled={tournament.status === 'finalizado'} className={primary}>
          Guardar cambios
        </button>
      </form>
      <aside className={panel}>
        <h2 className="font-bold">Estado</h2>
        <p className="mt-2 text-sm text-slate-300">
          Finalizar bloquea las ediciones. Puede reabrirse mediante confirmación.
        </p>
        {tournament.status === 'finalizado' ? (
          <button
            className="mt-4 rounded-lg border border-amber-400 px-3 py-2 text-sm text-amber-300"
            onClick={() => setStatusAction('reabrir')}
          >
            Reabrir torneo
          </button>
        ) : (
          <button
            disabled={!canFinish}
            className={`${primary} mt-4`}
            onClick={() => setStatusAction('finalizar')}
          >
            Finalizar torneo
          </button>
        )}
        {!canFinish && (
          <p className="mt-2 text-xs text-red-300">Completa la ronda activa antes de finalizar.</p>
        )}
      </aside>
      {statusAction && (
        <ConfirmModal
          title={statusAction === 'finalizar' ? 'Finalizar torneo' : 'Reabrir torneo'}
          description={
            statusAction === 'finalizar'
              ? 'El torneo quedará en solo lectura.'
              : 'El torneo volverá a permitir cambios.'
          }
          confirmLabel={statusAction === 'finalizar' ? 'Finalizar torneo' : 'Reabrir torneo'}
          onClose={() => setStatusAction(undefined)}
          onConfirm={() => {
            updateTournament(id!, {
              status: statusAction === 'finalizar' ? 'finalizado' : 'activo',
            });
            setStatusAction(undefined);
          }}
        />
      )}
    </section>
  );
}
