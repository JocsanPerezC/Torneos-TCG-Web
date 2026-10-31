import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { lazy, Suspense, useEffect, type ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/state/AuthContext';
import { savedInvitationReturnPath } from '@/lib/invitationReturnPath';
import { reloadForStaleChunk } from '@/lib/chunkReload';

// Cada pantalla se descarga al visitarla; así quien abre un enlace público o el
// dashboard no descarga el landing (y GSAP), ni el landing el marco de la app.
function lazyNamed<M, K extends keyof M>(load: () => Promise<M>, name: K) {
  type Page = Extract<M[K], ComponentType<any>>;
  return lazy<Page>(async () => {
    try {
      return { default: (await load())[name] as Page };
    } catch (error) {
      // Chunk de un despliegue anterior: recarga y espera, en lugar de mostrar el error.
      if (reloadForStaleChunk()) await new Promise(() => {});
      throw error;
    }
  });
}
const landing = () => import('@/features/landing/LandingPage');
// En la portada, la descarga del landing empieza en paralelo con el arranque de React.
if (typeof window !== 'undefined' && window.location.pathname === '/') void landing();
const legal = () => import('@/features/legal/LegalPages');
const auth = () => import('@/features/auth/AuthPage');
const tournaments = () => import('@/features/tournaments/routes');
const PrivacyPolicyPage = lazyNamed(legal, 'PrivacyPolicyPage');
const TermsPage = lazyNamed(legal, 'TermsPage');
const LandingPage = lazyNamed(landing, 'LandingPage');
const Layout = lazyNamed(() => import('@/components/layout/Layout'), 'Layout');
const TrialPage = lazyNamed(() => import('@/features/trial/TrialPage'), 'TrialPage');
const ComponentShowcasePage = lazyNamed(
  () => import('@/features/showcase/ComponentShowcasePage'),
  'ComponentShowcasePage',
);
const CompleteRolePage = lazyNamed(
  () => import('@/features/auth/CompleteRolePage'),
  'CompleteRolePage',
);
const JoinTournamentPage = lazyNamed(
  () => import('@/features/player/JoinTournamentPage'),
  'JoinTournamentPage',
);
const ProfilePage = lazyNamed(() => import('@/features/profile/ProfilePage'), 'ProfilePage');
const AppSettingsPage = lazyNamed(
  () => import('@/features/profile/AppSettingsPage'),
  'AppSettingsPage',
);
const LegalConsent = lazyNamed(() => import('@/features/auth/LegalConsent'), 'LegalConsent');
const Auth = lazyNamed(auth, 'Auth');
const ConfirmedAccount = lazyNamed(auth, 'ConfirmedAccount');
const Dashboard = lazyNamed(() => import('@/features/dashboard/Dashboard'), 'Dashboard');
const PlayerStatisticsRoute = lazyNamed(
  () => import('@/features/player/PlayerStatisticsRoute'),
  'PlayerStatisticsRoute',
);
const CounterRoute = lazyNamed(() => import('@/features/counter/CounterRoute'), 'CounterRoute');
const NewTournament = lazyNamed(
  () => import('@/features/tournaments/NewTournament'),
  'NewTournament',
);
const TournamentLayout = lazyNamed(tournaments, 'TournamentLayout');
const Overview = lazyNamed(tournaments, 'Overview');
const Players = lazyNamed(tournaments, 'Players');
const Rounds = lazyNamed(tournaments, 'Rounds');
const Standings = lazyNamed(tournaments, 'Standings');
const Settings = lazyNamed(tournaments, 'Settings');
const PublicView = lazyNamed(() => import('@/features/public/PublicView'), 'PublicView');
const AdminRoute = lazyNamed(() => import('@/features/admin/AdminRoute'), 'AdminRoute');

export function AppRouter() {
  useTranslation();
  return (
    <>
      <InvitationReturn />
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/trial" element={<TrialPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route
            path="/muestrario"
            element={
              <LocalOnly>
                <ComponentShowcasePage />
              </LocalOnly>
            }
          />
          <Route
            path="/unirse"
            element={
              <ConsentGuard>
                <Layout>
                  <JoinTournamentPage />
                </Layout>
              </ConsentGuard>
            }
          />
          <Route
            path="/unirse/:token"
            element={
              <ConsentGuard>
                <Layout>
                  <JoinTournamentPage />
                </Layout>
              </ConsentGuard>
            }
          />
          <Route
            path="/perfil"
            element={
              <ConsentGuard>
                <Layout>
                  <ProfilePage />
                </Layout>
              </ConsentGuard>
            }
          />
          <Route
            path="/configuracion"
            element={
              <ConsentGuard>
                <Layout>
                  <AppSettingsPage />
                </Layout>
              </ConsentGuard>
            }
          />
          <Route
            path="/completar-perfil"
            element={
              <Layout showHeader={false}>
                <CompleteRolePage />
              </Layout>
            }
          />
          <Route path="/legal-consent" element={<LegalConsent />} />
          <Route path="/login" element={<Auth screen="login" />} />
          <Route path="/register" element={<Auth screen="register" />} />
          <Route path="/forgot-password" element={<Auth screen="recovery" />} />
          <Route path="/auth/confirmed" element={<ConfirmedAccount />} />
          <Route
            path="/dashboard"
            element={
              <ConsentGuard>
                <Dashboard />
              </ConsentGuard>
            }
          />
          <Route
            path="/dashboard/tournaments"
            element={
              <ConsentGuard>
                <Dashboard view="tournaments" />
              </ConsentGuard>
            }
          />
          <Route
            path="/estadisticas"
            element={
              <ConsentGuard>
                <PlayerStatisticsRoute />
              </ConsentGuard>
            }
          />
          <Route
            path="/contador"
            element={
              <ConsentGuard>
                <CounterRoute />
              </ConsentGuard>
            }
          />
          <Route
            path="/admin"
            element={
              <ConsentGuard>
                <AdminRoute />
              </ConsentGuard>
            }
          />
          <Route
            path="/tournaments/new"
            element={
              <ConsentGuard>
                <NewTournament />
              </ConsentGuard>
            }
          />
          <Route
            path="/tournaments/:id/*"
            element={
              <ConsentGuard>
                <TournamentLayout />
              </ConsentGuard>
            }
          >
            <Route index element={<Overview />} />
            <Route path="players" element={<Players />} />
            <Route path="rounds" element={<Rounds />} />
            <Route path="standings" element={<Standings />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="/t/:slug" element={<PublicView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}

function InvitationReturn() {
  const { loading, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const path = savedInvitationReturnPath();
    const resumePaths = ['/', '/login', '/register', '/auth/confirmed', '/dashboard'];
    if (!user || loading || !path || !resumePaths.includes(location.pathname)) return;
    navigate(path, { replace: true });
  }, [loading, location.pathname, navigate, user]);

  return null;
}

function LocalOnly({ children }: { children: React.ReactNode }) {
  const localHosts = ['localhost', '127.0.0.1', '::1'];
  return typeof window !== 'undefined' && localHosts.includes(window.location.hostname) ? (
    <>{children}</>
  ) : (
    <Navigate to="/" replace />
  );
}

function ConsentGuard({ children }: { children: React.ReactNode }) {
  const { user, requiresLegalConsent, requiresRoleSelection } = useAuth();
  const location = useLocation();
  if (user && requiresRoleSelection)
    return (
      <Navigate
        to={`/completar-perfil?next=${encodeURIComponent(`${location.pathname}${location.search}`)}`}
        replace
      />
    );
  return user && requiresLegalConsent ? (
    <Navigate
      to={`/legal-consent?next=${encodeURIComponent(`${location.pathname}${location.search}`)}`}
      replace
    />
  ) : (
    <>{children}</>
  );
}
