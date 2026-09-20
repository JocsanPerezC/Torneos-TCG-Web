import { lazy, Suspense } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { TournamentProvider } from './state/TournamentContext'
import { AuthProvider } from './state/AuthContext'
import { FormLimits } from './components/FormLimits'

const AppRouter = lazy(() => import('./pages/AppRouter').then(({ AppRouter }) => ({ default: AppRouter })))

export default function App() {
  return <BrowserRouter><AuthProvider><TournamentProvider><FormLimits /><Suspense fallback={<main className="min-h-screen bg-background" />}><AppRouter /></Suspense></TournamentProvider></AuthProvider></BrowserRouter>
}
