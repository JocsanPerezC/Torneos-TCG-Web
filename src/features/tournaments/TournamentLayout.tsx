import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { useTournament, useTournaments } from '@/state/TournamentContext';
import { useAuth } from '@/state/AuthContext';
import { Badge } from '@/components/ui/Badge';
import { Notice } from '@/components/feedback/Notice';
import { Standings } from '@/features/tournaments/components/Standings';
import i18n from '@/i18n';

import { Layout } from '@/components/layout/Layout';
import { Overview } from '@/features/tournaments/Overview';
import { Statistics } from '@/features/tournaments/Statistics';
import { Players } from '@/features/tournaments/Players';
import { Rounds } from '@/features/tournaments/Rounds';
import { Settings } from '@/features/tournaments/Settings';

export function TournamentLayout() {
  const { id } = useParams();
  const tournament = useTournament(id);
  const { ready } = useTournaments();
  const { isAdmin, isPlayer, loading } = useAuth();
  if (loading || !ready)
    return (
      <Layout wide>
        <div className="app-loading-note">
          <i />
          <span>{i18n.t('app.common.loading')}</span>
        </div>
      </Layout>
    );
  if (isAdmin) return <Navigate to="/admin" replace />;
  if (isPlayer) return <Navigate to="/dashboard" replace />;
  if (!tournament)
    return (
      <Layout>
        <Notice error>{i18n.t('app.tournament.notFound')}</Notice>
      </Layout>
    );
  return (
    <Layout wide tournament={{ id: tournament.id, name: tournament.name }}>
      <header className="tournament-masthead">
        <div>
          <p>{tournament.format}</p>
          <h1>{tournament.name}</h1>
        </div>
        <Badge>{tournament.status}</Badge>
      </header>
      <Routes>
        <Route index element={<Overview />} />
        <Route path="players" element={<Players />} />
        <Route path="rounds" element={<Rounds />} />
        <Route path="standings" element={<Standings />} />
        <Route path="statistics" element={<Statistics />} />
        <Route path="settings" element={<Settings />} />
      </Routes>
    </Layout>
  );
}
