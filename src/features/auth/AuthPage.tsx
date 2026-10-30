import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '@/state/AuthContext';
import { invitationReturnPath, savedInvitationReturnPath } from '@/lib/invitationReturnPath';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GoogleAuthButton } from '@/features/auth/components/GoogleAuthButton';
import { Notice } from '@/components/feedback/Notice';
import i18n from '@/i18n';
import { currentLegalConsent } from '@/legal';

import { Layout } from '@/components/layout/Layout';
import { field, panel, primary } from '@/components/ui/classes';

export function Auth({ screen }: { screen: 'login' | 'register' | 'recovery' }) {
  const { configured, user, signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [legalError, setLegalError] = useState('');
  const recovery = screen === 'recovery';
  const register = screen === 'register';
  const title = i18n.t(`app.auth.${screen}`);
  const requestedPath = searchParams.get('next');
  const returnPath =
    invitationReturnPath(requestedPath) ?? savedInvitationReturnPath() ?? '/dashboard';

  useEffect(() => {
    if (register && user) navigate(returnPath, { replace: true });
  }, [register, returnPath, user, navigate]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get('email')).trim();
    const password = String(data.get('password'));
    if (register && !legalAccepted) {
      setLegalError(i18n.t('app.auth.legalConsentRequired'));
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      if (recovery) {
        await resetPassword(email);
        setMessage(i18n.t('app.auth.recoverySent'));
      } else if (register) {
        const name = String(data.get('name')).trim();
        if (password !== String(data.get('confirmPassword')))
          throw new Error(i18n.t('app.auth.passwordsMismatch'));
        await signUp(name, email, password, currentLegalConsent);
        navigate(returnPath, { replace: true });
      } else {
        await signIn(email, password);
        navigate(returnPath);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : i18n.t('app.auth.operationFailed'));
    } finally {
      setBusy(false);
    }
  }

  const passwordField = (name: string, label: string) => (
    <label className="block text-sm font-medium">
      {label}
      <span className="relative mt-1 block">
        <input
          required
          name={name}
          minLength={6}
          type={showPassword ? 'text' : 'password'}
          className={`${field} mt-0 pr-12`}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={
            showPassword ? i18n.t('app.auth.hidePassword') : i18n.t('app.auth.showPassword')
          }
          title={showPassword ? i18n.t('app.auth.hidePassword') : i18n.t('app.auth.showPassword')}
          className="absolute inset-y-0 right-0 w-11 text-muted-foreground hover:text-accent"
          onClick={() => setShowPassword((value) => !value)}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </Button>
      </span>
    </label>
  );
  const consent = (
    <fieldset className="rounded-2xl border border-border bg-secondary/40 p-3">
      <legend className="sr-only">{i18n.t('app.legalConsent.title')}</legend>
      <label className="flex cursor-pointer items-start gap-3 text-sm leading-5 text-foreground">
        <input
          required
          name="legalConsent"
          checked={legalAccepted}
          onChange={(event) => {
            setLegalAccepted(event.target.checked);
            if (event.target.checked) setLegalError('');
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
      {legalError && (
        <p role="alert" className="mt-2 text-sm text-red-300">
          {legalError}
        </p>
      )}
    </fieldset>
  );
  return (
    <Layout>
      <div className="mx-auto max-w-md">
        <div className={panel}>
          <h1 className="text-2xl font-black">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {configured ? '' : i18n.t('app.auth.localMode')}
          </p>
          {message && (
            <div className="mt-4">
              <Notice error={!message.includes(i18n.t('app.auth.recoverySent'))}>{message}</Notice>
            </div>
          )}
          <form className="mt-5 space-y-4" onSubmit={submit}>
            {register && (
              <label className="block text-sm font-medium">
                {i18n.t('app.common.name')}
                <input
                  required
                  name="name"
                  autoComplete="name"
                  className={field}
                  placeholder={i18n.t('app.auth.yourName')}
                />
              </label>
            )}
            <label className="block text-sm font-medium">
              {i18n.t('app.common.email')}
              <input
                required
                name="email"
                type="email"
                autoComplete="email"
                className={field}
                placeholder={i18n.t('app.auth.emailPlaceholder')}
              />
            </label>
            {!recovery && (
              <>
                {passwordField('password', i18n.t('app.common.password'))}
                {register && passwordField('confirmPassword', i18n.t('app.auth.confirmPassword'))}
              </>
            )}
            {register && consent}
            <Button disabled={busy} className={`${primary} w-full`}>
              {busy
                ? i18n.t('app.auth.processing')
                : recovery
                  ? i18n.t('app.auth.sendInstructions')
                  : i18n.t('app.auth.continue')}
            </Button>
          </form>
          {!recovery && (
            <GoogleAuthButton
              requiresConsent={register}
              consentAccepted={legalAccepted}
              redirectPath={returnPath}
              onConsentRequired={() => setLegalError(i18n.t('app.auth.legalConsentRequired'))}
            />
          )}
          <div className="mt-5 text-center">
            <Link
              className="text-sm text-accent underline"
              to={`${screen === 'login' ? '/register' : '/login'}?next=${encodeURIComponent(returnPath)}`}
            >
              {screen === 'login' ? i18n.t('app.auth.noAccount') : i18n.t('app.auth.backToLogin')}
            </Link>
          </div>
          {!recovery && (
            <Button asChild type="button" variant="outline" className="mt-3 w-full">
              <Link to="/forgot-password">{i18n.t('app.auth.forgotPassword')}</Link>
            </Button>
          )}
        </div>
      </div>
    </Layout>
  );
}
export function ConfirmedAccount() {
  const { user, loading } = useAuth();
  return (
    <Layout>
      <div className="mx-auto max-w-md text-center">
        <section className={panel}>
          <span className="text-4xl">✓</span>
          <h1 className="mt-3 text-2xl font-black">
            {loading
              ? i18n.t('app.auth.confirming')
              : user
                ? i18n.t('app.auth.confirmed')
                : i18n.t('app.auth.reviewConfirmation')}
          </h1>
          <p className="mt-3 text-muted-foreground">
            {user
              ? i18n.t('app.auth.confirmedDescription')
              : i18n.t('app.auth.confirmationDescription')}
          </p>
          {user && (
            <Button type="button" className={`${primary} mt-5`} onClick={() => window.close()}>
              {i18n.t('app.auth.closeTab')}
            </Button>
          )}
        </section>
      </div>
    </Layout>
  );
}
