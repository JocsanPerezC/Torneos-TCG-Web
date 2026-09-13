import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-18 max-w-6xl items-center justify-between px-5">
        <Link to="/" className="font-serif text-2xl font-semibold tracking-tight text-foreground">Home</Link>
        <div className="flex items-center gap-1 sm:gap-2">
          <Button asChild variant="outline"><Link to="/login">Iniciar sesión</Link></Button>
          <Button asChild className="!text-black"><Link to="/register">Crear cuenta</Link></Button>
        </div>
      </div>
    </header>
  )
}
