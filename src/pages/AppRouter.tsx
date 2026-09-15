import { Navigate, Route, Routes } from 'react-router-dom';
import { adminRoutes } from '../routes/adminRoutes';
import { authRoutes } from '../routes/authRoutes';
import { publicRoutes } from '../routes/publicRoutes';
import { tournamentRoutes } from '../routes/tournamentRoutes';

export function AppRouter() {
  return (
    <Routes>
      {publicRoutes}
      {authRoutes}
      {tournamentRoutes}
      {adminRoutes}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
