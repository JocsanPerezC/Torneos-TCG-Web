// Versión del modo prueba; AppRouter usa otra Metric (ver docs/showcase-audit.md).

export function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-secondary/60 p-4 text-center">
      <strong className="block text-2xl text-accent">{value}</strong>
      <span className="mt-1 block text-xs font-semibold text-muted-foreground">{label}</span>
    </div>
  );
}
