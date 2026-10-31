import { Navigate } from 'react-router-dom';
import { useAuth } from '@/state/AuthContext';
import { CounterPage } from '@/features/counter/CounterPage';
import { Layout } from '@/components/layout/Layout';

export function CounterRoute() {
  const { configured, isPlayer, loading, user } = useAuth();
  if (configured && !loading && !user) return <Navigate to="/login" replace />;
  if (!loading && !isPlayer) return <Navigate to="/dashboard" replace />;
  return (
    <Layout immersive>
      <CounterPage />
    </Layout>
  );
}
