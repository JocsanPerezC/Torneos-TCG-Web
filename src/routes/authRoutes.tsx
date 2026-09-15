import { Route } from 'react-router-dom';
import { Auth, ConfirmedAccount } from '../pages/app/AuthPages';

export const authRoutes = [
  <Route key="login" path="/login" element={<Auth title="Inicia sesión" />} />,
  <Route key="register" path="/register" element={<Auth title="Crea tu cuenta" />} />,
  <Route
    key="forgot-password"
    path="/forgot-password"
    element={<Auth title="Recupera tu contraseña" />}
  />,
  <Route key="confirmed-account" path="/auth/confirmed" element={<ConfirmedAccount />} />,
];
