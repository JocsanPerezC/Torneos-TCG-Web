import type { Pod, Result, ResultOutcome, Tournament } from '@/domain/types';

const field = 'app-field';

export function PodResults({
  pod,
  tournament,
  roundId,
  disabled,
  onResult,
  labels,
}: {
  pod: Pod;
  tournament: Tournament;
  roundId: string;
  disabled: boolean;
  onResult: (roundId: string, podId: string, playerId: string, patch: Partial<Result>) => void;
  labels: {
    table: string;
    players: string;
    points: string;
    kills: string;
    outcome: string;
    chooseOutcome: string;
    win: string;
    loss: string;
    draw: string;
  };
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border">
      <header className="flex items-center justify-between bg-secondary/60 px-4 py-3">
        <strong>
          {labels.table} {pod.number}
        </strong>
        <span className="text-xs text-muted-foreground">
          {pod.playerIds.length} {labels.players}
        </span>
      </header>
      <div className="divide-y divide-border">
        {pod.playerIds.map((playerId) => {
          const player = tournament.players.find((item) => item.id === playerId);
          const result = pod.results?.find((item) => item.playerId === playerId);
          if (!player) return null;
          return (
            <div key={playerId} className="grid grid-cols-[minmax(0,1fr)_4.7rem_4.2rem] gap-2 p-3">
              <strong className="self-center truncate text-sm">{player.name}</strong>
              <label className="text-xs font-semibold text-muted-foreground">
                {labels.points}
                <input
                  disabled={disabled}
                  min="0"
                  type="number"
                  value={result?.points ?? 0}
                  onChange={(event) =>
                    onResult(roundId, pod.id, playerId, { points: Number(event.target.value) })
                  }
                  className={`${field} mt-1 px-2 py-1 text-sm`}
                />
              </label>
              <label className="text-xs font-semibold text-muted-foreground">
                {labels.kills}
                <input
                  disabled={disabled}
                  min="0"
                  type="number"
                  value={result?.kills ?? 0}
                  onChange={(event) =>
                    onResult(roundId, pod.id, playerId, { kills: Number(event.target.value) })
                  }
                  className={`${field} mt-1 px-2 py-1 text-sm`}
                />
              </label>
              <label className="col-span-3 text-xs font-semibold text-muted-foreground">
                {labels.outcome}
                <select
                  disabled={disabled}
                  value={result?.outcome ?? ''}
                  onChange={(event) =>
                    onResult(roundId, pod.id, playerId, {
                      outcome: event.target.value as ResultOutcome,
                    })
                  }
                  className={`${field} mt-1 py-1 text-sm`}
                >
                  <option value="">{labels.chooseOutcome}</option>
                  <option value="win">{labels.win}</option>
                  <option value="loss">{labels.loss}</option>
                  <option value="draw">{labels.draw}</option>
                </select>
              </label>
            </div>
          );
        })}
      </div>
    </section>
  );
}
