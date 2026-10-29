import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ScanLine } from 'lucide-react';
import QrScanner from 'qr-scanner';
import { joinTournament } from '../data/playerRepository';
import { getUserProfile } from '../lib/userProfile';
import { clearInvitationReturnPath } from '../lib/invitationReturnPath';
import { useAuth } from '../state/AuthContext';
import { Button } from '../components/ui/button';
import { Modal } from '../components/ui/modal';

function tokenFromInput(value: string) {
  const match = value.trim().match(/\/unirse\/([a-z0-9]+)/i);
  const invitation = match?.[1] ?? value.trim();
  return invitation.length === 6 ? invitation.toUpperCase() : invitation.toLowerCase();
}

function QrScannerModal({ onClose, onScan }: { onClose: () => void; onScan: (value: string) => void }) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraError, setCameraError] = useState<string>();

  useEffect(() => {
    let scanned = false;
    if (!videoRef.current) return;
    const scanner = new QrScanner(
      videoRef.current,
      (result) => {
        if (scanned) return;
        scanned = true;
        onScan(result.data);
      },
      {
        maxScansPerSecond: 8,
        onDecodeError: () => undefined,
        preferredCamera: 'environment',
        returnDetailedScanResult: true,
      },
    );
    void scanner.start().catch(() => setCameraError(t('app.join.cameraUnavailable')));
    return () => scanner.destroy();
  }, [onScan, t]);

  return (
    <Modal
      title={t('app.join.scanQrTitle')}
      description={t('app.join.scanQrDescription')}
      onClose={onClose}
    >
      {cameraError ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
          {cameraError}
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border-2 border-border bg-black">
          <video ref={videoRef} className="aspect-square w-full object-cover" muted playsInline />
        </div>
      )}
      {!cameraError && <p className="mt-3 text-center text-sm text-muted-foreground">{t('app.join.scanningQr')}</p>}
      <div className="mt-5 flex justify-end">
        <Button type="button" variant="outline" className="app-button app-button--secondary" onClick={onClose}>
          {t('app.common.cancel')}
        </Button>
      </div>
    </Modal>
  );
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
  const attemptedToken = useRef<string | undefined>(undefined);

  const completeJoin = useCallback(async (invitation: string) => {
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
            <Button disabled={busy} type="submit" className="app-button app-button--primary w-full">
              {busy ? t('app.join.joining') : t('app.join.open')}
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
