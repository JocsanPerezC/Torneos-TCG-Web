import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/state/AuthContext'

const players = [
  { name: 'Lina', score: 11, kills: 2, seat: 'hero-seat--north', color: 'blue' },
  { name: 'Marco', score: 9, kills: 1, seat: 'hero-seat--east', color: 'green' },
  { name: 'Sofía', score: 8, kills: 0, seat: 'hero-seat--south', color: 'violet' },
  { name: 'Tomás', score: 6, kills: 1, seat: 'hero-seat--west', color: 'red' },
]

export function Hero() {
  const { t } = useTranslation()
  const { user, loading } = useAuth()
  const primaryTarget = !loading && user ? '/dashboard' : '/register'
  const primaryLabel = !loading && user ? t('landing.navigation.dashboard') : t('landing.navigation.createAccount')

  return <section className="hero-sheet mx-auto max-w-6xl px-5 pb-14 pt-12 sm:pb-20 sm:pt-20">
    <div className="hero-sheet__copy">
      <p className="hero-sheet__eyebrow">{t('landing.hero.eyebrow')}</p>
      <h1>{t('landing.hero.title')}</h1>
      <p className="hero-sheet__description">{t('landing.hero.description')}</p>
      <div className="hero-sheet__actions"><Button asChild variant="outline" size="lg"><Link to={user ? '/dashboard' : '/login'}>{user ? t('landing.navigation.dashboard') : t('landing.navigation.login')}</Link></Button><Button asChild size="lg"><Link to={primaryTarget}>{primaryLabel}</Link></Button></div>
      <p className="hero-sheet__note"><span aria-hidden>✦</span>{t('landing.hero.noAccount')}</p>
    </div>
    <div className="hero-table" aria-label={t('landing.preview.ariaLabel')}>
      <div className="hero-table__topline"><span>{t('landing.preview.tournamentName')}</span><strong>{t('landing.preview.live')}</strong></div>
      <div className="hero-table__felt"><svg viewBox="0 0 360 250" aria-hidden="true"><path d="M180 32c79 0 143 40 143 92s-64 92-143 92S37 176 37 124 101 32 180 32Z" /><path d="M116 55c-18 22-26 45-26 69s8 47 26 69M244 55c18 22 26 45 26 69s-8 47-26 69" /><circle cx="180" cy="124" r="35" /></svg><div className="hero-table__center"><span>{t('landing.preview.currentRound')}</span><strong>{t('landing.preview.roundValue')}</strong><i>{t('landing.preview.activeTables')} 4</i></div>{players.map((player) => <article className={`hero-seat ${player.seat} hero-seat--${player.color}`} key={player.name}><span className="hero-seat__token">{player.name[0]}</span><div><strong>{player.name}</strong><small>{player.kills} {t('landing.preview.kills')}</small></div><b>{player.score}</b></article>)}</div>
      <div className="hero-table__log"><span className="hero-table__pulse" /><p>{t('landing.preview.liveLog')}</p><strong>+1 {t('landing.preview.kills')}</strong></div>
    </div>
  </section>
}
