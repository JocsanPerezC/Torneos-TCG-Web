import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useTournament, useTournaments } from '../state/TournamentContext'
import { useAuth } from '../state/AuthContext'
import { LandingPage } from '../pages/LandingPage'
import { PrivacyPolicyPage, TermsPage } from './LegalPages'
import { insertPlayers, loadAllTournaments, loadPublicTournament, persistPlayer, removeRemotePlayer } from '../data/tournamentRepository'
import { loadAdminOverview, updateProfileRole, type AdminOverview, type AppRole, type AssignableRole } from '../data/adminRepository'
import { deleteManagedUser, listManagedUsers, updateManagedUser, type ManagedUser } from '../data/adminUsersRepository'
import type { Tournament } from '../domain/types'
import { Archive, BarChart3, CircleX, Database, Equal, Eye, EyeOff, ExternalLink, GitBranch, Inbox, Info, LayoutDashboard, LogOut, Play, Plus, RefreshCw, Settings as SettingsIcon, ShieldCheck, Square, Table, Trash2, Trophy, Users, type LucideIcon } from 'lucide-react'
import { Modal } from '../components/ui/modal'
import { showToast, ToastViewport } from '../components/ui/toast'
import { GoogleAuthButton } from '../components/auth/GoogleAuthButton'
import { LanguageSelector } from '../components/ui/LanguageSelector'
import { uid, type Pod, type ResultOutcome } from '../domain/types'
import { tournamentStatistics } from '../domain/statistics'
import { BattleLedger } from '../components/tournament/BattleLedger'
import { getUserProfile } from '../lib/userProfile'
import i18n from '../i18n'
import { currentLegalConsent } from '../legal'
import type { User } from '@supabase/supabase-js'

const primary = 'app-button app-button--primary'
const panel = 'app-panel'
const field = 'app-field'
const statusColor: Record<string, string> = { borrador: 'border-[#E7E2D2] bg-[#F4F1E7] text-muted-foreground', activa: 'border-[#BDE8CC] bg-[#E5F7EC] text-[#168050]', completada: 'border-[#D6DEFF] bg-[#E9EDFF] text-[#3D5AFB]', activo: 'border-[#BDE8CC] bg-[#E5F7EC] text-[#168050]', finalizado: 'border-[#DDD0FF] bg-[#F0E9FF] text-[#5B1FE0]' }
function Badge({ children }: { children: string }) { const labels:Record<string,string>={borrador:i18n.t('app.common.draft'),activa:i18n.t('app.common.activeStatus'),completada:i18n.t('app.common.completed'),activo:i18n.t('app.common.tournamentActive'),finalizado:i18n.t('app.common.finished')}; return <span className={`app-badge ${statusColor[children] ?? 'bg-transparent text-muted-foreground'}`}>{labels[children] ?? children}</span> }
function RoundTimer({ round }: { round: Tournament['rounds'][number] }) { const [now,setNow]=useState(0); useEffect(()=>{if(round.status!=='activa'||!round.startedAt)return;const update=()=>setNow(Date.now());update();const interval=window.setInterval(update,1000);return()=>window.clearInterval(interval)},[round.status,round.startedAt]); if(!round.startedAt)return null; const elapsed=Math.max(0,(round.endedAt?Date.parse(round.endedAt):now)-Date.parse(round.startedAt)); const hours=Math.floor(elapsed/3_600_000); const minutes=Math.floor(elapsed%3_600_000/60_000); const seconds=Math.floor(elapsed%60_000/1_000); const clock=[hours,minutes,seconds].map(value=>String(value).padStart(2,'0')).join(':'); return <span className="round-timer" aria-label={i18n.t('app.tournament.round', { number: round.number })}>{clock}</span> }
function Notice({ children, error = false }: { children: React.ReactNode; error?: boolean }) { const validationMessages=[i18n.t('app.messages.completeResults'),i18n.t('app.messages.outcomeRequired')]; const isError=error||(typeof children==='string'&&validationMessages.includes(children)); const shown=useRef<{children:React.ReactNode;error:boolean}|undefined>(undefined); useEffect(()=>{const previous=shown.current;if(previous&&previous.children===children&&previous.error===isError)return;shown.current={children,error:isError};showToast(children,isError)},[children,isError]); return null }
function ConfirmModal({ title, description, confirmLabel, destructive=false, onClose, onConfirm }: { title:string; description:string; confirmLabel?:string; destructive?:boolean; onClose:()=>void; onConfirm:()=>void }) { return <Modal title={title} description={description} onClose={onClose}><div className="flex flex-wrap justify-end gap-3"><button type="button" className="rounded-lg border border-slate-500 px-4 py-2 text-sm font-semibold hover:bg-slate-800" onClick={onClose}>{i18n.t('app.common.cancel')}</button><button type="button" className={destructive ? 'rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white hover:bg-red-600' : primary} onClick={onConfirm}>{confirmLabel ?? i18n.t('app.common.save')}</button></div></Modal> }

function Header() {
  const { user, configured, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const authScreen = ['/login', '/register', '/forgot-password', '/auth/confirmed'].includes(location.pathname)

  return <header className="app-header app-shell-header">
    <div className="app-shell-header__bar mx-auto max-w-6xl">
      <Link to={authScreen ? '/' : '/dashboard'} className="app-shell-header__brand"><img src="/edh-tournaments-icon.svg" alt="" />EDH <span>Tournaments</span></Link>
      {!authScreen && <nav className="app-shell-header__actions" aria-label={i18n.t('landing.navigation.label')}>
      <Link to="/dashboard" aria-label={i18n.t('app.header.tournaments')} className="app-shell-header__link"><Trophy size={16} /><span className="hidden sm:inline">{i18n.t('app.header.tournaments')}</span></Link>
        {isAdmin && <Link to="/admin" aria-label={i18n.t('app.header.administration')} className="app-shell-header__link app-shell-header__link--admin"><ShieldCheck size={16} /><span className="hidden sm:inline">{i18n.t('app.header.administration')}</span></Link>}
        {configured && user ? <button aria-label={i18n.t('app.header.signOut')} className="app-shell-header__signout" onClick={() => void signOut().catch(() => undefined).finally(() => navigate('/', { replace: true }))}><LogOut size={16} /><span className="hidden sm:inline">{i18n.t('app.header.signOut')}</span></button> : <Link to="/login" aria-label={i18n.t('app.header.organizer')} className="app-shell-header__link"><Trophy size={16} /><span className="hidden sm:inline">{i18n.t('app.header.organizer')}</span></Link>}
        <LanguageSelector />
      </nav>}
    </div>
  </header>
}
function CompletionRedirect() { const { id } = useParams(); const tournament = useTournament(id); const location = useLocation(); const navigate = useNavigate(); useEffect(() => { if (tournament && location.pathname.endsWith('/rounds') && sessionStorage.getItem('torneos-tcg.completed-tournament') === tournament.id) { sessionStorage.removeItem('torneos-tcg.completed-tournament'); navigate(`/tournaments/${tournament.id}/standings`, { replace: true }) } }, [tournament, location.pathname, navigate]); return null }
function Layout({ children }: { children: React.ReactNode }) { return <><Header /><CompletionRedirect /><main className="mx-auto min-h-[calc(100vh-72px)] w-full max-w-6xl px-4 pb-8 pt-24">{children}</main><ToastViewport /></> }
export function AppRouter() { useTranslation(); return <Routes><Route path="/" element={<LandingPage />} /><Route path="/privacy" element={<PrivacyPolicyPage />} /><Route path="/terms" element={<TermsPage />} /><Route path="/legal-consent" element={<LegalConsent />} /><Route path="/login" element={<Auth screen="login" />} /><Route path="/register" element={<Auth screen="register" />} /><Route path="/forgot-password" element={<Auth screen="recovery" />} /><Route path="/auth/confirmed" element={<ConfirmedAccount />} /><Route path="/dashboard" element={<ConsentGuard><Dashboard /></ConsentGuard>} /><Route path="/admin" element={<ConsentGuard><AdminRoute /></ConsentGuard>} /><Route path="/tournaments/new" element={<ConsentGuard><NewTournament /></ConsentGuard>} /><Route path="/tournaments/:id/*" element={<ConsentGuard><TournamentLayout /></ConsentGuard>}><Route index element={<Overview />} /><Route path="players" element={<Players />} /><Route path="rounds" element={<Rounds />} /><Route path="standings" element={<Standings />} /><Route path="settings" element={<Settings />} /></Route><Route path="/t/:slug" element={<PublicView />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes> }

function ConsentGuard({ children }: { children: React.ReactNode }) { const { user, requiresLegalConsent } = useAuth(); return user && requiresLegalConsent ? <Navigate to="/legal-consent" replace /> : <>{children}</> }

function LegalConsent() {
  const { user, requiresLegalConsent, acceptLegalConsent } = useAuth()
  const navigate = useNavigate()
  const [accepted, setAccepted] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  if (!user || !requiresLegalConsent) return <Navigate to="/dashboard" replace />
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!accepted) return setError('You must accept the Terms & Conditions and Privacy Policy to continue.')
    setBusy(true)
    try { await acceptLegalConsent(); navigate('/dashboard', { replace: true }) } catch { setError('We could not save your acceptance. Please try again.') } finally { setBusy(false) }
  }
  return <Layout><div className="mx-auto max-w-md"><section lang="en" className={`${panel} space-y-4`}><h1 className="text-2xl font-black">Accept legal documents</h1><p className="text-sm text-slate-300">Before using your new account, please review and accept the following documents.</p><form onSubmit={submit} className="space-y-4"><label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-secondary/40 p-3 text-sm leading-5"><input required checked={accepted} onChange={event => { setAccepted(event.target.checked); if (event.target.checked) setError('') }} type="checkbox" className="mt-1 size-4 accent-[#21B876]" /><span>I have read and agree to the <Link to="/terms" target="_blank" rel="noreferrer" className="font-semibold text-accent underline">Terms &amp; Conditions</Link> and <Link to="/privacy" target="_blank" rel="noreferrer" className="font-semibold text-accent underline">Privacy Policy</Link>.</span></label>{error && <p role="alert" className="text-sm text-red-300">{error}</p>}<button disabled={busy} className={`${primary} w-full`}>{busy ? 'Saving…' : 'Continue'}</button></form></section></div></Layout>
}

function Home() { return <Layout><section className="card-pattern overflow-hidden rounded-2xl border border-amber-300/30 bg-slate-900 px-6 py-18 text-center sm:px-12"><p className="mb-4 text-sm font-bold tracking-[.2em] text-amber-300">TORNEOS MULTIJUGADOR</p><h1 className="mx-auto max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">Organiza la próxima gran mesa.</h1><p className="mx-auto mt-5 max-w-xl text-lg text-slate-300">Rondas justas, resultados ágiles y clasificación clara para Commander y cualquier TCG multijugador.</p><div className="mt-8 flex flex-wrap justify-center gap-3"><Link className={primary} to="/register">Crear cuenta</Link><Link className="rounded-lg border border-slate-500 px-4 py-2 font-semibold hover:bg-slate-800" to="/login">Iniciar sesión</Link></div></section><section className="mt-6 grid gap-4 md:grid-cols-3">{[['♟','Mesas equilibradas','Distribución válida de 3 y 4 jugadores.'],['✦','Resultados claros','Puntos, kills y desempates trazables.'],['⌁','Consulta pública','Comparte el estado sin exponer controles.']].map(([icon,title,text]) => <article key={title} className={panel}><span className="text-2xl text-amber-300">{icon}</span><h2 className="mt-3 font-bold">{title}</h2><p className="mt-1 text-sm text-slate-300">{text}</p></article>)}</section></Layout> }
function Auth({ screen }: { screen: 'login'|'register'|'recovery' }) {
  const { configured, user, signIn, signUp, resetPassword } = useAuth()
  const navigate = useNavigate()
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [legalAccepted, setLegalAccepted] = useState(false)
  const [legalError, setLegalError] = useState('')
  const recovery = screen === 'recovery'
  const register = screen === 'register'
  const title = i18n.t(`app.auth.${screen}`)

  useEffect(() => { if (register && user) navigate('/dashboard', { replace: true }) }, [register, user, navigate])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const email = String(data.get('email')).trim()
    const password = String(data.get('password'))
    if (register && !legalAccepted) {
      setLegalError('You must accept the Terms & Conditions and Privacy Policy to create an account.')
      return
    }
    setBusy(true)
    setMessage('')
    try {
      if (recovery) {
        await resetPassword(email)
        setMessage(i18n.t('app.auth.recoverySent'))
      } else if (register) {
        const name = String(data.get('name')).trim()
        if (password !== String(data.get('confirmPassword'))) throw new Error(i18n.t('app.auth.passwordsMismatch'))
        await signUp(name, email, password, currentLegalConsent)
        navigate('/dashboard', { replace: true })
      } else {
        await signIn(email, password)
        navigate('/dashboard')
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : i18n.t('app.auth.operationFailed'))
    } finally {
      setBusy(false)
    }
  }

  const passwordField = (name: string, label: string) => <label className="block text-sm font-medium">{label}<span className="relative mt-1 block"><input required name={name} minLength={6} type={showPassword ? 'text' : 'password'} className={`${field} mt-0 pr-12`} /><button type="button" aria-label={showPassword ? i18n.t('app.auth.hidePassword') : i18n.t('app.auth.showPassword')} title={showPassword ? i18n.t('app.auth.hidePassword') : i18n.t('app.auth.showPassword')} className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-slate-400 hover:text-amber-300" onClick={() => setShowPassword(value => !value)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span></label>
  const consent = <fieldset className="rounded-2xl border border-border bg-secondary/40 p-3"><legend className="sr-only">Legal agreement</legend><label className="flex cursor-pointer items-start gap-3 text-sm leading-5 text-foreground"><input required name="legalConsent" checked={legalAccepted} onChange={event => { setLegalAccepted(event.target.checked); if (event.target.checked) setLegalError('') }} type="checkbox" className="mt-1 size-4 accent-[#21B876]" /><span>I have read and agree to the <Link to="/terms" target="_blank" rel="noreferrer" className="font-semibold text-accent underline">Terms &amp; Conditions</Link> and <Link to="/privacy" target="_blank" rel="noreferrer" className="font-semibold text-accent underline">Privacy Policy</Link>.</span></label>{legalError && <p role="alert" className="mt-2 text-sm text-red-300">{legalError}</p>}</fieldset>

  return <Layout><div className="mx-auto max-w-md"><div className={panel}><h1 className="text-2xl font-black">{title}</h1><p className="mt-2 text-sm text-slate-300">{configured ? '' : i18n.t('app.auth.localMode')}</p>{message && <div className="mt-4"><Notice error={!message.includes(i18n.t('app.auth.recoverySent'))}>{message}</Notice></div>}<form className="mt-5 space-y-4" onSubmit={submit}>{register && <label className="block text-sm font-medium">{i18n.t('app.common.name')}<input required name="name" autoComplete="name" className={field} placeholder={i18n.t('app.auth.yourName')} /></label>}<label className="block text-sm font-medium">{i18n.t('app.common.email')}<input required name="email" type="email" autoComplete="email" className={field} placeholder="correo@gmail.com" /></label>{!recovery && <>{passwordField('password', i18n.t('app.common.password'))}{register && passwordField('confirmPassword', i18n.t('app.auth.confirmPassword'))}</>}{register && consent}<button disabled={busy} className={`${primary} w-full`}>{busy ? i18n.t('app.auth.processing') : recovery ? i18n.t('app.auth.sendInstructions') : i18n.t('app.auth.continue')}</button></form>{!recovery && <GoogleAuthButton requiresConsent={register} consentAccepted={legalAccepted} onConsentRequired={() => setLegalError('You must accept the Terms & Conditions and Privacy Policy to create an account.')} />}<Link className="mt-5 block text-center text-sm text-amber-300 underline" to={screen === 'login' ? '/register' : '/login'}>{screen === 'login' ? i18n.t('app.auth.noAccount') : i18n.t('app.auth.backToLogin')}</Link>{!recovery && <Link className="mx-auto mt-3 inline-flex w-full justify-center rounded-lg border border-slate-500 px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800" to="/forgot-password">{i18n.t('app.auth.forgotPassword')}</Link>}</div></div></Layout>
}
function ConfirmedAccount() { const { user, loading } = useAuth(); return <Layout><div className="mx-auto max-w-md text-center"><section className={panel}><span className="text-4xl">✓</span><h1 className="mt-3 text-2xl font-black">{loading ? 'Confirmando tu cuenta…' : user ? '¡Cuenta confirmada!' : 'Revisa la confirmación'}</h1><p className="mt-3 text-slate-300">{user ? 'Ya puedes cerrar esta pestaña y volver a la ventana original. Entrarás al panel automáticamente.' : 'Estamos validando el enlace. Espera un momento o vuelve a abrir el enlace del correo.'}</p>{user&&<button type="button" className={`${primary} mt-5`} onClick={() => window.close()}>Cerrar pestaña</button>}</section></div></Layout> }
function OrganizerIdentity({ user }: { user: User | null }) {
  const { name, avatarUrl } = getUserProfile(user)
  const [avatarFailed, setAvatarFailed] = useState(false)
  const avatarSource = avatarFailed || !avatarUrl ? '/default-avatar.svg' : avatarUrl

  return <p className="flex items-center gap-2 text-sm text-amber-300">
    <span className="inline-flex h-7 w-7 shrink-0 overflow-hidden rounded-full border border-amber-300/40 bg-slate-800 text-xs font-bold text-amber-200">
      <img src={avatarSource} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" onError={() => setAvatarFailed(true)} />
    </span>
    <span>{i18n.t('app.header.organizerPanel', { name })}</span>
  </p>
}

function Dashboard() {
  const { tournaments, ready, remoteError, removeTournament } = useTournaments()
  const { configured, user, loading } = useAuth()
  const [tournamentToDelete, setTournamentToDelete] = useState<Tournament>()
  const [creating, setCreating] = useState(false)
  const navigate = useNavigate()
  const ownTournaments = tournaments.filter(tournament => tournament.ownerId === user?.id)
  if (configured && !loading && !user) return <Navigate to="/login" replace />

  return <Layout><div className="dashboard-board">
    <header className="dashboard-board__header"><div><OrganizerIdentity user={user}/><h1>{i18n.t('app.dashboard.title')}</h1></div><button className={primary} onClick={() => setCreating(true)}><Plus size={16} aria-hidden />{i18n.t('app.dashboard.newTournament')}</button></header>
    {!ready && <div className="app-loading-note"><i /><span>{i18n.t('app.dashboard.loading')}</span></div>}
    {remoteError && <div className="mb-4"><Notice error>{remoteError}</Notice></div>}
    {(['activo', 'finalizado'] as const).map(status => {
      const sectionTournaments = ownTournaments.filter(tournament => tournament.status === status)
      const SectionIcon = status === 'activo' ? Play : Archive
      return <section key={status} className="dashboard-shelf"><header><span><SectionIcon size={14} aria-hidden /></span><h2>{status === 'activo' ? i18n.t('app.dashboard.active') : i18n.t('app.dashboard.finished')}</h2></header><div className="dashboard-shelf__grid">
        {sectionTournaments.map(tournament => <article key={tournament.id} role="link" tabIndex={0} className="tournament-ticket" onClick={event => { if (!(event.target as HTMLElement).closest('button')) navigate(`/tournaments/${tournament.id}`) }} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); navigate(`/tournaments/${tournament.id}`) } }}>
          <div className="tournament-ticket__top"><span>{tournament.format}</span><Badge>{tournament.status}</Badge></div><strong>{tournament.name}</strong><p>{i18n.t('app.dashboard.playersAndRounds', { players: tournament.players.filter(player => player.active).length, rounds: `${tournament.rounds.length}/${tournament.plannedRounds}` })}</p><div className="tournament-ticket__bottom"><div className="round-pips" aria-label={i18n.t('app.dashboard.playersAndRounds', { players: tournament.players.filter(player => player.active).length, rounds: `${tournament.rounds.length}/${tournament.plannedRounds}` })}>{Array.from({ length: tournament.plannedRounds }, (_, round) => <i className={round < tournament.rounds.length ? 'is-done' : ''} key={round} />)}</div><button className="app-action-delete" onClick={event => { event.stopPropagation(); setTournamentToDelete(tournament) }}>{i18n.t('app.common.delete')}</button></div>
        </article>)}
        {ready && sectionTournaments.length === 0 && <div className="app-empty-state"><span><Inbox aria-hidden /></span><p>{i18n.t('app.dashboard.noTournaments')}</p></div>}
      </div></section>
    })}
    {creating && <TournamentCreateModal onClose={() => setCreating(false)} />}
    {tournamentToDelete && <ConfirmModal title={i18n.t('app.dashboard.deleteTitle')} description={i18n.t('app.dashboard.deleteDescription', { name: tournamentToDelete.name })} confirmLabel={i18n.t('app.dashboard.deleteTitle')} destructive onClose={() => setTournamentToDelete(undefined)} onConfirm={() => { removeTournament(tournamentToDelete.id); setTournamentToDelete(undefined) }} />}
  </div></Layout>
}

function TournamentCreateModal({ onClose }: { onClose:()=>void }) {
  const { createTournament } = useTournaments();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const plannedRounds = Number(form.get('rounds'));
    const maxPlayers = Number(form.get('maxPlayers'));
    const maxTables = Number(form.get('maxTables'));
    if (!Number.isInteger(plannedRounds) || plannedRounds < 1 || !Number.isInteger(maxPlayers) || maxPlayers < 3 || !Number.isInteger(maxTables) || maxTables < 1) {
      setError(i18n.t('app.createTournament.invalidLimits'));
      return;
    }
    const tournament = createTournament({ name: String(form.get('name')), format: String(form.get('format')), plannedRounds, maxPlayers, maxTables, isPublic: true });
    onClose();
    navigate(`/tournaments/${tournament.id}`);
  }

  return <Modal title={i18n.t('app.createTournament.title')} description={i18n.t('app.createTournament.description')} onClose={onClose}><form className="space-y-4" onSubmit={submit}>{error&&<Notice error>{error}</Notice>}<div className="grid gap-3 sm:grid-cols-2"><label className="text-sm sm:col-span-2">{i18n.t('app.common.name')}<input autoFocus required name="name" className={field} placeholder={i18n.t('app.createTournament.namePlaceholder')} /></label><label className="text-sm">{i18n.t('app.createTournament.format')}<input name="format" defaultValue="Commander" className={field} /></label><label className="text-sm">{i18n.t('app.tournament.rounds')}<input required name="rounds" defaultValue="3" min="1" type="number" className={field} /></label><label className="text-sm">{i18n.t('app.createTournament.maxPlayers')}<input required name="maxPlayers" defaultValue="32" min="3" type="number" className={field} /></label><label className="text-sm">{i18n.t('app.createTournament.maxTables')}<input required name="maxTables" defaultValue="8" min="1" type="number" className={field} /></label></div><div className="flex justify-end gap-3"><button type="button" className="rounded-lg border border-slate-500 px-4 py-2 text-sm font-semibold hover:bg-slate-800" onClick={onClose}>{i18n.t('app.common.cancel')}</button><button className={primary}>{i18n.t('app.createTournament.create')}</button></div></form></Modal>
}
function NewTournament() { const { createTournament } = useTournaments(); const navigate = useNavigate(); const [error, setError] = useState(''); function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const values = new FormData(event.currentTarget); const rounds = Number(values.get('rounds')); const maxPlayers = Number(values.get('maxPlayers')); const maxTables = Number(values.get('maxTables')); if (!Number.isInteger(rounds) || rounds < 1 || !Number.isInteger(maxPlayers) || maxPlayers < 3 || !Number.isInteger(maxTables) || maxTables < 1) return setError(i18n.t('app.createTournament.invalidLimits')); const tournament = createTournament({ name: String(values.get('name')), format: String(values.get('format')), plannedRounds: rounds, maxPlayers, maxTables, isPublic: true }); navigate(`/tournaments/${tournament.id}`) } return <Layout><div className="mx-auto max-w-2xl"><h1 className="mb-5 text-3xl font-black">{i18n.t('app.createTournament.title')}</h1><form onSubmit={submit} className={`${panel} space-y-4`}>{error && <Notice error>{error}</Notice>}<div className="grid gap-4 sm:grid-cols-2"><label className="text-sm">{i18n.t('app.common.name')}<input required name="name" className={field} placeholder={i18n.t('app.createTournament.namePlaceholder')} /></label><label className="text-sm">{i18n.t('app.createTournament.gameOrFormat')}<input name="format" defaultValue="Commander" className={field} /></label><label className="text-sm">{i18n.t('app.createTournament.plannedRounds')}<input required name="rounds" defaultValue="3" min="1" type="number" className={field} /></label><label className="text-sm">{i18n.t('app.createTournament.maxPlayers')}<input required name="maxPlayers" defaultValue="32" min="3" type="number" className={field} /></label><label className="text-sm">{i18n.t('app.createTournament.maxTables')}<input required name="maxTables" defaultValue="8" min="1" type="number" className={field} /></label></div><button className={primary}>{i18n.t('app.createTournament.create')}</button></form></div></Layout> }

function TournamentLayout() {
  const { id } = useParams()
  const tournament = useTournament(id)
  if (!tournament) return <Layout><Notice error>{i18n.t('app.tournament.notFound')}</Notice></Layout>
  const base = `/tournaments/${tournament.id}`
  const tabs: [string, LucideIcon, string][] = [['', LayoutDashboard, i18n.t('app.tournament.overview')], ['players', Users, i18n.t('app.tournament.players')], ['rounds', GitBranch, i18n.t('app.tournament.rounds')], ['standings', Trophy, i18n.t('app.tournament.standings')], ['statistics', BarChart3, i18n.t('app.statistics.title')], ['settings', SettingsIcon, i18n.t('app.tournament.settings')]]
  return <Layout><header className="tournament-masthead"><div><p>{tournament.format}</p><h1>{tournament.name}</h1></div><Badge>{tournament.status}</Badge></header><nav className="tournament-tabs" aria-label={i18n.t('landing.navigation.label')}>{tabs.map(([suffix, Icon, label]) => <NavLink end={!suffix} className={({ isActive }) => `tournament-tabs__tab ${isActive ? 'is-active' : ''}`} key={label} to={`${base}${suffix ? `/${suffix}` : ''}`}><Icon size={16} aria-hidden />{label}</NavLink>)}</nav><Routes><Route index element={<Overview />} /><Route path="players" element={<Players />} /><Route path="rounds" element={<Rounds />} /><Route path="standings" element={<Standings />} /><Route path="statistics" element={<Statistics />} /><Route path="settings" element={<Settings />} /></Routes></Layout>
}
function Current() { const { id } = useParams(); const tournament = useTournament(id); if (!tournament) throw new Error('Torneo no encontrado'); return tournament }
function Overview() { const tournament = Current(); const current = tournament.rounds.at(-1); return <section className="overview-board"><header><p>{i18n.t('app.tournament.state')}</p><h2>{i18n.t('app.tournament.overview')}</h2></header><div className="overview-board__metrics"><Metric label={i18n.t('app.tournament.activePlayers')} value={tournament.players.filter(player => player.active).length} icon={Users} /><Metric label={i18n.t('app.tournament.rounds')} value={`${tournament.rounds.length}/${tournament.plannedRounds}`} icon={GitBranch} /><Metric label={i18n.t('app.tournament.currentTable')} value={current ? `R${current.number}` : '—'} icon={Table} /></div><TournamentInformation /></section> }
function Statistics() { return <BattleLedger statistics={tournamentStatistics(Current())} /> }
function TournamentInformation() { const tournament = Current(); const { id } = useParams(); const { updateTournament } = useTournaments(); const [information,setInformation] = useState(tournament.information); const [saved,setSaved] = useState(false); function save(event:FormEvent<HTMLFormElement>){event.preventDefault();updateTournament(id!,{information:information.trim()});setSaved(true);showToast(i18n.t('app.tournament.informationSaved'))} return <section className="notice-board"><header><span><Info size={16} aria-hidden /></span><div><h2>{i18n.t('app.tournament.information')}</h2><p>{i18n.t('app.tournament.informationHelp')}</p></div></header><form onSubmit={save}><textarea value={information} onChange={event=>{setInformation(event.target.value);setSaved(false)}} disabled={tournament.status==='finalizado'} maxLength={2000} rows={7} className={`${field} resize-y`} placeholder={i18n.t('app.tournament.informationPlaceholder')} /><div className="notice-board__actions"><span>{information.length}/2000</span><button disabled={tournament.status==='finalizado'} className={primary}>{i18n.t('app.tournament.saveInformation')}</button></div>{saved&&<p className="notice-board__saved">{i18n.t('app.tournament.informationSaved')}</p>}</form></section> }
function Metric({ label, value, icon: Icon }: { label: string; value: string | number; icon: LucideIcon }) { return <article className="app-stat-pill"><span><Icon size={16} aria-hidden /></span><strong>{value}</strong><small>{label}</small></article> }
function Players() {
  const tournament = Current()
  const { id } = useParams()
  const { addPlayers, togglePlayer, removePlayer, renamePlayer } = useTournaments()
  const [message, setMessage] = useState('')
  const [adding, setAdding] = useState(false)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Tournament['players'][number]>()
  const [playerToToggle, setPlayerToToggle] = useState<Tournament['players'][number]>()
  const [playerToDelete, setPlayerToDelete] = useState<Tournament['players'][number]>()
  function add(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const result = addPlayers(id!, String(new FormData(event.currentTarget).get('names')).split('\n')); setMessage(result.error ?? (result.added ? i18n.t('app.tournament.playersAdded', { count: result.added }) : i18n.t('app.tournament.noPlayers'))); setAdding(false) }
  function edit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!editing) return; const result = renamePlayer(id!, editing.id, String(new FormData(event.currentTarget).get('name'))); setMessage(result ?? i18n.t('app.tournament.playerUpdated')); if (!result) setEditing(undefined) }
  const normalizedSearch = search.trim().toLocaleLowerCase()
  const filteredPlayers = tournament.players.filter(player => player.name.toLocaleLowerCase().includes(normalizedSearch))
  return <section className="players-ledger"><header><div><p>{i18n.t('app.tournament.activeCount', { count: tournament.players.filter(player => player.active).length })}</p><h2>{i18n.t('app.tournament.players')}</h2></div><button disabled={tournament.status === 'finalizado'} className={primary} onClick={() => setAdding(true)}><Plus size={16} aria-hidden />{i18n.t('app.tournament.addPlayers')}</button></header><div className="players-ledger__sheet">{message && <Notice>{message}</Notice>}<label className="players-ledger__search"><span className="sr-only">{i18n.t('app.tournament.searchPlayers')}</span><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder={i18n.t('app.tournament.searchPlayers')} className={field} /></label><div className="players-ledger__list">{filteredPlayers.map(player => <article key={player.id} className={`player-slip ${player.active ? '' : 'is-withdrawn'}`}><span className="player-slip__avatar" aria-hidden>{player.name.trim().slice(0, 1).toUpperCase()}</span><div><strong>{player.name}</strong><span className={`player-slip__status ${player.active ? 'is-active' : ''}`}>{player.active ? i18n.t('app.common.active') : i18n.t('app.common.withdrawn')}</span></div><div className="player-slip__actions"><button type="button" className="app-action-edit" onClick={() => setEditing(player)}>{i18n.t('app.common.edit')}</button><button type="button" className="app-action-muted" onClick={() => setPlayerToToggle(player)}>{player.active ? i18n.t('app.tournament.retire') : i18n.t('app.tournament.activate')}</button><button type="button" className="app-action-delete" onClick={() => setPlayerToDelete(player)}>{i18n.t('app.common.delete')}</button></div></article>)}{!filteredPlayers.length && <div className="app-empty-state"><span><Users aria-hidden /></span><p>{search ? i18n.t('app.tournament.noPlayersFound') : i18n.t('app.tournament.noPlayers')}</p></div>}</div></div>
    {adding && <Modal title={i18n.t('app.tournament.addPlayersTitle')} description={i18n.t('app.tournament.addPlayersDescription')} onClose={() => setAdding(false)}><form className="space-y-4" onSubmit={add}><textarea required name="names" className={field} rows={7} placeholder={i18n.t('app.tournament.playerNames')} /><div className="flex justify-end gap-3"><button type="button" className="app-button app-button--secondary" onClick={() => setAdding(false)}>{i18n.t('app.common.cancel')}</button><button className={primary}>{i18n.t('app.tournament.addPlayers')}</button></div></form></Modal>}
    {editing && <Modal title={i18n.t('app.tournament.editPlayer')} description={i18n.t('app.tournament.updatePlayer')} onClose={() => setEditing(undefined)}><form className="space-y-4" onSubmit={edit}><label className="block text-sm">{i18n.t('app.common.name')}<input autoFocus required name="name" defaultValue={editing.name} className={field} /></label><div className="flex justify-end gap-3"><button type="button" className="app-button app-button--secondary" onClick={() => setEditing(undefined)}>{i18n.t('app.common.cancel')}</button><button className={primary}>{i18n.t('app.common.save')}</button></div></form></Modal>}
    {playerToToggle && <ConfirmModal title={playerToToggle.active ? i18n.t('app.tournament.retire') : i18n.t('app.tournament.activate')} description={playerToToggle.active ? i18n.t('app.tournament.retirePlayerDescription', { name: playerToToggle.name }) : i18n.t('app.tournament.activatePlayerDescription', { name: playerToToggle.name })} confirmLabel={playerToToggle.active ? i18n.t('app.tournament.retire') : i18n.t('app.tournament.activate')} onClose={() => setPlayerToToggle(undefined)} onConfirm={() => { togglePlayer(id!, playerToToggle.id); setPlayerToToggle(undefined) }} />}
    {playerToDelete && <ConfirmModal title={i18n.t('app.tournament.deletePlayer')} description={i18n.t('app.tournament.deletePlayerDescription', { name: playerToDelete.name })} confirmLabel={i18n.t('app.common.delete')} destructive onClose={() => setPlayerToDelete(undefined)} onConfirm={() => { const error = removePlayer(id!, playerToDelete.id); if (error) setMessage(error); setPlayerToDelete(undefined) }} />}
  </section>
}

function Rounds() {
  const tournament = Current()
  const { id } = useParams()
  const { generateRound, deleteLastRound, startRound, completeRound, movePlayer } = useTournaments()
  const [message,setMessage] = useState('')
  const [deletingLast,setDeletingLast] = useState(false)
  const [roundToComplete,setRoundToComplete] = useState<Tournament['rounds'][number]>()
  const [selectedRoundId,setSelectedRoundId] = useState<string>()
  const [draggedPlayer,setDraggedPlayer] = useState<string>()
  const [dropTargetPod,setDropTargetPod] = useState<string>()
  const last = tournament.rounds.at(-1)
  const hasOpenRound = tournament.rounds.some(round=>round.status!=='completada')
  const names = Object.fromEntries(tournament.players.map(player => [player.id,player.name]))
  const selectedRound = tournament.rounds.find(round=>round.id===selectedRoundId) ?? last
  const selectedIndex = selectedRound ? tournament.rounds.findIndex(round=>round.id===selectedRound.id) : -1

  useEffect(()=>{ setSelectedRoundId(tournament.rounds.at(-1)?.id) },[tournament.rounds.length])

  return <section className="rounds-deck">
    <div className="rounds-deck__header">
      <h2 className="text-xl font-bold">{i18n.t('app.tournament.roundsAndTables')}</h2>
      <div className="flex flex-wrap justify-end gap-2">
        <button disabled={selectedIndex<=0} className="app-button app-button--secondary" onClick={()=>setSelectedRoundId(tournament.rounds[selectedIndex-1].id)}>{i18n.t('app.common.previous')}</button>
        <button disabled={selectedIndex>=tournament.rounds.length-1} className="app-button app-button--secondary" onClick={()=>setSelectedRoundId(tournament.rounds[selectedIndex+1].id)}>{i18n.t('app.common.next')}</button>
        <button disabled={tournament.status === 'finalizado' || hasOpenRound || tournament.rounds.length>=tournament.plannedRounds} className={`${primary} inline-flex items-center gap-2`} onClick={() => setMessage(generateRound(id!) ?? i18n.t('app.tournament.roundGenerated'))}><RefreshCw size={16} />{i18n.t('app.tournament.generateRound')}</button>
        <button disabled={!last} className="app-button app-button--danger" onClick={() => setDeletingLast(true)}><Trash2 size={16} />{i18n.t('app.tournament.deleteLast')}</button>
      </div>
    </div>
    {message && <Notice error={message.includes('requieren') || message.includes('Completa') || message.includes('finalizado') || message.includes('Primero') || message.includes('Espera')}>{message}</Notice>}
    {selectedRound ? <article className="round-sheet">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3"><h3 className="font-bold">{i18n.t('app.common.round',{number:selectedRound.number})} <span className="ml-2"><Badge>{selectedRound.status}</Badge></span></h3><RoundTimer round={selectedRound} /></div>
        <div className="flex flex-wrap gap-2">
          <Link className="app-button app-button--secondary" to={`/t/${tournament.publicSlug}?round=${selectedRound.id}`} target="_blank" rel="noreferrer"><Eye size={16} />{i18n.t('app.tournament.publicView')}<ExternalLink size={14} /></Link>
          <button disabled={selectedRound.status !== 'borrador' || tournament.status === 'finalizado'} className={`${primary} inline-flex items-center gap-2`} onClick={() => setMessage(startRound(id!,selectedRound.id) ?? i18n.t('app.tournament.roundStarted'))}><Play size={16} fill="currentColor" />{i18n.t('app.tournament.startRound')}</button>
          <button disabled={selectedRound.status !== 'activa' || tournament.status === 'finalizado'} className="app-button app-button--danger" onClick={() => setRoundToComplete(selectedRound)}><Square size={15} fill="currentColor" />{i18n.t('app.tournament.endRound')}</button>
        </div>
      </div>
      {selectedRound.status==='borrador' && <p className="mt-3 text-sm text-slate-300">{i18n.t('app.tournament.dragHelp')}</p>}
      <div className="rounds-deck__tables">{selectedRound.pods.map(pod => selectedRound.status === 'borrador' ? <DraftPodCard key={pod.id} pod={pod} names={names} draggedPlayer={draggedPlayer} isDropTarget={dropTargetPod===pod.id} onDragStart={playerId=>{setDraggedPlayer(playerId);setDropTargetPod(undefined)}} onDragEnter={()=>{if(draggedPlayer&&!pod.playerIds.includes(draggedPlayer))setDropTargetPod(pod.id)}} onDragEnd={()=>{setDraggedPlayer(undefined);setDropTargetPod(undefined)}} onDrop={playerId => { const error=movePlayer(id!,selectedRound.id,playerId,pod.id); if(error)setMessage(error); setDraggedPlayer(undefined); setDropTargetPod(undefined) }} /> : <PodCard key={pod.id} tournamentId={id!} roundId={selectedRound.id} pod={pod} readOnly={tournament.status === 'finalizado' || selectedRound.status !== 'activa'} names={names} editable={selectedRound.status === 'activa'} />)}</div>
    </article> : <div className="app-empty-state">{i18n.t('app.tournament.noRounds')}</div>}
    {deletingLast && last && <ConfirmModal title={i18n.t('app.tournament.deleteLastTitle')} description={last.pods.some(p=>p.results?.length) ? i18n.t('app.tournament.deleteLastWithResults') : i18n.t('app.tournament.deleteLastDescription')} confirmLabel={i18n.t('app.tournament.deleteRound')} destructive onClose={() => setDeletingLast(false)} onConfirm={() => { setMessage(deleteLastRound(id!) ?? i18n.t('app.tournament.lastRoundDeleted')); setDeletingLast(false) }} />}
    {roundToComplete && <ConfirmModal title={i18n.t('app.tournament.completeTitle',{number:roundToComplete.number})} description={i18n.t('app.tournament.completeDescription')} confirmLabel={i18n.t('app.tournament.endRound')} destructive onClose={() => setRoundToComplete(undefined)} onConfirm={() => { setMessage(completeRound(id!,roundToComplete.id) ?? i18n.t('app.tournament.roundCompleted')); setRoundToComplete(undefined) }} />}
  </section>
}
function DraftPodCard({ pod, names, draggedPlayer, isDropTarget, onDragStart, onDragEnter, onDragEnd, onDrop }: { pod: Pod; names: Record<string,string>; draggedPlayer?:string; isDropTarget:boolean; onDragStart:(playerId:string)=>void; onDragEnter:()=>void; onDragEnd:()=>void; onDrop:(playerId:string)=>void }) { return <div className={`game-table game-table--draft ${isDropTarget ? 'is-drop-target' : ''}`} onDragEnter={onDragEnter} onDragOver={event=>{event.preventDefault();event.dataTransfer.dropEffect='move'}} onDrop={event=>{event.preventDefault();const playerId=event.dataTransfer.getData('text/plain')||draggedPlayer;if(playerId)onDrop(playerId)}}><div className="flex items-center justify-between gap-2"><h4>{i18n.t('app.common.table',{number:pod.number})} <span>({pod.playerIds.length}/5)</span></h4>{isDropTarget&&<span className="game-table__drop">{i18n.t('app.tournament.dropHere')}</span>}</div><div className="game-table__draft-players">{pod.playerIds.map(playerId=><button type="button" draggable onDragStart={event=>{event.dataTransfer.setData('text/plain',playerId);event.dataTransfer.effectAllowed='move';onDragStart(playerId)}} onDragEnd={onDragEnd} className={draggedPlayer===playerId ? 'is-dragging' : ''} key={playerId}>{names[playerId]}</button>)}</div></div> }
function outcomeLabel(outcome?: ResultOutcome) { return outcome ? i18n.t(`app.common.${outcome}`) : '—' }
function OutcomeButtons({ playerId, outcome }: { playerId: string; outcome?: ResultOutcome }) { const [selected, setSelected] = useState<ResultOutcome | undefined>(outcome); const options: { value: ResultOutcome; Icon: LucideIcon; label: string }[] = [{ value: 'win', Icon: Trophy, label: i18n.t('app.common.win') }, { value: 'loss', Icon: CircleX, label: i18n.t('app.common.loss') }, { value: 'draw', Icon: Equal, label: i18n.t('app.common.draw') }]; return <fieldset className="outcome-chips"><legend className="sr-only">{i18n.t('app.common.outcome')}</legend><input type="hidden" name={`outcome-${playerId}`} value={selected ?? ''}/>{options.map(option=><label key={option.value} className={`outcome-chips__option outcome-chips__option--${option.value} ${selected === option.value ? 'is-selected' : ''}`}><input className="sr-only" type="checkbox" checked={selected === option.value} onChange={() => setSelected(current => current === option.value ? undefined : option.value)}/><option.Icon aria-hidden size={14} strokeWidth={2.25}/>{option.label}</label>)}</fieldset> }
function PodCard({ tournamentId, roundId, pod, names, readOnly, editable }: { tournamentId: string; roundId: string; pod: Pod; names: Record<string,string>; readOnly:boolean; editable:boolean }) {
  const { savePod } = useTournaments();
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const next: Pod = {
      ...pod,
      results: pod.playerIds.map((playerId) => {
        const outcome = form.get(`outcome-${playerId}`);
        return {
          playerId,
          points: Number(form.get(`points-${playerId}`)),
          kills: Number(form.get(`kills-${playerId}`)),
          outcome: outcome === 'win' || outcome === 'loss' || outcome === 'draw' ? outcome : undefined,
        };
      }),
    };
    const message = savePod(tournamentId, roundId, pod.id, next) ?? i18n.t('app.tournament.results');
    const validationMessages = [i18n.t('app.messages.completeResults'), i18n.t('app.messages.outcomeRequired')];
    showToast(message, validationMessages.includes(message));
  }
  return <div className="game-table">
    <h4>{i18n.t('app.common.table',{number:pod.number})}</h4>
    {!editable && <div className="mt-3 grid gap-2">{pod.playerIds.map((playerId) => {
      const result = pod.results?.find((item) => item.playerId === playerId);
      return <section className="overflow-hidden rounded-lg border border-slate-700 bg-slate-900" key={playerId}><h5 className="px-3 py-2 text-sm font-semibold">{names[playerId]}</h5>{result ? <div className="grid grid-cols-3 border-t border-slate-700 text-xs"><p className="border-r border-slate-700 px-3 py-2 text-slate-300">{i18n.t('app.common.points')} <strong className="ml-1 text-slate-100">{result.points}</strong></p><p className="border-r border-slate-700 px-3 py-2 text-slate-300">{i18n.t('app.common.kills')} <strong className="ml-1 text-slate-100">{result.kills}</strong></p><p className="px-3 py-2 text-slate-300">{i18n.t('app.common.outcome')} <strong className="ml-1 text-slate-100">{outcomeLabel(result.outcome)}</strong></p></div> : <p className="border-t border-slate-700 px-3 py-2 text-xs text-slate-400">{i18n.t('app.common.noResults')}</p>}</section>;
    })}</div>}
    {editable && <form onSubmit={save} className="mt-3 space-y-4">
      <p className="rounded-md bg-slate-900 px-3 py-2 text-xs text-slate-300">{i18n.t('app.tournament.registerResults')}</p>
      <div className="grid gap-3">{pod.playerIds.map((playerId) => <section className="overflow-hidden rounded-lg border border-slate-700 bg-slate-900" key={playerId}><div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"><h5 className="text-sm font-semibold">{names[playerId]}</h5><OutcomeButtons playerId={playerId} outcome={pod.results?.find((result) => result.playerId === playerId)?.outcome}/></div><div className="grid grid-cols-2 border-t border-slate-700"><label className="border-r border-slate-700 p-3 text-xs font-semibold text-slate-300">{i18n.t('app.common.points')}<input required min="0" name={`points-${playerId}`} defaultValue={pod.results?.find((result) => result.playerId === playerId)?.points ?? ''} type="number" className="mt-2 w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400" /></label><label className="p-3 text-xs font-semibold text-slate-300">{i18n.t('app.common.kills')}<input required min="0" name={`kills-${playerId}`} defaultValue={pod.results?.find((result) => result.playerId === playerId)?.kills ?? 0} type="number" className="mt-2 w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400" /></label></div></section>)}</div>
      <button disabled={readOnly} className={primary}>{i18n.t('app.common.save')}</button>
    </form>}
  </div>
}
function Standings() {
  const { id } = useParams()
  const rows = useTournaments().standingsFor(id!)
  const opponentHelp = i18n.t('app.tournament.opponentHelp')
  const winRateHelp = i18n.t('app.common.winRateHelp')
  return <section className="standings-board"><header><p>{i18n.t('app.tournament.standings')}</p><h2>{i18n.t('app.tournament.standings')}</h2></header>
    {rows.length > 0 && <ol className="standings-podium">{rows.slice(0, 3).map(row => <li className={`standings-podium__place standings-podium__place--${row.rank}`} key={row.player.id}><span>#{row.rank}</span><i aria-hidden>{row.player.name.trim().slice(0, 1).toUpperCase()}</i><strong>{row.player.name}</strong><b>{row.points} <small>{i18n.t('app.common.points')}</small></b><em>{row.kills} ☠ · {row.winRate.toFixed(1)}%</em></li>)}</ol>}
    <div className="standings-table"><table><thead><tr><th>#</th><th>{i18n.t('app.common.name')}</th><th>{i18n.t('app.common.points')}</th><th>{i18n.t('app.common.wins')}</th><th>{i18n.t('app.common.losses')}</th><th>{i18n.t('app.common.draws')}</th><th><span>{i18n.t('app.common.winRate')}<span title={winRateHelp} aria-label={winRateHelp} className="app-help"><Info size={15} strokeWidth={2}/></span></span></th><th>{i18n.t('app.common.kills')}</th><th><span>{i18n.t('app.tournament.opponentStrength')}<span title={opponentHelp} aria-label={opponentHelp} className="app-help"><Info size={15} strokeWidth={2}/></span></span></th><th>{i18n.t('app.tournament.rounds')}</th></tr></thead><tbody>{rows.map(row => <tr className={row.rank <= 3 ? `is-podium is-podium--${row.rank}` : ''} key={row.player.id}><td>{row.rank}</td><td><span className="standings-table__avatar" aria-hidden>{row.player.name.trim().slice(0, 1).toUpperCase()}</span>{row.player.name}{!row.player.active && <small>{i18n.t('app.common.withdrawn')}</small>}</td><td><strong>{row.points}</strong></td><td>{row.wins}</td><td>{row.losses}</td><td>{row.draws}</td><td>{row.winRate.toFixed(1)}%</td><td>{row.kills}</td><td>{row.opponentStrength}</td><td>{row.roundsPlayed}</td></tr>)}</tbody></table></div>
  </section>
}

function Settings() {
  const tournament = Current()
  const { id } = useParams()
  const { updateTournament } = useTournaments()
  const [message, setMessage] = useState('')
  const [finishing, setFinishing] = useState(false)
  function save(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); const plannedRounds = Number(form.get('rounds')); const maxPlayers = Number(form.get('maxPlayers')); const maxTables = Number(form.get('maxTables')); if (!Number.isInteger(plannedRounds) || plannedRounds < tournament.rounds.length || plannedRounds < 1) return setMessage(i18n.t('app.createTournament.invalidLimits')); if (!Number.isInteger(maxPlayers) || maxPlayers < tournament.players.length || !Number.isInteger(maxTables) || maxTables < 1) return setMessage(i18n.t('app.createTournament.invalidLimits')); updateTournament(id!, { name: String(form.get('name')).trim(), format: String(form.get('format')).trim(), plannedRounds, maxPlayers, maxTables, isPublic: true }); setMessage(''); showToast(i18n.t('app.tournament.settingsSaved')) }
  const canFinish = !tournament.rounds.some(round => round.status !== 'completada')
  return <section className="settings-desk"><form onSubmit={save} className="settings-desk__form"><header><p>{i18n.t('app.tournament.settings')}</p><h2>{i18n.t('app.tournament.settingsTitle')}</h2></header>{message && <Notice error>{message}</Notice>}<div className="settings-desk__fields"><label>{i18n.t('app.common.name')}<input required name="name" defaultValue={tournament.name} className={field}/></label><label>{i18n.t('app.createTournament.format')}<input required name="format" defaultValue={tournament.format} className={field}/></label><label>{i18n.t('app.tournament.plannedRounds')}<input required type="number" min="1" name="rounds" defaultValue={tournament.plannedRounds} className={field}/></label><label>{i18n.t('app.createTournament.maxPlayers')}<input required type="number" min="3" name="maxPlayers" defaultValue={tournament.maxPlayers} className={field}/></label><label>{i18n.t('app.tournament.maxTablesPerRound')}<input required type="number" min="1" name="maxTables" defaultValue={tournament.maxTables} className={field}/></label></div><p className="settings-desk__hint">{i18n.t('app.tournament.pointsManual')}</p><button disabled={tournament.status === 'finalizado'} className={primary}>{i18n.t('app.tournament.saveChanges')}</button></form><aside className="settings-desk__danger"><span aria-hidden>!</span><h2>{i18n.t('app.common.status')}</h2><p>{i18n.t('app.tournament.finishHelp')}</p>{tournament.status === 'finalizado' ? <button className="app-button app-button--secondary" onClick={() => { updateTournament(id!, { status: 'activo' }); showToast(i18n.t('app.tournament.tournamentReopened')) }}>{i18n.t('app.tournament.reopenTournament')}</button> : <button disabled={!canFinish} className="app-button app-button--danger" onClick={() => setFinishing(true)}>{i18n.t('app.tournament.finishTournament')}</button>}</aside>{finishing && <ConfirmModal title={i18n.t('app.tournament.finishTournament')} description={i18n.t('app.tournament.finishHelp')} confirmLabel={i18n.t('app.tournament.finishTournament')} destructive onClose={() => setFinishing(false)} onConfirm={() => { updateTournament(id!, { status: 'finalizado' }); showToast(i18n.t('app.tournament.tournamentFinished')); setFinishing(false) }} />}</section>
}
function PublicView() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const [tournament, setTournament] = useState<Tournament>()
  const [loading, setLoading] = useState(true)
  useEffect(() => { let active = true; void loadPublicTournament(slug ?? '').then(data => { if (active) setTournament(data) }).finally(() => { if (active) setLoading(false) }); return () => { active = false } }, [slug])
  if (loading) return <main className="public-scoreboard public-scoreboard--status"><div className="app-loading-note"><i /><span>{i18n.t('app.public.loading')}</span></div></main>
  if (!tournament) return <main className="public-scoreboard public-scoreboard--status"><div className="app-empty-state"><span aria-hidden>?</span><p>{i18n.t('app.public.unavailable')}</p></div></main>
  const round = tournament.rounds.find(item => item.id === searchParams.get('round')) ?? tournament.rounds.at(-1)
  const names = Object.fromEntries(tournament.players.map(player => [player.id, player.name]))
  return <main className="public-scoreboard"><div className="public-scoreboard__wrap"><header className="public-scoreboard__masthead"><a href="/" className="public-scoreboard__brand"><img src="/edh-tournaments-icon.svg" alt="" />EDH Tournaments</a><p>{i18n.t('app.public.eyebrow')}</p><h1>{tournament.name}</h1><span>{tournament.format}</span></header>{tournament.information && <section className="public-scoreboard__notice"><span aria-hidden>⌁</span><div><h2>{i18n.t('app.tournament.information')}</h2><p>{tournament.information}</p></div></section>}{round ? <section className="public-round"><header><div><p>{i18n.t('app.common.round', { number: round.number })}</p><Badge>{round.status}</Badge></div><RoundTimer round={round}/></header><div className="public-round__tables">{round.pods.map(pod => <article className="public-table" key={pod.id}><h3>{i18n.t('app.common.table', { number: pod.number })}</h3><div>{pod.playerIds.map(playerId => { const result = pod.results?.find(item => item.playerId === playerId); return <section key={playerId}><span className="public-table__avatar" aria-hidden>{names[playerId]?.slice(0, 1).toUpperCase()}</span><strong>{names[playerId]}</strong>{result ? <><b>{result.points} <small>{i18n.t('app.common.points')}</small></b><em>{result.kills} ☠</em><i className={`public-outcome public-outcome--${result.outcome ?? 'pending'}`}>{outcomeLabel(result.outcome)}</i></> : <i className="public-outcome public-outcome--pending">{i18n.t('app.common.noResults')}</i>}</section> })}</div></article>)}</div></section> : <section className="app-empty-state"><span aria-hidden>♙</span><p>{i18n.t('app.public.firstRound')}</p></section>}</div></main>
}

export { Home }

function AdminRoute() {
  const { configured, user, loading, isAdmin } = useAuth()

  if (!configured) return <Navigate to="/" replace />
  if (loading) return <Layout><p className="text-sm text-slate-300">Verificando permisos de administración…</p></Layout>
  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/dashboard" replace />
  return <AdminDashboard />
}

const displayDate = (value: string) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium' }).format(date)
}
const roleLabel = (role: AppRole) => role === 'super_admin' ? 'Super administrador' : role === 'admin' ? 'Administrador' : 'Organizador'

function AdminDashboard() {
  const { user, isSuperAdmin } = useAuth()
  const [overview, setOverview] = useState<AdminOverview>()
  const [error, setError] = useState<string>()
  const [refreshing, setRefreshing] = useState(false)
  const [changingRole, setChangingRole] = useState<string>()
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([])
  const [editingUser, setEditingUser] = useState<ManagedUser>()
  const [profileSearch, setProfileSearch] = useState('')
  const [tournamentSearch, setTournamentSearch] = useState('')
  const [adminTab, setAdminTab] = useState<'accounts' | 'tournaments' | 'players' | 'details'>('accounts')

  const refresh = async () => {
    setRefreshing(true)
    try {
      setOverview(await loadAdminOverview())
      setError(undefined)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo cargar la información administrativa.')
    } finally {
      setRefreshing(false)
    }
  }

  const changeRole = async (profileId: string, role: AssignableRole) => {
    setChangingRole(profileId)
    try {
      await updateProfileRole(profileId, role)
      await refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo cambiar el rol.')
    } finally {
      setChangingRole(undefined)
    }
  }

  useEffect(() => { void refresh() }, [])
  const refreshManagedUsers = async () => { try { setManagedUsers(await listManagedUsers()); } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudieron cargar los perfiles editables.') } }
  useEffect(() => { if (isSuperAdmin) void refreshManagedUsers() }, [isSuperAdmin])
  const removeProfile = async (target: ManagedUser) => { if (!window.confirm(`Eliminar la cuenta de ${target.displayName}? También se eliminarán sus torneos. Esta acción no se puede deshacer.`)) return; try { await deleteManagedUser(target.id); await Promise.all([refresh(), refreshManagedUsers()]) } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo eliminar la cuenta.') } }

  const profilesById = new Map(overview?.profiles.map(profile => [profile.id, profile]))
  const playerCount = overview?.tournaments.reduce((total, tournament) => total + tournament.playerCount, 0) ?? 0
  const activeTournaments = overview?.tournaments.filter(tournament => tournament.status === 'activo').length ?? 0
  const accountProfiles = overview?.profiles.filter(profile => isSuperAdmin || profile.role !== 'super_admin') ?? []
  const managedUsersById = new Map(managedUsers.map(managed => [managed.id, managed]))
  const visibleProfiles = accountProfiles.filter(profile => `${profile.displayName} ${profile.role} ${managedUsersById.get(profile.id)?.email ?? ''}`.toLocaleLowerCase().includes(profileSearch.toLocaleLowerCase()))
  const visibleTournaments = overview?.tournaments.filter(tournament => `${tournament.name} ${tournament.format} ${profilesById.get(tournament.ownerId)?.displayName ?? ''}`.toLocaleLowerCase().includes(tournamentSearch.toLocaleLowerCase())) ?? []

  return <Layout><div className="mb-6 flex flex-wrap items-start justify-between gap-4"><div><p className="inline-flex items-center gap-2 text-sm font-semibold text-amber-300"><ShieldCheck size={16} />ACCESO RESTRINGIDO</p><h1 className="mt-1 text-3xl font-black">Administración</h1><p className="mt-2 max-w-2xl text-sm text-slate-300">Vista global de la aplicación. Solo un super admin puede cambiar roles.</p></div><button type="button" className="inline-flex items-center gap-2 rounded-lg border border-slate-500 px-4 py-2 text-sm font-semibold hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50" disabled={refreshing} onClick={() => void refresh()}><RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />{refreshing ? 'Actualizando…' : 'Actualizar'}</button></div>{error&&<section className="mb-5 rounded-xl border border-red-700 bg-red-950 p-4 text-sm text-red-300">{error}</section>}<section className="mb-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><AdminMetric icon={<Users size={19} />} label="Cuentas" value={overview ? accountProfiles.length : '—'} /><AdminMetric icon={<ShieldCheck size={19} />} label="Acceso admin" value={overview?.profiles.filter(profile => profile.role === 'admin').length ?? '—'} /><AdminMetric icon={<Trophy size={19} />} label="Torneos activos" value={overview ? activeTournaments : '—'} /><AdminMetric icon={<Database size={19} />} label="Jugadores registrados" value={overview ? playerCount : '—'} /></section>{!overview&&!error&&<p className="text-sm text-slate-300">Cargando información de Supabase…</p>}{overview&&<><nav className="mb-7 flex gap-1 overflow-x-auto rounded-lg border border-slate-700 bg-slate-900 p-1">{([["accounts","Cuentas"],["tournaments","Torneos"],["players","Jugadores activos"],["details","Datos completos"]] as const).map(([tab,label])=><button key={tab} type="button" onClick={()=>setAdminTab(tab)} className={`whitespace-nowrap rounded-md px-3 py-2 text-sm ${adminTab===tab ? "bg-amber-400 font-bold text-slate-950" : "hover:bg-slate-800"}`}>{label}</button>)}</nav><div className={adminTab === 'accounts' ? '' : 'hidden'}><section className={`${panel} overflow-hidden p-0`}><div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 px-5 py-4"><div><h2 className="text-xl font-black">Cuentas</h2></div><div className="flex items-center gap-2"><input value={profileSearch} onChange={event=>setProfileSearch(event.target.value)} className="w-52 rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400" placeholder="Buscar cuenta" /><span className="text-sm text-slate-400">{accountProfiles.length} en total</span></div></div><div className="max-h-96 overflow-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-slate-700 bg-slate-800 text-xs uppercase tracking-wide text-slate-400"><tr><th className="px-5 py-3 font-semibold">Organizador</th><th className="px-5 py-3 font-semibold">Correo</th><th className="px-5 py-3 font-semibold">Rol</th><th className="px-5 py-3 font-semibold">Registro</th><th className="px-5 py-3 font-semibold">ID</th><th className="px-5 py-3 font-semibold">Acciones</th></tr></thead><tbody>{visibleProfiles.map(profile=><tr key={profile.id} className="border-b border-slate-700 last:border-0"><td className="px-5 py-3 font-semibold">{profile.displayName}</td><td className="max-w-56 truncate px-5 py-3 text-slate-300" title={managedUsersById.get(profile.id)?.email}>{managedUsersById.get(profile.id)?.email ?? '—'}</td><td className="px-5 py-3">{isSuperAdmin&&profile.id!==user?.id?<select aria-label={`Cambiar rol de ${profile.displayName}`} value={profile.role} disabled={changingRole===profile.id} onChange={event=>void changeRole(profile.id,event.target.value as AssignableRole)} className="rounded-md border border-slate-500 bg-slate-950 px-2 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"><option value="organizer">Organizador</option><option value="admin">Administrador</option></select>:<span className={profile.role !== 'organizer' ? 'rounded-md bg-amber-400 px-2 py-1 text-xs font-bold text-slate-950' : 'rounded-md bg-slate-800 px-2 py-1 text-xs font-semibold'}>{roleLabel(profile.role)}</span>}</td><td className="px-5 py-3 text-slate-300">{displayDate(profile.createdAt)}</td><td className="max-w-44 truncate px-5 py-3 font-mono text-xs text-slate-400" title={profile.id}>{profile.id}</td><td className="px-5 py-3">{isSuperAdmin&&profile.id!==user?.id&&managedUsers.find(managed=>managed.id===profile.id)?<div className="flex gap-2"><button type="button" className="rounded-md border border-slate-500 px-2 py-1 text-xs font-semibold hover:bg-slate-800" onClick={()=>setEditingUser(managedUsers.find(managed=>managed.id===profile.id))}>Editar</button><button type="button" className="rounded-md bg-red-700 px-2 py-1 text-xs font-bold text-white hover:bg-red-600" onClick={()=>void removeProfile(managedUsers.find(managed=>managed.id===profile.id)!)}>Eliminar</button></div>:<span className="text-slate-400">—</span>}</td></tr>)}{visibleProfiles.length===0&&<tr><td colSpan={6} className="px-5 py-5 text-slate-400">No hay perfiles registrados.</td></tr>}</tbody></table></div></section></div><div className={adminTab === 'tournaments' ? '' : 'hidden'}><section className={`${panel} overflow-hidden p-0`}><div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 px-5 py-4"><div><h2 className="text-xl font-black">Torneos</h2></div><div className="flex items-center gap-2"><input value={tournamentSearch} onChange={event=>setTournamentSearch(event.target.value)} className="w-52 rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400" placeholder="Buscar torneo" /><span className="text-sm text-slate-400">{overview.tournaments.length} en total</span></div></div><div className="max-h-96 overflow-auto"><table className="w-full min-w-[780px] text-left text-sm"><thead className="border-b border-slate-700 bg-slate-800 text-xs uppercase tracking-wide text-slate-400"><tr><th className="px-5 py-3 font-semibold">Torneo</th><th className="px-5 py-3 font-semibold">Organizador</th><th className="px-5 py-3 font-semibold">Estado</th><th className="px-5 py-3 font-semibold">Participantes</th><th className="px-5 py-3 font-semibold">Rondas</th><th className="px-5 py-3 font-semibold">Visibilidad</th><th className="px-5 py-3 font-semibold">Acciones</th></tr></thead><tbody>{visibleTournaments.map(tournament=><tr key={tournament.id} className="border-b border-slate-700 last:border-0"><td className="px-5 py-3"><strong className="block">{tournament.name}</strong><span className="text-xs text-slate-400">{tournament.format} · {displayDate(tournament.createdAt)}</span></td><td className="px-5 py-3 text-slate-300">{profilesById.get(tournament.ownerId)?.displayName ?? 'Organizador eliminado'}</td><td className="px-5 py-3"><Badge>{tournament.status}</Badge></td><td className="px-5 py-3 tabular-nums">{tournament.playerCount}</td><td className="px-5 py-3 tabular-nums">{tournament.roundCount}</td><td className="px-5 py-3"><span className={tournament.isPublic ? 'text-emerald-300' : 'text-slate-400'}>{tournament.isPublic ? 'Público' : 'Privado'}</span></td><td className="px-5 py-3">{isSuperAdmin?<Link to={`/tournaments/${tournament.id}`} className="rounded-md border border-slate-500 px-2 py-1 text-xs font-semibold hover:bg-slate-800">Gestionar</Link>:<span className="text-slate-400">—</span>}</td></tr>)}{visibleTournaments.length===0&&<tr><td colSpan={7} className="px-5 py-5 text-slate-400">No hay torneos registrados.</td></tr>}</tbody></table></div></section></div><div className={adminTab === 'players' ? '' : 'hidden'}><SuperAdminPlayerManagement /></div><div className={adminTab === 'details' ? '' : 'hidden'}><AdminDataInspector /></div>{editingUser&&<UserProfileModal user={editingUser} onClose={()=>setEditingUser(undefined)} onSaved={()=>{void refresh();void refreshManagedUsers();setEditingUser(undefined)}} />}</>}</Layout>
}

function AdminMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return <article className={panel}><div className="flex items-center gap-2 text-amber-300">{icon}<span className="text-sm font-semibold">{label}</span></div><strong className="mt-3 block text-3xl font-black tabular-nums">{value}</strong></article>
}

function AdminDataInspector() {
  const [tournaments, setTournaments] = useState<Tournament[]>()
  const [error, setError] = useState<string>()
  const [search, setSearch] = useState('')

  useEffect(() => {
    let active = true
    void loadAllTournaments().then(data => { if (active) setTournaments(data) }).catch(reason => { if (active) setError(reason instanceof Error ? reason.message : 'No se pudo cargar el detalle de los torneos.') })
    return () => { active = false }
  }, [])

  const visibleTournaments = tournaments?.filter(tournament => `${tournament.name} ${tournament.format}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()))
  return <section className={`${panel} mt-7`}><div><h2 className="text-xl font-black">Datos completos</h2><p className="mt-1 text-sm text-slate-300">Consulta de solo lectura de cada torneo, con reglas, jugadores, rondas, mesas y resultados. No incluye credenciales ni datos de Authentication.</p></div>{error&&<p className="mt-4 text-sm text-red-300">{error}</p>}{!tournaments&&!error&&<p className="mt-4 text-sm text-slate-300">Cargando detalle…</p>}<input value={search} onChange={event=>setSearch(event.target.value)} className="mt-4 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400" placeholder="Buscar detalle de torneo" /><div className="mt-4 max-h-[34rem] space-y-3 overflow-y-auto pr-1">{visibleTournaments?.map(tournament=><details key={tournament.id} className="rounded-lg border border-slate-700 bg-slate-950 p-4"><summary className="cursor-pointer font-semibold"><span>{tournament.name}</span><span className="ml-2 text-sm font-normal text-slate-400">{tournament.players.length} jugadores · {tournament.rounds.length} rondas</span></summary><pre className="mt-4 max-h-96 overflow-auto rounded-md bg-slate-900 p-4 text-xs leading-relaxed text-slate-300">{JSON.stringify(tournament, null, 2)}</pre></details>)}</div></section>
}

function SuperAdminPlayerManagement() {
  const { isSuperAdmin } = useAuth()
  const [tournaments, setTournaments] = useState<Tournament[]>()
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)
  const load = async () => { try { setTournaments(await loadAllTournaments()); setError(undefined) } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudieron cargar los jugadores.') } }
  useEffect(() => { void load() }, [])
  const activePlayers = (tournaments ?? []).flatMap(tournament => tournament.players.filter(player => player.active).map(player => ({ tournament, player })))
  const playersByTournament = new Map(tournaments?.map(tournament => [tournament.id, tournament.players.filter(player => player.active).length]))
  const players = activePlayers.filter(({ player, tournament }) => `${player.name} ${tournament.name}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()))
  if (!isSuperAdmin) return <section className={`${panel} mt-7`}><div><h2 className="text-xl font-black">Jugadores activos</h2><p className="mt-1 text-sm text-slate-300">Consulta de jugadores activos por torneo.</p></div>{error&&<p className="mt-4 text-sm text-red-300">{error}</p>}<input value={search} onChange={event=>setSearch(event.target.value)} className={`${field} mt-4`} placeholder="Buscar jugador o torneo" /><div className="mt-3 max-h-96 space-y-2 overflow-y-auto pr-1">{players.map(({ tournament, player })=><article key={player.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-700 p-3"><strong>{player.name}</strong><span className="text-sm text-slate-400">{tournament.name}</span></article>)}{tournaments&&players.length===0&&<p className="text-sm text-slate-400">No hay jugadores activos que coincidan.</p>}</div></section>
  const create = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); const tournament = tournaments?.find(item => item.id === String(form.get('tournamentId'))); const name = String(form.get('name')).trim(); if (!tournament || !name) return; setBusy(true); try { await insertPlayers(tournament.id, [{ id: uid(), name, active: true, tieBreaker: tournament.players.length + 1 }]); event.currentTarget.reset(); await load() } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo crear el jugador.') } finally { setBusy(false) } }
  const update = async (event: FormEvent<HTMLFormElement>, player: Tournament['players'][number]) => { event.preventDefault(); const name = String(new FormData(event.currentTarget).get('name')).trim(); if (!name) return; setBusy(true); try { await persistPlayer({ ...player, name }); await load() } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo actualizar el jugador.') } finally { setBusy(false) } }
  const remove = async (player: Tournament['players'][number]) => { if (!window.confirm(`Eliminar a ${player.name}?`)) return; setBusy(true); try { await removeRemotePlayer(player.id); await load() } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se puede eliminar un jugador con participaciones registradas.') } finally { setBusy(false) } }
  return <section className={[panel, 'mt-7 overflow-hidden p-0'].join(' ')}><div className="px-5 pt-5"><p className="text-sm font-semibold text-amber-300">SUPER ADMIN</p><h2 className="mt-1 text-xl font-black">Jugadores activos</h2><p className="mt-1 text-sm text-slate-300">Crea cada jugador dentro de un torneo y administra sus datos desde aquí.</p>{error&&<p className="mt-4 text-sm text-red-300">{error}</p>}<form onSubmit={create} className="mt-4 grid gap-3 rounded-lg border border-slate-700 bg-slate-950 p-4 md:grid-cols-3"><select required name="tournamentId" className={field} defaultValue=""><option value="" disabled>Selecciona un torneo</option>{tournaments?.map(tournament=><option key={tournament.id} value={tournament.id}>{tournament.name}</option>)}</select><input required name="name" className={field} placeholder="Nombre del jugador" /><button disabled={busy} className={primary}>Crear jugador</button></form></div><div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-y border-slate-700 px-5 py-4"><input value={search} onChange={event=>setSearch(event.target.value)} className="w-64 rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400" placeholder="Buscar jugador o torneo" /><span className="text-sm text-slate-400">{players.length} en total</span></div><div className="max-h-[34rem] overflow-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="border-b border-slate-700 bg-slate-800 text-xs uppercase tracking-wide text-slate-400"><tr><th className="px-5 py-3 font-semibold">Jugador</th><th className="px-5 py-3 font-semibold">Torneo</th><th className="px-5 py-3 font-semibold">Estado</th><th className="px-5 py-3 font-semibold">Acciones</th></tr></thead><tbody>{players.map(({ tournament, player })=><tr key={player.id} className="border-b border-slate-700 last:border-0"><td className="px-5 py-3"><form id={'player-' + player.id} onSubmit={event=>void update(event,player)}><input required name="name" defaultValue={player.name} className={field} /></form></td><td className="px-5 py-3"><strong className="block">{tournament.name}</strong><span className="text-xs text-slate-400">{playersByTournament.get(tournament.id) ?? 0} jugadores activos</span></td><td className="px-5 py-3 text-emerald-300">Activo</td><td className="px-5 py-3"><div className="flex gap-2"><button disabled={busy} form={'player-' + player.id} className={primary}>Guardar</button><button disabled={busy} type="button" className="rounded-lg bg-red-700 px-3 py-2 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50" onClick={()=>void remove(player)}>Eliminar</button></div></td></tr>)}{tournaments&&players.length===0&&<tr><td colSpan={4} className="px-5 py-5 text-slate-400">No hay jugadores activos que coincidan.</td></tr>}</tbody></table></div></section>
}

function UserProfileModal({ user, onClose, onSaved }: { user: ManagedUser; onClose: () => void; onSaved: () => void }) {
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setBusy(true)
    try {
      await updateManagedUser(user.id, { displayName: String(form.get('displayName')).trim(), email: String(form.get('email')).trim(), password: String(form.get('password')) || undefined, role: String(form.get('role')) as AssignableRole })
      onSaved()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo actualizar el perfil.')
    } finally {
      setBusy(false)
    }
  }
  return <Modal title={`Editar perfil: ${user.displayName}`} description="Deja la contraseña vacía para conservarla." onClose={onClose}><form onSubmit={save} className="space-y-4">{error&&<p className="text-sm text-red-300">{error}</p>}<label className="block text-sm font-medium">Nombre<input required name="displayName" defaultValue={user.displayName} className={field} /></label><label className="block text-sm font-medium">Correo<input required name="email" type="email" defaultValue={user.email} className={field} /></label><label className="block text-sm font-medium">Nueva contraseña<input name="password" minLength={6} type="password" className={field} /></label><label className="block text-sm font-medium">Rol<select name="role" defaultValue={user.role === 'admin' ? 'admin' : 'organizer'} className={field}><option value="organizer">Organizador</option><option value="admin">Administrador</option></select></label><div className="flex justify-end gap-3"><button type="button" className="rounded-lg border border-slate-500 px-4 py-2 text-sm font-semibold hover:bg-slate-800" onClick={onClose}>Cancelar</button><button disabled={busy} className={primary}>{busy ? 'Guardando…' : 'Guardar cambios'}</button></div></form></Modal>
}
