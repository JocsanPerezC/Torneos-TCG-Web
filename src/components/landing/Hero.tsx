import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function Hero() {
  return <section className="mx-auto max-w-[700px] px-5 pb-12 pt-18 text-center sm:pb-16 sm:pt-24">
    <p className="mb-5 text-xs font-semibold tracking-[.18em] text-accent">
      TORNEOS MULTIJUGADOR</p>
    <h1 className="text-5xl leading-[.96] font-semibold tracking-[-.045em] text-foreground sm:text-6xl">
      Configura tus torneos</h1>
    <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
      Organiza partidas de Commander y otros TCG sin perseguir resultados: arma las mesas, registra cada ronda y deja que la clasificación haga el resto.</p>
    <div className="mt-8 flex flex-wrap justify-center gap-3"><Button asChild size="lg"><Link to="/register">
    Crear cuenta</Link></Button><Button asChild variant="outline" size="lg"><Link to="/login">Iniciar sesión</Link></Button></div>
    <p className="mt-4 text-sm text-muted-foreground">Gratis para empezar. Los jugadores no necesitan cuenta.</p></section>
}
