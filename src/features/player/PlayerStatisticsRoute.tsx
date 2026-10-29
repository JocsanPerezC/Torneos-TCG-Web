import { Navigate } from 'react-router-dom';
import { useAuth } from '@/state/AuthContext';
import { PlayerStatisticsPage } from '@/features/player/PlayerStatisticsPage';

import { Layout } from '@/components/layout/Layout';

export function PlayerStatisticsRoute() {
  const { configured, isPlayer, loading, user } = useAuth();
  if (configured && !loading && !user) return <Navigate to="/login" replace />;
  if (!loading && !isPlayer) return <Navigate to="/dashboard" replace />;
  return (
    <Layout>
      <PlayerStatisticsPage />
    </Layout>
  );
}
