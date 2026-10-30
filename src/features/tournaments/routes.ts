// Pantallas de un torneo. AppRouter las carga juntas, en un solo chunk,
// para que cambiar de pestaña dentro del torneo no espere otra descarga.
export { TournamentLayout } from '@/features/tournaments/TournamentLayout';
export { Overview } from '@/features/tournaments/Overview';
export { Players } from '@/features/tournaments/Players';
export { Rounds } from '@/features/tournaments/Rounds';
export { Settings } from '@/features/tournaments/Settings';
export { Standings } from '@/features/tournaments/components/Standings';
