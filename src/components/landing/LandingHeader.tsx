import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/state/AuthContext'

export function LandingHeader() {
  const { user, loading } = useAuth()

  return (
    <header className="app-header border-b border-border">
      <div className="relative mx-auto flex min-h-[72px] max-w-6xl items-center justify-between px-3 sm:px-5">
        <Link to="/" className="brand-wiggle inline-flex shrink-0 items-center gap-2 text-lg font-bold tracking-tight text-foreground sm:text-xl"><img src="/tcg-tournament-icon.svg" alt="" className="size-5" />Torneos TCG</Link>
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 lg:flex">
          <a href="#como-funciona" className="nav-sparkle px-3 py-2 text-sm font-semibold text-foreground hover:text-accent">Cómo funciona</a><a href="#puntuacion" className="nav-sparkle px-3 py-2 text-sm font-semibold text-accent">Puntuación</a><a href="#preguntas" className="nav-sparkle px-3 py-2 text-sm font-semibold text-foreground hover:text-accent">Preguntas frecuentes</a>
        </nav>
        <div className="flex shrink-0 items-center gap-1 text-sm sm:gap-2">{!loading && user ? <Button asChild className="h-9 px-3 sm:h-10 sm:px-5"><Link to="/dashboard">Ir al panel</Link></Button> : <><Link to="/login" className="nav-wiggle hidden font-semibold text-foreground sm:inline">Iniciar sesión</Link><Button asChild className="h-9 px-3 sm:h-10 sm:px-5"><Link to="/register">Crear cuenta</Link></Button></>}</div>
      </div>
    </header>
  )
}
