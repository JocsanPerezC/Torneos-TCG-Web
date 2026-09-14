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
  const avatarUrl = firstText(metadata.avatar_url, metadata.picture);

  return { name, avatarUrl };
}
