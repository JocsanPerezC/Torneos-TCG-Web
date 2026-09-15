import { Route } from 'react-router-dom';
import { AdminRoute } from '../pages/app/AdminPage';

export const adminRoutes = [<Route key="admin" path="/admin" element={<AdminRoute />} />];
