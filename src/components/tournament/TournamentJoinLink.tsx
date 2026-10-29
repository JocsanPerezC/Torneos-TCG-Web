import { useEffect, useRef, useState } from 'react';
import { Copy, QrCode, RefreshCw, Ticket, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import * as QRCode from 'qrcode';
import {
  createTournamentJoinLink,
  loadTournamentJoinCode,
  loadTournamentJoinLink,
  revokeTournamentJoinLink,
} from '../../data/playerRepository';
import { Button } from '../ui/button';
import { Modal } from '../ui/modal';

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }
  return fallback;
}

function invitationUrl(token: string) {
  try {
    const configuredOrigin = import.meta.env.VITE_PUBLIC_APP_URL?.trim();
    const origin = configuredOrigin ? new URL(configuredOrigin).origin : window.location.origin;
    return new URL(`/unirse/${token}`, origin).toString();
  } catch {
    return new URL(`/unirse/${token}`, window.location.origin).toString();
  }
}

/** `preview` solo se usa en el muestrario: muestra un enlace de ejemplo sin consultar Supabase. */
export function TournamentJoinLink({
  tournamentId,
  preview,
}: {
  tournamentId: string;
  preview?: { token: string; code: string };
}) {
  const { t } = useTranslation();
  const [token, setToken] = useState<string | undefined>(preview?.token);
  const [code, setCode] = useState<string | undefined>(preview?.code);
  const [message, setMessage] = useState<string>();
  const [loading, setLoading] = useState(!preview);
  const [busy, setBusy] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [invitationOpen, setInvitationOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>();
  const [qrError, setQrError] = useState(false);
  const [inviteFeedback, setInviteFeedback] = useState<'created' | 'revoked'>();
  const inviteFeedbackTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => {
    if (inviteFeedbackTimer.current) window.clearTimeout(inviteFeedbackTimer.current);
  }, []);

  const showInviteFeedback = (feedback: 'created' | 'revoked') => {
    setInviteFeedback(feedback);
    if (inviteFeedbackTimer.current) window.clearTimeout(inviteFeedbackTimer.current);
    inviteFeedbackTimer.current = window.setTimeout(() => setInviteFeedback(undefined), 320);
  };

  useEffect(() => {
    if (preview) return;
    let active = true;
    void Promise.all([loadTournamentJoinLink(tournamentId), loadTournamentJoinCode(tournamentId)])
      .then(([nextToken, nextCode]) => {
        if (!active) return;
        setToken(nextToken);
        setCode(nextCode);
      })
      .catch((error) => {
        if (active) setMessage(errorMessage(error, t('app.joinLink.loadFailed')));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [preview, t, tournamentId]);

  useEffect(() => {
    if (!invitationOpen || !token) {
      setQrDataUrl(undefined);
      setQrError(false);
      return;
    }

    let active = true;
    const url = invitationUrl(token);
    setQrDataUrl(undefined);
    setQrError(false);
    void QRCode.toDataURL(url, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 560,
      color: { dark: '#111111', light: '#fffdf7' },
    })
      .then((nextQrDataUrl) => {
        if (active) setQrDataUrl(nextQrDataUrl);
      })
      .catch(() => {
        if (active) setQrError(true);
      });

    return () => {
      active = false;
    };
  }, [invitationOpen, token]);

  const create = async () => {
    if (preview) return;
    setBusy(true);
    setMessage(undefined);
    try {
      const nextToken = await createTournamentJoinLink(tournamentId);
      const nextCode = await loadTournamentJoinCode(tournamentId);
      setToken(nextToken);
      setCode(nextCode);
      setInvitationOpen(Boolean(nextCode));
      setMessage(t('app.joinLink.created'));
      showInviteFeedback('created');
    } catch (error) {
      setMessage(errorMessage(error, t('app.joinLink.createFailed')));
    } finally {
      setBusy(false);
    }
  };

  const copy = async (value: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setMessage(successMessage);
    } catch {
      setMessage(t('app.joinLink.copyFailed'));
    }
  };

  const revoke = async () => {
    setRevokeOpen(false);
    if (preview) return;
    setBusy(true);
    setMessage(undefined);
    try {
      await revokeTournamentJoinLink(tournamentId);
      setToken(undefined);
      setCode(undefined);
      setInvitationOpen(false);
      setMessage(t('app.joinLink.revoked'));
      showInviteFeedback('revoked');
    } catch (error) {
      setMessage(errorMessage(error, t('app.joinLink.revokeFailed')));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      className={`app-panel mt-6 ${inviteFeedback ? `join-link--${inviteFeedback}` : ''}`}
      aria-labelledby="join-link-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="join-link-title" className="m-0 text-xl">
            {t('app.joinLink.title')}
          </h2>
          <p className="mb-0 mt-2 text-sm leading-6 text-muted-foreground">
            {t('app.joinLink.description')}
          </p>
        </div>
        <Ticket className="text-accent" aria-hidden="true" />
      </div>

      {loading ? (
        <div className="app-loading-note mt-5">
          <i />
          <span>{t('app.common.loading')}</span>
        </div>
      ) : token ? (
        <div className={`mt-5 ${inviteFeedback === 'created' ? 'join-link-code--created' : ''}`}>
          <label className="text-sm font-semibold">
            {t('app.joinLink.code')}
            <input readOnly value={code ?? ''} className="app-field font-mono text-xs" />
          </label>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              type="button"
              className="app-button app-button--primary"
              disabled={!code}
              onClick={() => {
                if (code) void copy(code, t('app.joinLink.codeCopied'));
              }}
            >
              <Copy size={16} aria-hidden="true" />
              {t('app.joinLink.copyCode')}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="app-button app-button--secondary"
              disabled={busy}
              onClick={() => void create()}
            >
              <RefreshCw size={16} aria-hidden="true" />
              {t('app.joinLink.rotate')}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="app-button app-button--secondary"
              onClick={() => setInvitationOpen(true)}
            >
              <QrCode size={16} aria-hidden="true" />
              {t('app.joinLink.showCode')}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="app-button app-button--danger"
              disabled={busy}
              onClick={() => setRevokeOpen(true)}
            >
              <Trash2 size={16} aria-hidden="true" />
              {t('app.joinLink.revoke')}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          className="app-button app-button--primary mt-5"
          disabled={busy}
          onClick={() => void create()}
        >
          <Ticket size={16} aria-hidden="true" />
          {t('app.joinLink.create')}
        </Button>
      )}
      {message && (
        <p role="status" className="mb-0 mt-4 text-sm font-semibold text-muted-foreground">
          {message}
        </p>
      )}
      {revokeOpen && (
        <Modal
          title={t('app.joinLink.revoke')}
          description={t('app.joinLink.revokeConfirm')}
          onClose={() => setRevokeOpen(false)}
        >
          <div className="flex flex-wrap justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              className="app-button app-button--secondary"
              disabled={busy}
              onClick={() => setRevokeOpen(false)}
            >
              {t('app.common.cancel')}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="app-button app-button--danger"
              disabled={busy}
              onClick={() => void revoke()}
            >
              <Trash2 size={16} aria-hidden="true" />
              {t('app.joinLink.revoke')}
            </Button>
          </div>
        </Modal>
      )}
      {invitationOpen && token && code && (
        <Modal
          title={t('app.joinLink.code')}
          description={t('app.joinLink.displayDescription')}
          dialogClassName="invite-code-display"
          onClose={() => setInvitationOpen(false)}
        >
          <div className={`invite-code-display__content ${inviteFeedback === 'created' ? 'invite-code-display__content--created' : ''}`}>
            <div className="invite-code-display__code">
              <strong>{code}</strong>
            </div>
            <div className="invite-code-display__qr">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt={t('app.joinLink.qrAlt')} />
              ) : qrError ? (
                <p role="alert">{t('app.joinLink.qrFailed')}</p>
              ) : (
                <div className="app-loading-note">
                  <i />
                  <span>{t('app.common.loading')}</span>
                </div>
              )}
              {!qrError && <p>{t('app.joinLink.scanQr')}</p>}
            </div>
          </div>
          <div className="invite-code-display__actions">
            <Button
              type="button"
              className="app-button app-button--primary"
              onClick={() => void copy(code, t('app.joinLink.codeCopied'))}
            >
              <Copy size={16} aria-hidden="true" />
              {t('app.joinLink.copyCode')}
            </Button>
          </div>
        </Modal>
      )}
    </section>
  );
}
