import { useEffect } from 'react';
import i18n from '../i18n';

const textLimits: Record<string, { max: number; messageKey: string }> = {
  name: { max: 80, messageKey: 'nameMax' },
  displayName: { max: 80, messageKey: 'nameMax' },
  format: { max: 50, messageKey: 'formatMax' },
  email: { max: 254, messageKey: 'emailMax' },
  password: { max: 128, messageKey: 'passwordMax' },
  confirmPassword: { max: 128, messageKey: 'passwordMax' },
};

function numericLimit(input: HTMLInputElement) {
  if (input.name === 'rounds')
    return { min: 1, max: 30, messageKey: 'roundsRange' };
  if (input.name === 'maxPlayers')
    return { min: 3, max: 50, messageKey: 'maxPlayersRange' };
  if (input.name === 'maxTables')
    return { min: 1, max: 25, messageKey: 'maxTablesRange' };
  if (['first', 'second', 'third', 'fourth', 'tie'].includes(input.name))
    return { min: 0, max: 100, messageKey: 'scoringRange' };
  if (input.name.startsWith('points-'))
    return { min: 0, max: 2_147_483_647, messageKey: 'pointsRange' };
  if (input.name.startsWith('kills-'))
    return { min: 0, max: 3, messageKey: 'killsRange' };
  return undefined;
}

function applyLimits(element: HTMLInputElement | HTMLTextAreaElement) {
  if (element instanceof HTMLTextAreaElement && element.name === 'names') {
    element.maxLength = 8_099;
    return;
  }

  const textLimit = textLimits[element.name];
  if (textLimit) element.maxLength = textLimit.max;
  if (element instanceof HTMLInputElement && element.type === 'number') {
    const limit = numericLimit(element);
    if (limit) {
      element.min = String(limit.min);
      element.max = String(limit.max);
      element.step = '1';
    }
  }
}

function validate(element: HTMLInputElement | HTMLTextAreaElement) {
  if (element.required && !element.value.trim()) {
    element.setCustomValidity(i18n.t('app.messages.required'));
    return;
  }

  if (element instanceof HTMLTextAreaElement && element.name === 'names') {
    const hasLongName = element.value.split(/\r?\n/).some((name) => name.trim().length > 80);
    element.setCustomValidity(
      hasLongName ? i18n.t('app.messages.playerNameMax') : '',
    );
    return;
  }

  const textLimit = textLimits[element.name];
  if (textLimit) {
    element.setCustomValidity(element.value.length > textLimit.max ? i18n.t(`app.messages.${textLimit.messageKey}`) : '');
    return;
  }

  if (element instanceof HTMLInputElement && element.type === 'number') {
    const limit = numericLimit(element);
    const value = Number(element.value);
    element.setCustomValidity(
      limit &&
        element.value !== '' &&
        (!Number.isInteger(value) || value < limit.min || value > limit.max)
        ? i18n.t(`app.messages.${limit.messageKey}`)
        : '',
    );
  }
}

/** Applies limits only when a field is focused or edited, avoiding a full-DOM observer on every render. */
export function FormLimits() {
  useEffect(() => {
    const update = (element: Element) => {
      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        applyLimits(element);
        validate(element);
      }
    };
    const handleInput = (event: Event) => update(event.target as Element);

    document.querySelectorAll('input, textarea').forEach(update);
    document.addEventListener('input', handleInput, true);
    document.addEventListener('focusin', handleInput, true);
    const refreshMessages = () => document.querySelectorAll('input, textarea').forEach(update);
    i18n.on('languageChanged', refreshMessages);
    return () => {
      document.removeEventListener('input', handleInput, true);
      document.removeEventListener('focusin', handleInput, true);
      i18n.off('languageChanged', refreshMessages);
    };
  }, []);

  return null;
}
