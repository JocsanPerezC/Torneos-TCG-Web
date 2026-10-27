import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BadgeCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getUserProfile } from '../lib/userProfile';
import { useAuth } from '../state/AuthContext';
import { Button } from '../components/ui/button';

export function ProfilePage() {
  const { t } = useTranslation();
  const { configured, loading, role, user } = useAuth();
  const [message, setMessage] = useState<string>();
  const [busy, setBusy] = useState(false);
  const { name } = getUserProfile(user);

  if (configured && !loading && !user) return <Navigate to="/login" replace />;
  if (loading || !user)
    return (
      <div className="app-loading-note">
        <i />
        <span>{t('app.common.loading')}</span>
      </div>
    );

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const displayName = String(new FormData(event.currentTarget).get('displayName')).trim();
    if (!displayName || !supabase) return;
    setBusy(true);
    setMessage(undefined);
    try {
      const [{ error: profileError }, { error: authError }] = await Promise.all([
        supabase.from('profiles').update({ display_name: displayName }).eq('id', user.id),
        supabase.auth.updateUser({ data: { display_name: displayName } }),
      ]);
      if (profileError) throw profileError;
      if (authError) throw authError;
      setMessage(t('app.profile.saved'));
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : t('app.profile.saveFailed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mx-auto max-w-2xl app-panel">
      <BadgeCheck className="text-accent" aria-hidden="true" />
      <h1 className="mt-4 text-3xl">{t('app.profile.title')}</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{t('app.profile.description')}</p>
      <form className="mt-6 space-y-4" onSubmit={save}>
        <label className="block text-sm font-semibold">
          {t('app.common.name')}
          <input required name="displayName" defaultValue={name} className="app-field" />
        </label>
        <label className="block text-sm font-semibold">
          {t('app.common.email')}
          <input readOnly value={user.email ?? ''} className="app-field" />
        </label>
        <div className="rounded-xl border border-border bg-secondary/50 p-4">
          <span className="block text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {t('app.profile.role')}
          </span>
          <strong className="mt-1 block">{t(`app.profile.roles.${role ?? 'organizer'}`)}</strong>
          <p className="mb-0 mt-2 text-sm text-muted-foreground">{t('app.profile.roleHelp')}</p>
        </div>
        {message && (
          <p role="status" className="text-sm font-semibold text-muted-foreground">
            {message}
          </p>
        )}
        <Button disabled={busy} className="app-button app-button--primary">
          {busy ? t('app.profile.saving') : t('app.common.save')}
        </Button>
      </form>
    </section>
  );
}
