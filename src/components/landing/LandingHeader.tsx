import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export function LandingHeader() {
  const animationDelay = `-${Date.now() % 16000}ms`;

  return (
    <header
      className="app-header border-b border-slate-700/70 backdrop-blur"
      style={{ animationDelay }}
    >
      <div className="mx-auto flex min-h-[68px] max-w-6xl items-center justify-between px-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-lg font-black tracking-tight text-amber-300"
        >
          <Home size={18} />
          Home
        </Link>
        <nav className="flex items-center gap-1.5 text-xs sm:gap-3 sm:text-sm">
          <Link
            to="/login"
            className="rounded-md border border-slate-500 px-2 py-2 font-semibold hover:bg-slate-800 sm:px-3"
          >
            Iniciar sesión
          </Link>
          <Link
            to="/register"
            className="rounded-md bg-amber-400 px-2 py-2 font-bold text-slate-950 hover:bg-amber-300 sm:px-3"
          >
            Crear cuenta
          </Link>
        </nav>
      </div>
    </header>
  );
}
