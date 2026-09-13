import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function LandingHeader() {
  return <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur"><div className="mx-auto flex h-18 max-w-6xl items-center justify-between px-5"><Link to="/" className="font-serif text-2xl font-semibold tracking-tight text-foreground">Home</Link><nav aria-label="Navegación principal" className="hidden items-center gap-1 md:flex"><Button asChild variant="ghost"><a href="#como-funciona">Cómo funciona</a></Button><Button asChild variant="ghost"><a href="#puntuacion">Puntuación</a></Button><Button asChild variant="ghost"><a href="#preguntas">Preguntas frecuentes</a></Button></nav><div className="flex items-center gap-1 sm:gap-2"><Button asChild variant="ghost"><Link to="/login">Iniciar sesión</Link></Button><Button asChild><Link to="/register">Crear cuenta</Link></Button></div></div></header>
}
