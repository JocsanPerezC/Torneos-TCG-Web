import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Copy, Link2, QrCode, RefreshCw, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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

function appBaseUrl() {
  const configuredUrl = import.meta.env.VITE_PUBLIC_APP_URL?.trim();
  if (!configuredUrl) return window.location.origin;

  try {
    return new URL(configuredUrl).toString().replace(/\/$/, '');
  } catch {
    return window.location.origin;
  }
}

export function TournamentJoinLink({ tournamentId }: { tournamentId: string }) {
  const { t } = useTranslation();
  const [token, setToken] = useState<string>();
  const [code, setCode] = useState<string>();
  const [qrCode, setQrCode] = useState<{ token: string; source: string }>();
  const [message, setMessage] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);

  const joinUrl = token ? new URL(`/unirse/${token}`, appBaseUrl()).toString() : undefined;
  const currentQrCode = qrCode && qrCode.token === token ? qrCode.source : undefined;

  useEffect(() => {
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
  }, [t, tournamentId]);

  useEffect(() => {
    let active = true;
    if (!joinUrl) return;
    void QRCode.toDataURL(joinUrl, {
      width: 256,
      margin: 1,
      color: { dark: '#111111', light: '#FFFDF7' },
    })
      .then((image) => {
        if (active && token) setQrCode({ token, source: image });
      })
      .catch((error) => {
        if (active) setMessage(errorMessage(error, t('app.joinLink.qrFailed')));
      });
    return () => {
      active = false;
    };
  }, [joinUrl, token]);

  const create = async () => {
    setBusy(true);
    setMessage(undefined);
    try {
      const nextToken = await createTournamentJoinLink(tournamentId);
      const nextCode = await loadTournamentJoinCode(tournamentId);
      setToken(nextToken);
      setCode(nextCode);
      setMessage(t('app.joinLink.created'));
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
    setBusy(true);
    setMessage(undefined);
    try {
      await revokeTournamentJoinLink(tournamentId);
      setToken(undefined);
      setCode(undefined);
      setMessage(t('app.joinLink.revoked'));
    } catch (error) {
      setMessage(errorMessage(error, t('app.joinLink.revokeFailed')));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="app-panel mt-6" aria-labelledby="join-link-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="join-link-title" className="m-0 text-xl">
            {t('app.joinLink.title')}
          </h2>
          <p className="mb-0 mt-2 text-sm leading-6 text-muted-foreground">
            {t('app.joinLink.description')}
          </p>
        </div>
        <QrCode className="text-accent" aria-hidden="true" />
      </div>

      {loading ? (
        <div className="app-loading-note mt-5">
          <i />
          <span>{t('app.common.loading')}</span>
        </div>
      ) : joinUrl ? (
        <div className="mt-5 grid gap-5 sm:grid-cols-[auto_minmax(0,1fr)]">
          {currentQrCode && (
            <img
              className="w-40 rounded-xl border border-border bg-card p-2"
              src={currentQrCode}
              alt={t('app.joinLink.qrAlt')}
            />
          )}
          <div>
            <label className="text-sm font-semibold">
              {t('app.joinLink.url')}
              <input readOnly value={joinUrl} className="app-field text-xs" />
            </label>
            <label className="mt-3 block text-sm font-semibold">
              {t('app.joinLink.code')}
              <input readOnly value={code ?? ''} className="app-field font-mono text-xs" />
            </label>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                type="button"
                className="app-button app-button--primary"
                onClick={() => void copy(joinUrl, t('app.joinLink.copied'))}
              >
                <Copy size={16} aria-hidden="true" />
                {t('app.joinLink.copy')}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="app-button app-button--secondary"
                disabled={!code}
                onClick={() => void copy(code, t('app.joinLink.codeCopied'))}
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
                className="app-button app-button--danger"
                disabled={busy}
                onClick={() => setRevokeOpen(true)}
              >
                <Trash2 size={16} aria-hidden="true" />
                {t('app.joinLink.revoke')}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          className="app-button app-button--primary mt-5"
          disabled={busy}
          onClick={() => void create()}
        >
          <Link2 size={16} aria-hidden="true" />
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
    </section>
  );
}
