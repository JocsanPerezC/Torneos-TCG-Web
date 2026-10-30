import type { User } from '@supabase/supabase-js';

type UserMetadata = Record<string, unknown>;

function firstText(...values: unknown[]) {
  return values
    .find((value): value is string => typeof value === 'string' && value.trim().length > 0)
    ?.trim();
}

/** Normalizes the different profile fields returned by email and Google sign-in. */
export function getUserProfile(user: User | null) {
  const metadata = (user?.user_metadata ?? {}) as UserMetadata;
  const name =
    firstText(
      metadata.display_name,
      metadata.full_name,
      metadata.name,
      user?.email?.split('@')[0],
      'organizador',
    ) ?? 'organizador';
  const avatarUrl = Object.hasOwn(metadata, 'avatar_url')
    ? firstText(metadata.avatar_url)
    : firstText(metadata.picture);
  // El apodo viene de `profiles`; mientras carga, se usa el nombre.
  const nickname = firstText(metadata.nickname) ?? name;

  return { name, nickname, avatarUrl };
}

export const NICKNAME_MAX_LENGTH = 24;

/** Limpia espacios del apodo; devuelve undefined si no tiene un largo válido. */
export function normalizeNickname(value: string) {
  const nickname = value.trim().replace(/\s+/g, ' ');
  return nickname.length >= 2 && nickname.length <= NICKNAME_MAX_LENGTH ? nickname : undefined;
}
