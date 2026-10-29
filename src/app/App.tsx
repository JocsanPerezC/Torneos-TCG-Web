import { BrowserRouter } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { TournamentProvider } from '../state/TournamentContext';
import { AuthProvider } from '../state/AuthContext';
import { FormLimits } from '../components/FormLimits';
import { AppRouter } from './AppRouter';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TournamentProvider>
          <FormLimits />
          <AppRouter />
        </TournamentProvider>
      </AuthProvider>
      <Analytics />
    </BrowserRouter>
  );
}
