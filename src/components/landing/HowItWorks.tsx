import { Gamepad2, Store, Users } from 'lucide-react'

const steps = [
  ['Para cualquier grupo', 'Juntá a tus amistades, agregá jugadores y empezá en minutos.', Users, '#21B876'],
  ['Para cualquier TCG', 'Usá el formato y las reglas de puntuación que ya juegan en tu comunidad.', Gamepad2, '#5B1FE0'],
  ['Sin curva de aprendizaje', 'Un panel directo para registrar rondas y ver la clasificación.', Store, '#3D5AFB'],
]

export function HowItWorks() {
  return (
    <section aria-labelledby="como-funciona-title" className="border-y border-border bg-white/70">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <div className="text-center"><p className="text-xs font-bold tracking-[.18em] text-accent">HECHA PARA LA MESA</p><h2 id="como-funciona-title" className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">Todo lo necesario para jugar.</h2></div>
        <ol className="mt-10 grid gap-6 md:grid-cols-3">{steps.map(([title, description, Icon, color]) => <li key={title as string} className="text-center"><span className="feature-icon mx-auto inline-flex size-14 items-center justify-center rounded-full text-white" style={{ background: color as string }}><Icon size={25} /></span><h3 className="mt-4 text-xl font-bold text-foreground">{title as string}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{description as string}</p></li>)}</ol>
      </div>
    </section>
  )
}
