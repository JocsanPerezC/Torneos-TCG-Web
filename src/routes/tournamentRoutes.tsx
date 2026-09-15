import { Route } from 'react-router-dom';
import { Dashboard, NewTournament } from '../pages/app/DashboardPages';
import { TournamentLayout } from '../pages/app/TournamentPages';

export const tournamentRoutes = [
  <Route key="dashboard" path="/dashboard" element={<Dashboard />} />,
  <Route key="new-tournament" path="/tournaments/new" element={<NewTournament />} />,
  <Route key="tournament" path="/tournaments/:id/*" element={<TournamentLayout />} />,
];
