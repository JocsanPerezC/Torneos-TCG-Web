import type { LucideIcon } from 'lucide-react';

export function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
}) {
  return (
    <article className={Icon ? 'app-stat-pill' : 'app-stat-pill app-stat-pill--plain'}>
      {Icon && (
        <span>
          <Icon size={16} aria-hidden />
        </span>
      )}
      <strong>{value}</strong>
      <small>{label}</small>
    </article>
  );
}
