const steps = [
  ['01', 'Configura lo esencial', 'Elige el nombre, formato y número de rondas.'],
  [
    '02',
    'Añade participantes',
    'Registra a los jugadores y genera mesas para comenzar la primera ronda.',
  ],
  [
    '03',
    'Comparte el progreso',
    'Carga los resultados y deja disponible la clasificación durante el torneo.',
  ],
];

export function HowItWorks() {
  return (
    <section
      id="como-funciona"
      aria-labelledby="como-funciona-title"
      className="border-y border-border bg-white/70"
    >
      <div className="mx-auto max-w-6xl px-5 py-16">
        <div>
          <p className="text-xs font-semibold tracking-[.18em] text-accent">CÓMO FUNCIONA</p>
          <h2
            id="como-funciona-title"
            className="mt-3 text-3xl font-semibold text-foreground sm:text-4xl"
          >
            Empieza en minutos.
          </h2>
        </div>
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map(([number, title, description]) => (
            <li key={number} className="border-t-2 border-primary pt-5">
              <span className="text-sm font-semibold text-accent">{number}</span>
              <h3 className="mt-3 text-xl font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
