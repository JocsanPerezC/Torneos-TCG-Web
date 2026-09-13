import { Link } from 'react-router-dom'
import { useAuth } from '../../state/AuthContext'

export function LandingHeader() {
  const { user } = useAuth()
  return <header className="sticky top-0 z-10 border-b border-slate-700/70 bg-slate-950/90 backdrop-blur"><div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4"><Link to="/" className="text-lg font-black tracking-tight text-amber-300">Home</Link>{user ? <Link className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-amber-300" to="/dashboard">Ir al panel</Link> : <nav className="flex items-center gap-2 sm:gap-3"><Link className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800" to="/login">Iniciar sesión</Link><Link className="rounded-lg bg-amber-400 px-3 py-2 text-sm font-bold text-slate-950 hover:bg-amber-300 sm:px-4" to="/register">Crear cuenta</Link></nav>}</div></header>
}
