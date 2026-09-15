import { Route } from 'react-router-dom';
import { PublicView } from '../pages/app/PublicTournamentPage';
import { LandingPage } from '../pages/LandingPage';

export const publicRoutes = [
  <Route key="landing" path="/" element={<LandingPage />} />,
  <Route key="public-tournament" path="/t/:slug" element={<PublicView />} />,
];
