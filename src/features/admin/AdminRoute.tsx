import { Navigate } from 'react-router-dom';
import { useAuth } from '@/state/AuthContext';
import i18n from '@/i18n';

import { Layout } from '@/components/layout/Layout';
import { AdminDashboard } from '@/features/admin/AdminDashboard';

export function AdminRoute() {
  const { configured, user, loading, isAdmin } = useAuth();

  if (!configured) return <Navigate to="/" replace />;
  if (loading)
    return (
      <Layout>
        <p className="text-sm text-muted-foreground">{i18n.t('app.admin.verifyingAccess')}</p>
      </Layout>
    );
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return <AdminDashboard />;
}
