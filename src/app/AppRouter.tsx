import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/state/AuthContext';
import { LandingPage } from '@/features/landing/LandingPage';
import { PrivacyPolicyPage, TermsPage } from '@/features/legal/LegalPages';
import { TrialPage } from '@/features/trial/TrialPage';
import { ComponentShowcasePage } from '@/features/showcase/ComponentShowcasePage';
import { CompleteRolePage } from '@/features/auth/CompleteRolePage';
import { JoinTournamentPage } from '@/features/player/JoinTournamentPage';
import { ProfilePage } from '@/features/profile/ProfilePage';
import { AppSettingsPage } from '@/features/profile/AppSettingsPage';
import { savedInvitationReturnPath } from '@/lib/invitationReturnPath';
import { Standings } from '@/features/tournaments/components/Standings';

import { Layout } from '@/components/layout/Layout';
import { LegalConsent } from '@/features/auth/LegalConsent';
import { Auth, ConfirmedAccount } from '@/features/auth/AuthPage';
import { Dashboard } from '@/features/dashboard/Dashboard';
import { PlayerStatisticsRoute } from '@/features/player/PlayerStatisticsRoute';
import { NewTournament } from '@/features/tournaments/NewTournament';
import { TournamentLayout } from '@/features/tournaments/TournamentLayout';
import { Overview } from '@/features/tournaments/Overview';
import { Players } from '@/features/tournaments/Players';
import { Rounds } from '@/features/tournaments/Rounds';
import { Settings } from '@/features/tournaments/Settings';
import { PublicView } from '@/features/public/PublicView';
import { AdminRoute } from '@/features/admin/AdminRoute';

export function AppRouter() {
  useTranslation();
  return (
    <>
      <InvitationReturn />
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
