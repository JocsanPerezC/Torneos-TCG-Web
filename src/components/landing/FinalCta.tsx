import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
      <div className="rounded-[3rem] bg-[#5B1FE0] px-6 py-14 text-center text-primary-foreground sm:px-12">
        <p className="text-xs font-semibold tracking-[.18em] text-white/75">LISTO PARA ORGANIZAR</p>
        <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-semibold sm:text-4xl">Prepara tu próxima mesa hoy.</h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/80 sm:text-base">Crea tu cuenta y concentra cada ronda, resultado y clasificación en un solo lugar.</p>
        <Button asChild size="lg" className="mt-7 bg-white !text-[#5B1FE0] hover:bg-[#FCFAEC] hover:!text-[#5B1FE0]"><Link to="/register">Crear mi primer torneo</Link></Button>
      </div>
    </section>
  )
}
