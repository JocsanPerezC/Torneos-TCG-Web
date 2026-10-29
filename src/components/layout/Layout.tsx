import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { useTournament } from '@/state/TournamentContext';
import { useAuth } from '@/state/AuthContext';
import { ToastViewport } from '@/components/ui/toast';
import { Header } from '@/components/layout/PublicHeader';
import {
  AuthenticatedShell,
  type TournamentNavigation,
} from '@/components/layout/AuthenticatedShell';

function CompletionRedirect() {
  const { id } = useParams();
  const tournament = useTournament(id);
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (
      tournament &&
      location.pathname.endsWith('/rounds') &&
      sessionStorage.getItem('torneos-tcg.completed-tournament') === tournament.id
    ) {
      sessionStorage.removeItem('torneos-tcg.completed-tournament');
      navigate(`/tournaments/${tournament.id}/standings`, { replace: true });
    }
  }, [tournament, location.pathname, navigate]);
  return null;
}
export function Layout({
  children,
  wide = false,
  tournament,
  showHeader = true,
}: {
  children: React.ReactNode;
  wide?: boolean;
  tournament?: TournamentNavigation;
  showHeader?: boolean;
}) {
  const { configured, requiresLegalConsent, requiresRoleSelection, user } = useAuth();
  const useSidebar = configured && user && !requiresLegalConsent && !requiresRoleSelection;
  return useSidebar ? (
    <>
      <AuthenticatedShell wide={wide} tournament={tournament}>
        <CompletionRedirect />
        {children}
      </AuthenticatedShell>
      <ToastViewport />
    </>
  ) : (
    <>
      {showHeader && <Header />}
      <CompletionRedirect />
      <main
        className={`mx-auto min-h-[calc(100vh-72px)] w-full ${wide ? 'max-w-7xl' : 'max-w-6xl'} px-4 pb-8 ${showHeader ? 'pt-24' : 'pt-8'}`}
      >
        {children}
      </main>
      <ToastViewport />
    </>
  );
}
