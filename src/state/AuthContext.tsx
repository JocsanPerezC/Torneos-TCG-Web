import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { AppRole } from '../data/adminRepository';
import { legalConsentStorageKey, type LegalConsent } from '../legal';

// La confirmación por correo está desactivada temporalmente en Supabase.
// Al reactivarla, restablecer el aviso correspondiente en la pantalla de registro.

type AuthStore = {
  user: User | null;
  role: AppRole | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  requiresLegalConsent: boolean;
  loading: boolean;
  configured: boolean;
  signIn(email: string, password: string): Promise<void>;
  signUp(name: string, email: string, password: string, consent: LegalConsent): Promise<void>;
  isEmailRegistered(email: string): Promise<boolean>;
  resetPassword(email: string): Promise<void>;
  acceptLegalConsent(): Promise<void>;
  signOut(): Promise<void>;
};
const Context = createContext<AuthStore | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
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
        .select('role, legal_consent_required')
        .eq('id', nextUser.id)
        .maybeSingle();
      if (!active) return;
      const profileRole = data?.role;
      setRole(
        !error && (profileRole === 'admin' || profileRole === 'super_admin')
          ? profileRole
          : 'organizer',
      );
      setRequiresLegalConsent(Boolean(data?.legal_consent_required));
      setLoading(false);
    };
    void client.auth.getSession().then(({ data }) => void applySession(data.session?.user ?? null));
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
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
      async signUp(name, email, password, consent) {
        if (!supabase) return;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: name, legal_consent: true, terms_version: consent.termsVersion, privacy_version: consent.privacyVersion },
            emailRedirectTo: `${window.location.origin}/auth/confirmed`,
          },
        });
        if (error) throw error;
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
    [user, role, loading, requiresLegalConsent],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useAuth() {
  const value = useContext(Context);
  if (!value) throw new Error('AuthProvider no disponible');
  return value;
}
