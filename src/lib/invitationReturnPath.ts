const storageKey = 'torneos-tcg.invitation-return-path';

export function invitationReturnPath(value: string | null | undefined) {
  return value?.startsWith('/unirse/') && !value.startsWith('//') ? value : undefined;
}

export function savedInvitationReturnPath() {
  try {
    return invitationReturnPath(sessionStorage.getItem(storageKey));
  } catch {
    return undefined;
  }
}

export function saveInvitationReturnPath(path: string) {
  const validPath = invitationReturnPath(path);
  if (!validPath) return;
  try {
    sessionStorage.setItem(storageKey, validPath);
  } catch {
    // The redirect query remains available when session storage is unavailable.
  }
}

export function clearInvitationReturnPath() {
  try {
    sessionStorage.removeItem(storageKey);
  } catch {
    // Nothing to clear when session storage is unavailable.
  }
}
