import i18n from '../../i18n';

const statusColor: Record<string, string> = {
  borrador: 'border-border bg-secondary text-muted-foreground',
  activa: 'border-[#BDE8CC] bg-success-soft text-primary-strong',
  completada: 'border-[#D6DEFF] bg-accent-soft text-accent',
  activo: 'border-[#BDE8CC] bg-success-soft text-primary-strong',
  finalizado: 'border-[#DDD0FF] bg-violet-soft text-violet',
};
export function Badge({ children }: { children: string }) {
  const labels: Record<string, string> = {
    borrador: i18n.t('app.common.draft'),
    activa: i18n.t('app.common.activeStatus'),
    completada: i18n.t('app.common.completed'),
    activo: i18n.t('app.common.tournamentActive'),
    finalizado: i18n.t('app.common.finished'),
  };
  return (
    <span
      className={`app-badge ${statusColor[children] ?? 'bg-transparent text-muted-foreground'}`}
    >
      {labels[children] ?? children}
    </span>
  );
}
