import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import type { Tournament } from '../../domain/types';
import { getUserProfile } from '../../lib/userProfile';
import { useAuth } from '../../state/AuthContext';
import { useTournaments } from '../../state/TournamentContext';
import { Modal } from '../../components/ui/modal';
import { Badge, ConfirmModal, field, Layout, Notice, panel, primary } from './shared';

function OrganizerIdentity({ user }: { user: User | null }) {
  const { name, avatarUrl } = getUserProfile(user);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const avatarSource = avatarFailed || !avatarUrl ? '/default-avatar.svg' : avatarUrl;

  return (
    <p className="flex items-center gap-2 text-sm text-amber-300">
      <span className="inline-flex h-7 w-7 shrink-0 overflow-hidden rounded-full border border-amber-300/40 bg-slate-800 text-xs font-bold text-amber-200">
        <img
          src={avatarSource}
          alt=""
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
          onError={() => setAvatarFailed(true)}
        />
      </span>
      <span>Panel de {name}</span>
    </p>
  );
}

export function Dashboard() {
  const { tournaments, ready, remoteError, removeTournament } = useTournaments();
  const { configured, user, loading } = useAuth();
  const [tournamentToDelete, setTournamentToDelete] = useState<Tournament>();
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  const ownTournaments = tournaments.filter((tournament) => tournament.ownerId === user?.id);
  if (configured && !loading && !user) return <Navigate to="/login" replace />;
  return (
    <Layout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <OrganizerIdentity user={user} />
          <h1 className="text-3xl font-black">Mis torneos</h1>
        </div>
        <button className={primary} onClick={() => setCreating(true)}>
          + Nuevo torneo
        </button>
      </div>
      {!ready && <p className="mb-4 text-sm text-slate-300">Cargando tus torneos…</p>}
      {remoteError && (
        <div className="mb-4">
          <Notice error>{remoteError}</Notice>
        </div>
      )}
      {(['activo', 'finalizado'] as const).map((status) => (
        <section key={status} className="mb-7">
          <h2 className="mb-3 text-lg font-bold">
            {status === 'activo' ? 'Activos' : 'Finalizados'}
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {ownTournaments
              .filter((t) => t.status === status)
              .map((t) => (
                <article
                  key={t.id}
                  role="link"
                  tabIndex={0}
                  className={`${panel} cursor-pointer transition hover:-translate-y-0.5 hover:border-amber-400`}
                  onClick={(event) => {
                    if (!(event.target as HTMLElement).closest('button'))
                      navigate(`/tournaments/${t.id}`);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') navigate(`/tournaments/${t.id}`);
                  }}
                >
                  <div className="flex justify-between gap-2">
                    <strong>{t.name}</strong>
                    <Badge>{t.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-300">
                    {t.format} · {t.players.filter((p) => p.active).length} activos ·{' '}
                    {t.rounds.length}/{t.plannedRounds} rondas
                  </p>
                  <div className="mt-3 flex justify-end">
                    <button
                      className="text-sm text-red-300 underline"
                      onClick={() => setTournamentToDelete(t)}
                    >
                      Eliminar
                    </button>
                  </div>
                </article>
              ))}
            {ready && !ownTournaments.some((t) => t.status === status) && (
              <p className="text-sm text-slate-400">Aún no hay torneos en este estado.</p>
            )}
          </div>
        </section>
      ))}
      {creating && <TournamentCreateModal onClose={() => setCreating(false)} />}
      {tournamentToDelete && (
        <ConfirmModal
          title="Eliminar torneo"
          description={`Eliminarás “${tournamentToDelete.name}” y todas sus rondas, mesas y resultados. Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar torneo"
          destructive
          onClose={() => setTournamentToDelete(undefined)}
          onConfirm={() => {
            removeTournament(tournamentToDelete.id);
            setTournamentToDelete(undefined);
          }}
        />
      )}
    </Layout>
  );
}

function TournamentCreateModal({ onClose }: { onClose: () => void }) {
  const { createTournament } = useTournaments();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const plannedRounds = Number(form.get('rounds'));
    const maxPlayers = Number(form.get('maxPlayers'));
    const maxTables = Number(form.get('maxTables'));
    if (
      !Number.isInteger(plannedRounds) ||
      plannedRounds < 1 ||
      !Number.isInteger(maxPlayers) ||
      maxPlayers < 3 ||
      !Number.isInteger(maxTables) ||
      maxTables < 1
    ) {
      setError('Indica límites válidos: al menos 3 jugadores y 1 mesa.');
      return;
    }
    const tournament = createTournament({
      name: String(form.get('name')),
      format: String(form.get('format')),
      plannedRounds,
      isPublic: true,
      maxPlayers,
      maxTables,
    });
    onClose();
    navigate(`/tournaments/${tournament.id}`);
  }
  return (
    <Modal title="Nuevo torneo" onClose={onClose}>
      <form className="space-y-4" onSubmit={submit}>
        {error && <Notice error>{error}</Notice>}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm sm:col-span-2">
            Nombre
            <input
              autoFocus
              required
              name="name"
              className={field}
              placeholder="Commander de sábado"
            />
          </label>
          <label className="text-sm">
            Formato
            <input name="format" defaultValue="Commander" className={field} />
          </label>
          <label className="text-sm">
            Rondas
            <input
              required
              name="rounds"
              defaultValue="3"
              min="1"
              type="number"
              className={field}
            />
          </label>
          <label className="text-sm">
            Máximo de jugadores
            <input
              required
              name="maxPlayers"
              defaultValue="32"
              min="3"
              type="number"
              className={field}
            />
          </label>
          <label className="text-sm">
            Máximo de mesas
            <input
              required
              name="maxTables"
              defaultValue="8"
              min="1"
              type="number"
              className={field}
            />
          </label>
        </div>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="rounded-lg border border-slate-500 px-4 py-2 text-sm font-semibold hover:bg-slate-800"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button className={primary}>Crear torneo</button>
        </div>
      </form>
    </Modal>
  );
}
export function NewTournament() {
  const { createTournament } = useTournaments();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const rounds = Number(values.get('rounds'));
    const maxPlayers = Number(values.get('maxPlayers'));
    const maxTables = Number(values.get('maxTables'));
    if (
      !Number.isInteger(rounds) ||
      rounds < 1 ||
      !Number.isInteger(maxPlayers) ||
      maxPlayers < 3 ||
      !Number.isInteger(maxTables) ||
      maxTables < 1
    )
      return setError('Indica límites válidos: al menos 3 jugadores y 1 mesa.');
    const tournament = createTournament({
      name: String(values.get('name')),
      format: String(values.get('format')),
      plannedRounds: rounds,
      isPublic: true,
      maxPlayers,
      maxTables,
    });
    navigate(`/tournaments/${tournament.id}`);
  }
  return (
    <Layout>
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-5 text-3xl font-black">Nuevo torneo</h1>
        <form onSubmit={submit} className={`${panel} space-y-4`}>
          {error && <Notice error>{error}</Notice>}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm">
              Nombre
              <input required name="name" className={field} placeholder="Commander de sábado" />
            </label>
            <label className="text-sm">
              Juego o formato
              <input name="format" defaultValue="Commander" className={field} />
            </label>
            <label className="text-sm">
              Rondas planificadas
              <input
                required
                name="rounds"
                defaultValue="3"
                min="1"
                type="number"
                className={field}
              />
            </label>
            <label className="text-sm">
              Máximo de jugadores
              <input
                required
                name="maxPlayers"
                defaultValue="32"
                min="3"
                type="number"
                className={field}
              />
            </label>
            <label className="text-sm">
              Máximo de mesas
              <input
                required
                name="maxTables"
                defaultValue="8"
                min="1"
                type="number"
                className={field}
              />
            </label>
          </div>
          <p className="text-sm text-slate-300">
            Los puntos se asignan manualmente a cada jugador cuando se guarda el resultado de su
            mesa.
          </p>
          <button className={primary}>Crear torneo</button>
        </form>
      </div>
    </Layout>
  );
}
