import { Card, CardContent } from '@/components/ui/card';

const features = [
  [
    'Crea el torneo',
    'Define el formato, las rondas y la puntuación antes de sentarte a jugar.',
    'border-l-primary',
  ],
  [
    'Genera las mesas',
    'Forma mesas equilibradas de tres o cuatro jugadores en cada ronda.',
    'border-l-accent',
  ],
  [
    'Publica los resultados',
    'Registra resultados y comparte una clasificación clara con los participantes.',
    'border-l-primary',
  ],
];

export function FeatureList() {
  return (
    <section aria-labelledby="beneficios-title" className="mx-auto max-w-6xl px-5 py-16">
      <div className="max-w-xl">
        <p className="text-xs font-semibold tracking-[.18em] text-accent">TODO BAJO CONTROL</p>
        <h2
          id="beneficios-title"
          className="mt-3 text-3xl font-semibold text-foreground sm:text-4xl"
        >
          Menos logística. Más partidas.
        </h2>
      </div>
      <div className="mt-9 grid gap-5 md:grid-cols-3">
        {features.map(([title, description, accent]) => (
          <Card
            className={`rounded-none border-y-0 border-r-0 border-l-4 ${accent} bg-transparent shadow-none`}
            key={title}
          >
            <CardContent className="p-0 pl-4">
              <h3 className="text-base font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
