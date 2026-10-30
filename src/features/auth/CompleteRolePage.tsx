import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { type RegistrationRole, useAuth } from '@/state/AuthContext';

function destinationFrom(value: string | null) {
  return value?.startsWith('/') && !value.startsWith('//') ? value : '/dashboard';
}

export function CompleteRolePage() {
  const { t } = useTranslation();
  const {
    user,
    requiresLegalConsent,
    requiresRoleSelection,
    completeRegistrationRole,
    acceptLegalConsent,
  } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [role, setRole] = useState<RegistrationRole>('player');
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const destination = destinationFrom(searchParams.get('next'));
  const joinsByInvitation = destination.startsWith('/unirse/');
  const automaticPlayerRole = useRef(false);

  useEffect(() => {
    if (
      !joinsByInvitation ||
      requiresLegalConsent ||
      !requiresRoleSelection ||
      automaticPlayerRole.current
    )
      return;
    automaticPlayerRole.current = true;
    void completeRegistrationRole('player')
      .then(() => navigate(destination, { replace: true }))
      .catch(() => {
        automaticPlayerRole.current = false;
        setError(t('app.auth.roleSaveFailed'));
      });
  }, [
    completeRegistrationRole,
    destination,
    joinsByInvitation,
    navigate,
    requiresLegalConsent,
    requiresRoleSelection,
    t,
  ]);

  if (!user) return <Navigate to="/login" replace />;
  if (!requiresRoleSelection) return <Navigate to={destination} replace />;
  if (joinsByInvitation && !requiresLegalConsent && !error)
    return (
      <div className="app-loading-note">
        <i />
        <span>{t('app.join.joining')}</span>
      </div>
    );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (requiresLegalConsent && !legalAccepted) {
      setError(t('app.legalConsent.required'));
      return;
    }
    setBusy(true);
    setError('');
    try {
      if (requiresLegalConsent) await acceptLegalConsent();
      await completeRegistrationRole(role);
      navigate(destination, { replace: true });
    } catch {
      setError(t('app.auth.roleSaveFailed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <section className="app-panel">
        <form className="space-y-5" onSubmit={submit}>
          {requiresLegalConsent && (
            <section>
              <h1 className="text-2xl font-black">{t('app.legalConsent.title')}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {t('app.legalConsent.description')}
              </p>
              <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-secondary/40 p-3 text-sm leading-5">
                <input
                  required
                  checked={legalAccepted}
                  onChange={(event) => {
                    setLegalAccepted(event.target.checked);
                    if (event.target.checked) setError('');
                  }}
                  type="checkbox"
                  className="mt-1 size-4 accent-primary"
                />
                <span>
                  {t('app.auth.legalAgreement')}{' '}
                  <Link
                    to="/terms"
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-accent underline"
                  >
                    {t('app.auth.terms')}
                  </Link>
                  {t('app.auth.legalAgreementConnector')}
                  <Link
                    to="/privacy"
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-accent underline"
                  >
                    {t('app.auth.privacy')}
                  </Link>
                  {t('app.auth.legalAgreementSuffix')}
                </span>
              </label>
            </section>
          )}
          <section className={requiresLegalConsent ? 'border-t border-border pt-5' : ''}>
            {requiresLegalConsent ? (
              <h2 className="text-2xl font-black">
                {joinsByInvitation
                  ? t('app.auth.invitationPlayerTitle')
                  : t('app.auth.roleQuestion')}
              </h2>
            ) : (
              <h1 className="text-2xl font-black">
                {joinsByInvitation
                  ? t('app.auth.invitationPlayerTitle')
                  : t('app.auth.roleQuestion')}
              </h1>
            )}
            <p className="mt-2 text-sm text-muted-foreground">
              {joinsByInvitation ? t('app.auth.invitationPlayerHelp') : t('app.auth.roleHelp')}
            </p>
            {joinsByInvitation ? (
              <div className="mt-4 rounded-xl border border-accent bg-accent-soft p-3 text-sm">
                <strong>{t('app.auth.rolePlayer')}</strong>
                <span className="mt-1 block text-muted-foreground">
                  {t('app.auth.rolePlayerDescription')}
                </span>
              </div>
            ) : (
              <fieldset className="mt-4">
                <legend className="sr-only">{t('app.auth.roleQuestion')}</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label
                    className={`cursor-pointer rounded-xl border p-3 text-sm ${role === 'player' ? 'border-accent bg-accent-soft' : 'border-border bg-card'}`}
                  >
                    <input
                      className="sr-only"
                      type="radio"
                      name="role"
                      value="player"
                      checked={role === 'player'}
                      onChange={() => setRole('player')}
                    />
                    <strong>{t('app.auth.rolePlayer')}</strong>
                    <span className="mt-1 block text-muted-foreground">
                      {t('app.auth.rolePlayerDescription')}
                    </span>
                  </label>
                  <label
                    className={`cursor-pointer rounded-xl border p-3 text-sm ${role === 'organizer' ? 'border-accent bg-accent-soft' : 'border-border bg-card'}`}
                  >
                    <input
                      className="sr-only"
                      type="radio"
                      name="role"
                      value="organizer"
                      checked={role === 'organizer'}
                      onChange={() => setRole('organizer')}
                    />
                    <strong>{t('app.auth.roleOrganizer')}</strong>
                    <span className="mt-1 block text-muted-foreground">
                      {t('app.auth.roleOrganizerDescription')}
                    </span>
                  </label>
                </div>
              </fieldset>
            )}
          </section>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button disabled={busy} className="app-button app-button--primary w-full">
            {busy ? t('app.auth.processing') : t('app.auth.continue')}
          </Button>
        </form>
      </section>
    </div>
  );
}
