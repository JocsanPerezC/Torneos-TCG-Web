import { useParams } from 'react-router-dom';
import { useTournament } from '@/state/TournamentContext';

export function Current() {
  const { id } = useParams();
  const tournament = useTournament(id);
  if (!tournament) throw new Error('Torneo no encontrado');
  return tournament;
}
