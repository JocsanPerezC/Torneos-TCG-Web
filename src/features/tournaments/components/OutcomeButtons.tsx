import { useState } from 'react';
import { CircleX, Equal, Trophy, type LucideIcon } from 'lucide-react';
import type { ResultOutcome } from '../../../domain/types';
import i18n from '../../../i18n';

export function OutcomeButtons({
  playerId,
  outcome,
}: {
  playerId: string;
  outcome?: ResultOutcome;
}) {
  const [selected, setSelected] = useState<ResultOutcome | undefined>(outcome);
  const options: { value: ResultOutcome; Icon: LucideIcon; label: string }[] = [
    { value: 'win', Icon: Trophy, label: i18n.t('app.common.win') },
    { value: 'loss', Icon: CircleX, label: i18n.t('app.common.loss') },
    { value: 'draw', Icon: Equal, label: i18n.t('app.common.draw') },
  ];
  return (
    <fieldset className="outcome-chips">
      <legend className="sr-only">{i18n.t('app.common.outcome')}</legend>
      <input type="hidden" name={`outcome-${playerId}`} value={selected ?? ''} />
      {options.map((option) => (
        <label
          key={option.value}
          className={`outcome-chips__option outcome-chips__option--${option.value} ${selected === option.value ? 'is-selected' : ''}`}
        >
          <input
            className="sr-only"
            type="checkbox"
            checked={selected === option.value}
            onChange={() =>
              setSelected((current) => (current === option.value ? undefined : option.value))
            }
          />
          <option.Icon aria-hidden size={14} strokeWidth={2.25} />
          {option.label}
        </label>
      ))}
    </fieldset>
  );
}
