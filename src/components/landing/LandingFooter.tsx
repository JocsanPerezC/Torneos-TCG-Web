import { Link } from 'react-router-dom'
export function LandingFooter() { return <footer className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-slate-700 py-6 text-sm text-slate-400"><span>Mesa Mayor · Gestión de torneos multijugador</span><nav className="flex gap-4"><Link to="/login">Iniciar sesión</Link><Link to="/register">Crear cuenta</Link></nav></footer> }
