import { BrowserRouter } from 'react-router-dom'
import { AppRouter } from './routes/AppRouter'
import { TournamentProvider } from './state/TournamentContext'
import { AuthProvider } from './state/AuthContext'

export default function App() {
  return <BrowserRouter><AuthProvider><TournamentProvider><AppRouter /></TournamentProvider></AuthProvider></BrowserRouter>
}
