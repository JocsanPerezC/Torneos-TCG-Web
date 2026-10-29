import type { LucideIcon } from 'lucide-react';

export function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
}) {
  return (
    <article className="app-stat-pill">
      <span>
        <Icon size={16} aria-hidden />
      </span>
      <strong>{value}</strong>
      <small>{label}</small>
    </article>
  );
}
