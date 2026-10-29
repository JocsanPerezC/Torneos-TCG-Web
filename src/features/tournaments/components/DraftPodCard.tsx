import type { Pod } from '../../../domain/types';
import i18n from '../../../i18n';

export function DraftPodCard({
  pod,
  names,
  draggedPlayer,
  isDropTarget,
  onDragStart,
  onDragEnter,
  onDragEnd,
  onDrop,
}: {
  pod: Pod;
  names: Record<string, string>;
  draggedPlayer?: string;
  isDropTarget: boolean;
  onDragStart: (playerId: string) => void;
  onDragEnter: () => void;
  onDragEnd: () => void;
  onDrop: (playerId: string) => void;
}) {
  return (
    <div
      className={`game-table game-table--draft ${isDropTarget ? 'is-drop-target' : ''}`}
      onDragEnter={onDragEnter}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
      }}
      onDrop={(event) => {
        event.preventDefault();
        const playerId = event.dataTransfer.getData('text/plain') || draggedPlayer;
        if (playerId) onDrop(playerId);
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <h4>
          {i18n.t('app.common.table', { number: pod.number })}{' '}
          <span>({pod.playerIds.length}/5)</span>
        </h4>
        {isDropTarget && (
          <span className="game-table__drop">{i18n.t('app.tournament.dropHere')}</span>
        )}
      </div>
      <div className="game-table__draft-players">
        {pod.playerIds.map((playerId) => (
          <button
            type="button"
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData('text/plain', playerId);
              event.dataTransfer.effectAllowed = 'move';
              onDragStart(playerId);
            }}
            onDragEnd={onDragEnd}
            className={draggedPlayer === playerId ? 'is-dragging' : ''}
            key={playerId}
          >
            {names[playerId]}
          </button>
        ))}
      </div>
    </div>
  );
}
