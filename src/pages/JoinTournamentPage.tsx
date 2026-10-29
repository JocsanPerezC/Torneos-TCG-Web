import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, ScanLine } from 'lucide-react';
import { joinTournament } from '../data/playerRepository';
import { getUserProfile } from '../lib/userProfile';
import { clearInvitationReturnPath } from '../lib/invitationReturnPath';
import { useAuth } from '../state/AuthContext';
import { Button } from '../components/ui/button';
import { QrScannerModal } from '../components/tournament/QrScannerModal';

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
  const [scannerOpen, setScannerOpen] = useState(false);
  const [joined, setJoined] = useState(false);
  const attemptedToken = useRef<string | undefined>(undefined);
  const joinTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => {
    if (joinTimer.current) window.clearTimeout(joinTimer.current);
  }, []);

  const completeJoin = useCallback(async (invitation: string) => {
    if (!user) return;
    setBusy(true);
    setJoined(false);
    setError(undefined);
    try {
      await joinTournament(invitation, getUserProfile(user).name);
      clearInvitationReturnPath();
      setJoined(true);
      joinTimer.current = window.setTimeout(() => navigate('/dashboard', { replace: true }), 360);
    } catch (reason) {
      clearInvitationReturnPath();
      setError(reason instanceof Error ? reason.message : t('app.join.error'));
    } finally {
      setBusy(false);
    }
  }, [navigate, t, user]);

  const completeScannedJoin = useCallback((value: string) => {
    const invitation = tokenFromInput(value);
    if (!invitation) return;
    setScannerOpen(false);
    void completeJoin(invitation);
  }, [completeJoin]);

  useEffect(() => {
    if (!token || !user || !isPlayer || loading || attemptedToken.current === token) return;
    attemptedToken.current = token;
    void completeJoin(token);
  }, [completeJoin, isPlayer, loading, token, user]);

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
            <Button
              disabled={busy || joined}
              type="submit"
              className={`app-button app-button--primary w-full ${joined ? 'join-submit--success' : ''}`}
            >
              {joined ? (
                <>
                  <Check size={16} aria-hidden />
                  {t('app.join.success')}
                </>
              ) : busy ? t('app.join.joining') : t('app.join.open')}
            </Button>
            {user && isPlayer && (
              <>
                <span className="text-center text-sm text-muted-foreground">{t('app.join.orAlso')}</span>
                <Button
                  type="button"
                  variant="outline"
                  className="app-button app-button--secondary w-full"
                  disabled={busy}
                  onClick={() => setScannerOpen(true)}
                >
                  <ScanLine size={18} aria-hidden />
                  {t('app.join.scanQr')}
                </Button>
              </>
            )}
          </form>
          {scannerOpen && <QrScannerModal onClose={() => setScannerOpen(false)} onScan={completeScannedJoin} />}
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
        ) : joined ? (
          <div className="join-confirmation" role="status">
            <Check size={20} aria-hidden />
            <span>{t('app.join.success')}</span>
          </div>
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
