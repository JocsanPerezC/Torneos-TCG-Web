const panel = 'app-panel';

export function AdminMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <article className={panel}>
      <div className="flex items-center gap-2 text-amber-300">
        {icon}
        <span className="text-sm font-semibold">{label}</span>
      </div>
      <strong className="mt-3 block text-3xl font-black tabular-nums">{value}</strong>
    </article>
  );
}
