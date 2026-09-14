import { useEffect } from 'react';

const textLimits: Record<string, { max: number; message: string }> = {
  name: { max: 80, message: 'El nombre admite un máximo de 80 caracteres.' },
  displayName: { max: 80, message: 'El nombre admite un máximo de 80 caracteres.' },
  format: { max: 50, message: 'El formato admite un máximo de 50 caracteres.' },
  email: { max: 254, message: 'El correo admite un máximo de 254 caracteres.' },
  password: { max: 128, message: 'La contraseña admite un máximo de 128 caracteres.' },
  confirmPassword: { max: 128, message: 'La contraseña admite un máximo de 128 caracteres.' },
};

function numericLimit(input: HTMLInputElement) {
  if (input.name === 'rounds')
    return { min: 1, max: 30, message: 'Las rondas deben estar entre 1 y 30.' };
  if (input.name === 'maxPlayers')
    return { min: 3, max: 50, message: 'El máximo de jugadores debe estar entre 3 y 50.' };
  if (input.name === 'maxTables')
    return { min: 1, max: 25, message: 'El máximo de mesas debe estar entre 1 y 25.' };
  if (['first', 'second', 'third', 'fourth', 'tie'].includes(input.name))
    return { min: 0, max: 100, message: 'La puntuación debe estar entre 0 y 100.' };
  if (input.name.startsWith('points-'))
    return { min: 0, max: 2_147_483_647, message: 'Los puntos deben ser enteros no negativos.' };
  if (input.name.startsWith('kills-'))
    return { min: 0, max: 3, message: 'Los kills deben estar entre 0 y 3.' };
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
  if (element instanceof HTMLTextAreaElement && element.name === 'names') {
    const hasLongName = element.value.split(/\r?\n/).some((name) => name.trim().length > 80);
    element.setCustomValidity(
      hasLongName ? 'Cada nombre de jugador admite un máximo de 80 caracteres.' : '',
    );
    return;
  }

  const textLimit = textLimits[element.name];
  if (textLimit) {
    element.setCustomValidity(element.value.length > textLimit.max ? textLimit.message : '');
    return;
  }

  if (element instanceof HTMLInputElement && element.type === 'number') {
    const limit = numericLimit(element);
    const value = Number(element.value);
    element.setCustomValidity(
      limit &&
        element.value !== '' &&
        (!Number.isInteger(value) || value < limit.min || value > limit.max)
        ? limit.message
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
    return () => {
      document.removeEventListener('input', handleInput, true);
      document.removeEventListener('focusin', handleInput, true);
    };
  }, []);

  return null;
}
