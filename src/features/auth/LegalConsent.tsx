import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useState, type FormEvent } from 'react';
import { useAuth } from '@/state/AuthContext';
import { invitationReturnPath } from '@/lib/invitationReturnPath';
import { Button } from '@/components/ui/button';
import i18n from '@/i18n';

import { Layout } from '@/components/layout/Layout';
import { panel, primary } from '@/components/ui/classes';

export function LegalConsent() {
  const { user, requiresLegalConsent, acceptLegalConsent } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const destination = invitationReturnPath(searchParams.get('next')) ?? '/dashboard';
  if (!user || !requiresLegalConsent) return <Navigate to={destination} replace />;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accepted) return setError(i18n.t('app.legalConsent.required'));
    setBusy(true);
    try {
      await acceptLegalConsent();
      navigate(destination, { replace: true });
    } catch {
      setError(i18n.t('app.legalConsent.saveFailed'));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Layout>
      <div className="mx-auto max-w-md">
        <section className={`${panel} space-y-4`}>
          <h1 className="text-2xl font-black">{i18n.t('app.legalConsent.title')}</h1>
          <p className="text-sm text-muted-foreground">{i18n.t('app.legalConsent.description')}</p>
          <form onSubmit={submit} className="space-y-4">
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-secondary/40 p-3 text-sm leading-5">
              <input
                required
                checked={accepted}
                onChange={(event) => {
                  setAccepted(event.target.checked);
                  if (event.target.checked) setError('');
                }}
                type="checkbox"
                className="mt-1 size-4 accent-primary"
              />
              <span>
                {i18n.t('app.auth.legalAgreement')}{' '}
                <Link
                  to="/terms"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-accent underline"
                >
                  {i18n.t('app.auth.terms')}
                </Link>
                {i18n.t('app.auth.legalAgreementConnector')}
                <Link
                  to="/privacy"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-accent underline"
                >
                  {i18n.t('app.auth.privacy')}
                </Link>
                {i18n.t('app.auth.legalAgreementSuffix')}
              </span>
            </label>
            {error && (
              <p role="alert" className="text-sm text-red-300">
                {error}
              </p>
            )}
            <Button disabled={busy} className={`${primary} w-full`}>
              {busy ? i18n.t('app.legalConsent.saving') : i18n.t('app.auth.continue')}
            </Button>
          </form>
        </section>
      </div>
    </Layout>
  );
}
