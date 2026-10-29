import type { ResultOutcome } from '../../../domain/types';
import i18n from '../../../i18n';

export function outcomeLabel(outcome?: ResultOutcome) {
  return outcome ? i18n.t(`app.common.${outcome}`) : '—';
}
