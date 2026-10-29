import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { joinTournament } from '../data/playerRepository';
import { getUserProfile } from '../lib/userProfile';
import { clearInvitationReturnPath } from '../lib/invitationReturnPath';
import { useAuth } from '../state/AuthContext';
import { Button } from '../components/ui/button';

function tokenFromInput(value: string) {
  const match = value.trim().match(/\/unirse\/([a-z0-9]+)/i);
  const invitation = match?.[1] ?? value.trim();
  return invitation.length === 6 ? invitation.toUpperCase() : invitation.toLowerCase();
}

export function JoinTournamentPage() {
  const { t } = useTranslation();
  const { token } = useParams();
  const { configured, isPlayer, loading, user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [manualInvitation, setManualInvitation] = useState('');
  const [manualError, setManualError] = useState<string>();
  const attemptedToken = useRef<string | undefined>(undefined);

  const completeJoin = async (invitation: string) => {
    if (!user) return;
    setBusy(true);
    setError(undefined);
    try {
      await joinTournament(invitation, getUserProfile(user).name);
      clearInvitationReturnPath();
      navigate('/dashboard', { replace: true });
    } catch (reason) {
      clearInvitationReturnPath();
      setError(reason instanceof Error ? reason.message : t('app.join.error'));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!token || !user || !isPlayer || loading || attemptedToken.current === token) return;
    attemptedToken.current = token;
    void completeJoin(token);
  }, [isPlayer, loading, token, user]);

  useEffect(() => {
    if (token && user && !loading && !isPlayer) clearInvitationReturnPath();
  }, [isPlayer, loading, token, user]);

  if (!configured) return <Navigate to="/" replace />;
  if (!token) {
    const submitToken = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const nextToken = tokenFromInput(manualInvitation);
      if (!nextToken) {
        setManualError(t('app.messages.required'));
        return;
      }
      if (user && isPlayer) {
        void completeJoin(nextToken);
        return;
      }
      navigate(`/unirse/${nextToken}`);
    };
    return (
      <section className="mx-auto max-w-md">
        <div className="app-panel">
          <h1 className="m-0 text-3xl">{t('app.join.title')}</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {t('app.join.manualDescription')}
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {t('app.join.validationHelp')}
          </p>
          <form className="join-tournament-form mt-5" noValidate onSubmit={submitToken}>
            <label className="text-sm font-semibold">
              {t('app.join.code')}
              <input
                name="token"
                className="app-field"
                placeholder={t('app.join.codePlaceholder')}
                value={manualInvitation}
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                aria-invalid={Boolean(manualError)}
                aria-describedby={manualError ? 'manual-invitation-error' : undefined}
                onChange={(event) => {
                  setManualInvitation(event.target.value);
                  setManualError(undefined);
                }}
              />
            </label>
            {manualError && (
              <p id="manual-invitation-error" role="alert" className="text-sm text-red-300">
                {manualError}
              </p>
            )}
            {error && (
              <p role="alert" className="text-sm text-red-300">
                {error}
              </p>
            )}
            <Button disabled={busy} type="submit" className="app-button app-button--primary w-full">
              {busy ? t('app.join.joining') : t('app.join.open')}
            </Button>
          </form>
        </div>
      </section>
    );
  }
  if (!user && !loading) return <Navigate to={`/login?next=/unirse/${token}`} replace />;
  if (!loading && !isPlayer)
    return (
      <section className="mx-auto max-w-md">
        <div className="app-panel">
          <h1 className="m-0 text-3xl">{t('app.join.playerOnlyTitle')}</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {t('app.join.playerOnlyDescription')}
          </p>
          <Button asChild className="app-button app-button--secondary mt-5">
            <Link to="/dashboard">{t('app.join.back')}</Link>
          </Button>
        </div>
      </section>
    );
  if (loading || !user)
    return (
      <div className="app-loading-note">
        <i />
        <span>{t('app.common.loading')}</span>
      </div>
    );

  return (
    <section className="mx-auto max-w-md">
      <div className="app-panel">
        <h1 className="m-0 text-3xl">{t('app.join.title')}</h1>
        {error ? (
          <>
            <p role="alert" className="mt-3 text-sm leading-6 text-red-300">
              {error}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {t('app.join.validationHelp')}
            </p>
            <Button asChild className="app-button app-button--secondary mt-5">
              <Link to="/unirse">{t('app.join.tryAnother')}</Link>
            </Button>
          </>
        ) : (
          <div className="app-loading-note mt-5">
            <i />
            <span>{t('app.join.joining')}</span>
          </div>
        )}
      </div>
    </section>
  );
}
