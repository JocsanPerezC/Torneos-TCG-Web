import { BrowserRouter } from 'react-router-dom'
import { TournamentProvider } from './state/TournamentContext'
import { AuthProvider } from './state/AuthContext'
import { FormLimits } from './components/FormLimits'
import { AppErrorBoundary } from './components/AppErrorBoundary'
import { AppRouter } from './pages/AppRouter'

export default function App() {
  return <AppErrorBoundary><BrowserRouter><AuthProvider><TournamentProvider><FormLimits /><AppRouter /></TournamentProvider></AuthProvider></BrowserRouter></AppErrorBoundary>
}
