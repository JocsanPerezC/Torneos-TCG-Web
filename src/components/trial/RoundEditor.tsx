import { Play } from 'lucide-react'
import type { Result, Tournament } from '@/domain/types'
import { PodResults } from './PodResults'

const panel = 'app-panel'
const primary = 'app-button app-button--primary'

export function RoundEditor({ round, tournament, disabled, onStart, onResult, onComplete, labels }: { round: Tournament['rounds'][number]; tournament: Tournament; disabled: boolean; onStart: (roundId: string) => void; onResult: (roundId: string, podId: string, playerId: string, patch: Partial<Result>) => void; onComplete: (roundId: string) => void; labels: { start: string; complete: string; table: string; players: string; points: string; kills: string; outcome: string; chooseOutcome: string; win: string; loss: string; draw: string; draft: string; active: string; completed: string } }) {
  const labelForStatus = { borrador: labels.draft, activa: labels.active, completada: labels.completed }[round.status]

  return <article className={panel}>
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold">{labels.table} · {round.number}</h2><p className="mt-1 text-sm text-muted-foreground">{labelForStatus}</p></div>{round.status === 'borrador' ? <button disabled={disabled} onClick={() => onStart(round.id)} className={primary}><Play size={16} />{labels.start}</button> : round.status === 'activa' ? <button disabled={disabled} onClick={() => onComplete(round.id)} className={primary}>{labels.complete}</button> : null}</div>
    <div className="mt-5 grid gap-4 lg:grid-cols-2">{round.pods.map(pod => <PodResults key={pod.id} pod={pod} tournament={tournament} roundId={round.id} disabled={disabled || round.status !== 'activa'} onResult={onResult} labels={labels} />)}</div>
  </article>
}
