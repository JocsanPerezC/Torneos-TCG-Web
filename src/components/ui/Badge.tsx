import i18n from '../../i18n';

const statusColor: Record<string, string> = {
  borrador: 'border-[#E7E2D2] bg-[#F4F1E7] text-muted-foreground',
  activa: 'border-[#BDE8CC] bg-[#E5F7EC] text-[#168050]',
  completada: 'border-[#D6DEFF] bg-[#E9EDFF] text-[#3D5AFB]',
  activo: 'border-[#BDE8CC] bg-[#E5F7EC] text-[#168050]',
  finalizado: 'border-[#DDD0FF] bg-[#F0E9FF] text-[#5B1FE0]',
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
