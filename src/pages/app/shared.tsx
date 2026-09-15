import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Home as HomeIcon, LogOut, ShieldCheck, Trophy } from 'lucide-react';
import type { Tournament } from '../../domain/types';
import { useTournament } from '../../state/TournamentContext';
import { useAuth } from '../../state/AuthContext';
import { Modal } from '../../components/ui/modal';
import { showToast, ToastViewport } from '../../components/ui/toast';

export const primary =
  'rounded-lg bg-amber-400 px-4 py-2 font-bold text-slate-950 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50';
export const panel =
  'rounded-xl border border-slate-700/70 bg-slate-900/75 p-5 shadow-xl shadow-slate-950/20';
export const field =
  'mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-amber-400';
const statusColor: Record<string, string> = {
  borrador: 'bg-slate-600',
  activa: 'bg-emerald-600',
  completada: 'bg-blue-600',
  activo: 'bg-emerald-600',
  finalizado: 'bg-violet-600',
};
const statusLabel: Record<string, string> = { borrador: 'En espera' };
export function Badge({ children }: { children: string }) {
  return (
    <span
      className={`inline-flex h-6 items-center rounded-md border border-slate-500 px-2 text-xs font-semibold leading-none ${statusColor[children] ?? 'bg-slate-600'}`}
    >
      {statusLabel[children] ?? children}
    </span>
  );
}
export function RoundTimer({ round }: { round: Tournament['rounds'][number] }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (round.status !== 'activa' || !round.startedAt) return;
    const update = () => setNow(Date.now());
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [round.status, round.startedAt]);
  if (!round.startedAt) return null;
  const elapsed = Math.max(
    0,
    (round.endedAt ? Date.parse(round.endedAt) : now) - Date.parse(round.startedAt),
  );
  const hours = Math.floor(elapsed / 3_600_000);
  const minutes = Math.floor((elapsed % 3_600_000) / 60_000);
  const seconds = Math.floor((elapsed % 60_000) / 1_000);
  const clock = [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
  return (
    <span className="round-timer text-sm font-semibold tabular-nums text-amber-300">
      Tiempo {clock}
    </span>
  );
}
export function Notice({
  children,
  error = false,
}: {
  children: React.ReactNode;
  error?: boolean;
}) {
  const shown = useRef<{ children: React.ReactNode; error: boolean } | undefined>(undefined);
  useEffect(() => {
    const previous = shown.current;
    if (previous && previous.children === children && previous.error === error) return;
    shown.current = { children, error };
    showToast(children, error);
  }, [children, error]);
  return null;
}
export function ConfirmModal({
  title,
  description,
  confirmLabel = 'Confirmar',
  destructive = false,
  onClose,
  onConfirm,
}: {
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal title={title} description={description} onClose={onClose}>
      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          className="rounded-lg border border-slate-500 px-4 py-2 text-sm font-semibold hover:bg-slate-800"
          onClick={onClose}
        >
          Cancelar
        </button>
        <button
          type="button"
          className={
            destructive
              ? 'rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white hover:bg-red-600'
              : primary
          }
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

function Header() {
  const { user, configured, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const authScreen = ['/login', '/register', '/forgot-password', '/auth/confirmed'].includes(
    location.pathname,
  );
  return (
    <header
      className="app-header border-b border-slate-700/70 backdrop-blur"
      style={{ animationDelay: `-${Date.now() % 16000}ms` }}
    >
      <div className="mx-auto flex min-h-[68px] max-w-6xl items-center justify-between px-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-lg font-black tracking-tight text-amber-300"
        >
          <HomeIcon size={18} />
          Home
        </Link>
        {!authScreen && (
          <nav className="flex flex-wrap justify-end gap-3 text-sm">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 hover:bg-slate-800"
            >
              <Trophy size={15} />
              Mis torneos
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-amber-300 hover:bg-slate-800"
              >
                <ShieldCheck size={15} />
                Administración
              </Link>
            )}
            {configured && user ? (
              <button
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 hover:bg-slate-800"
                onClick={() =>
                  void signOut()
                    .catch(() => undefined)
                    .finally(() => navigate('/', { replace: true }))
                }
              >
                <LogOut size={15} />
                Cerrar sesión
              </button>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 hover:bg-slate-800"
              >
                <Trophy size={15} />
                Organizador
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
function CompletionRedirect() {
  const { id } = useParams();
  const tournament = useTournament(id);
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (
      tournament &&
      location.pathname.endsWith('/rounds') &&
      sessionStorage.getItem('mesa-mayor.completed-tournament') === tournament.id
    ) {
      sessionStorage.removeItem('mesa-mayor.completed-tournament');
      navigate(`/tournaments/${tournament.id}/standings`, { replace: true });
    }
  }, [tournament, location.pathname, navigate]);
  return null;
}
export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <CompletionRedirect />
      <main className="mx-auto min-h-[calc(100vh-65px)] w-full max-w-6xl px-4 py-8">
        {children}
      </main>
      <ToastViewport />
    </>
  );
}
