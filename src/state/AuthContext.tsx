import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { AppRole } from '@/data/adminRepository';
import { recordLoginAccess } from '@/data/adminUsersRepository';
import { legalConsentStorageKey, type LegalConsent } from '@/lib/legal';
import i18n from '@/i18n';
import { normalizeNickname } from '@/lib/userProfile';

export type RegistrationRole = 'player' | 'organizer';

// La confirmación por correo está desactivada temporalmente en Supabase.
// Al reactivarla, restablecer el aviso correspondiente en la pantalla de registro.

export type AuthStore = {
  user: User | null;
  role: AppRole | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isPlayer: boolean;
  requiresRoleSelection: boolean;
  requiresLegalConsent: boolean;
  loading: boolean;
  configured: boolean;
  signIn(email: string, password: string): Promise<void>;
  signUp(
    name: string,
    nickname: string,
    email: string,
    password: string,
    consent: LegalConsent,
  ): Promise<void>;
  completeRegistrationRole(role: RegistrationRole): Promise<void>;
  isEmailRegistered(email: string): Promise<boolean>;
  isNicknameAvailable(nickname: string): Promise<boolean>;
  /** Valida, comprueba que esté libre y guarda el apodo de la cuenta actual. */
  saveNickname(nickname: string): Promise<string>;
  resetPassword(email: string): Promise<void>;
  acceptLegalConsent(): Promise<void>;
  signOut(): Promise<void>;
};
async function nicknameAvailable(nickname: string) {
  if (!supabase) return true;
  const { data, error } = await supabase.rpc('is_nickname_available', { candidate: nickname });
  if (error) throw error;
  return Boolean(data);
}

const Context = createContext<AuthStore | null>(null);
/** Expuesto para providers de prueba y del muestrario; la app usa AuthProvider. */
export const AuthContext = Context;
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [requiresRoleSelection, setRequiresRoleSelection] = useState(false);
  const [requiresLegalConsent, setRequiresLegalConsent] = useState(false);
  const [loading, setLoading] = useState(Boolean(supabase));
  useEffect(() => {
    const client = supabase;
    if (!client) return;
    let active = true;
    const applySession = async (nextUser: User | null) => {
      if (!active) return;
      setUser(nextUser);
      if (!nextUser) {
        setRole(null);
        setRequiresRoleSelection(false);
        setRequiresLegalConsent(false);
        setLoading(false);
        return;
      }
      const pendingConsent = sessionStorage.getItem(legalConsentStorageKey);
      if (pendingConsent) {
        try {
          const consent = JSON.parse(pendingConsent) as LegalConsent;
          const { error } = await client.rpc('record_legal_consent', {
            accepted_terms_version: consent.termsVersion,
            accepted_privacy_version: consent.privacyVersion,
          });
          if (!error) sessionStorage.removeItem(legalConsentStorageKey);
        } catch {
          // Authentication remains available if the optional post-OAuth write cannot run.
        }
      }
      setLoading(true);
      const { data, error } = await client
        .from('profiles')
        .select('role, role_locked, legal_consent_required, avatar_url, nickname')
        .eq('id', nextUser.id)
        .maybeSingle();
      if (!active) return;
      if (!error && data)
        setUser({
          ...nextUser,
          user_metadata: {
            ...nextUser.user_metadata,
            avatar_url: data.avatar_url,
            nickname: data.nickname,
          },
        });
      const roleSelectionNeeded = !error && data?.role_locked === false;
      setRequiresRoleSelection(roleSelectionNeeded);
      setRole(
        roleSelectionNeeded
          ? null
          : !error &&
              (data?.role === 'player' || data?.role === 'admin' || data?.role === 'super_admin')
            ? data.role
            : 'organizer',
      );
      setRequiresLegalConsent(Boolean(data?.legal_consent_required));
      setLoading(false);
    };
    void client.auth.getSession().then(({ data }) => void applySession(data.session?.user ?? null));
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') void recordLoginAccess().catch(() => undefined);
      void applySession(session?.user ?? null);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);
  const value = useMemo<AuthStore>(
    () => ({
      user,
      role,
      isAdmin: role === 'admin' || role === 'super_admin',
      isSuperAdmin: role === 'super_admin',
      isPlayer: role === 'player',
      requiresRoleSelection,
      requiresLegalConsent,
      loading,
      configured: Boolean(supabase),
      async signIn(email, password) {
        if (!supabase) return;
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      async isEmailRegistered(email) {
        if (!supabase) return false;
        const { data, error } = await supabase.rpc('is_email_registered', {
          candidate_email: email,
        });
        if (error) throw error;
        return Boolean(data);
      },
      isNicknameAvailable: nicknameAvailable,
      async saveNickname(value) {
        const nickname = normalizeNickname(value);
        if (!nickname) throw new Error(i18n.t('app.auth.nicknameInvalid'));
        if (!supabase || !user) return nickname;
        if (!(await nicknameAvailable(nickname))) throw new Error(i18n.t('app.auth.nicknameTaken'));
        const { error } = await supabase.from('profiles').update({ nickname }).eq('id', user.id);
        // 23505: otra cuenta tomó el apodo entre la comprobación y el guardado.
        if (error?.code === '23505') throw new Error(i18n.t('app.auth.nicknameTaken'));
        if (error) throw error;
        setUser((current) =>
          current ? { ...current, user_metadata: { ...current.user_metadata, nickname } } : current,
        );
        return nickname;
      },
      async signUp(name, nickname, email, password, consent) {
        if (!supabase) return;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: name,
              nickname,
              legal_consent: true,
              terms_version: consent.termsVersion,
              privacy_version: consent.privacyVersion,
            },
            emailRedirectTo: `${window.location.origin}/auth/confirmed`,
          },
        });
        if (error) throw error;
      },
      async completeRegistrationRole(nextRole) {
        if (!supabase) return;
        const { error } = await supabase.rpc('complete_signup_role', { next_role: nextRole });
        if (error) throw error;
        setRole(nextRole);
        setRequiresRoleSelection(false);
      },
      async resetPassword(email) {
        if (!supabase) return;
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/login`,
        });
        if (error) throw error;
      },
      async acceptLegalConsent() {
        if (!supabase) return;
        const { error } = await supabase.rpc('record_legal_consent', {
          accepted_terms_version: '2026-09-22',
          accepted_privacy_version: '2026-09-22',
        });
        if (error) throw error;
        setRequiresLegalConsent(false);
      },
      async signOut() {
        if (!supabase) return;
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      },
    }),
    [user, role, loading, requiresLegalConsent, requiresRoleSelection],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useAuth() {
  const value = useContext(Context);
  if (!value) throw new Error('AuthProvider no disponible');
  return value;
}
