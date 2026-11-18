import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useAuth } from '@/state/AuthContext';
import { invitationReturnPath, savedInvitationReturnPath } from '@/lib/invitationReturnPath';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GoogleAuthButton } from '@/features/auth/components/GoogleAuthButton';
import {
  TurnstileCaptcha,
  type TurnstileCaptchaHandle,
} from '@/features/auth/components/TurnstileCaptcha';
import { Notice } from '@/components/feedback/Notice';
import i18n from '@/i18n';
import { currentLegalConsent } from '@/lib/legal';
import { NICKNAME_MAX_LENGTH, normalizeNickname } from '@/lib/userProfile';
import {
  authErrorFromServer,
  NAME_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  validateAuth,
  type AuthErrors,
  type AuthField,
  type AuthValues,
} from '@/lib/authValidation';

import { Layout } from '@/components/layout/Layout';
import { field, panel, primary } from '@/components/ui/classes';

const FIELD_ORDER: AuthField[] = [
  'name',
  'nickname',
  'email',
  'password',
  'confirmPassword',
  'legalConsent',
];
const recoveryRequestKey = 'torneos-tcg.password-recovery.request';
const recoveryOpenedKey = 'torneos-tcg.password-recovery.opened';
const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim();

function readValues(form: HTMLFormElement): AuthValues {
  const data = new FormData(form);
  const text = (name: string) => (data.has(name) ? String(data.get(name)) : undefined);
  return {
    name: text('name'),
    nickname: text('nickname'),
    email: text('email'),
    password: text('password'),
    confirmPassword: text('confirmPassword'),
    legalConsent: data.get('legalConsent') === 'on',
  };
}

function FieldError({ name, errors }: { name: AuthField; errors: AuthErrors }) {
  const key = errors[name];
  return key ? (
    <p id={`${name}-error`} className="app-field-error">
      {i18n.t(key)}
    </p>
  ) : null;
}

export function Auth({ screen }: { screen: 'login' | 'register' | 'recovery' | 'reset' }) {
  const {
    configured,
    loading,
    user,
    signIn,
    signUp,
    resetPassword,
    updatePassword,
    isNicknameAvailable,
  } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);
  const captchaRef = useRef<TurnstileCaptchaHandle>(null);
  const [notice, setNotice] = useState('');
  const [errors, setErrors] = useState<AuthErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const [recoveryRequestId, setRecoveryRequestId] = useState('');
  const [recoveryOpened, setRecoveryOpened] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const recovery = screen === 'recovery';
  const reset = screen === 'reset';
  const register = screen === 'register';
  const title = i18n.t(`app.auth.${screen}`);
  const requestedPath = searchParams.get('next');
  const returnPath =
    invitationReturnPath(requestedPath) ?? savedInvitationReturnPath() ?? '/dashboard';

  useEffect(() => {
    if (register && user) navigate(returnPath, { replace: true });
  }, [register, returnPath, user, navigate]);

  useEffect(() => {
    if (!passwordUpdated) return;
    const timer = window.setTimeout(() => navigate('/dashboard', { replace: true }), 1200);
    return () => window.clearTimeout(timer);
  }, [navigate, passwordUpdated]);

  useEffect(() => {
    if (!reset || !user) return;
    const requestId = localStorage.getItem(recoveryRequestKey);
    if (requestId) localStorage.setItem(recoveryOpenedKey, requestId);
  }, [reset, user]);

  useEffect(() => {
    if (!recovery || !recoveryRequestId) return;
    const markOpened = (requestId: string | null) => {
      if (requestId === recoveryRequestId) setRecoveryOpened(true);
    };
    markOpened(localStorage.getItem(recoveryOpenedKey));
    const onStorage = (event: StorageEvent) => {
      if (event.key === recoveryOpenedKey) markOpened(event.newValue);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [recovery, recoveryRequestId]);

  // La misma pantalla sirve para entrar, registrarse y recuperar: al cambiar, empieza limpia.
  const [currentScreen, setCurrentScreen] = useState(screen);
  if (currentScreen !== screen) {
    setCurrentScreen(screen);
    setErrors({});
    setSubmitted(false);
    setNotice('');
    setCaptchaToken('');
  }

  const showErrors = (next: AuthErrors) => {
    setErrors(next);
    const first = FIELD_ORDER.find((name) => next[name]);
    if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  };

  // Tras el primer intento, cada campo se revisa al escribir o salir de él.
  const recheck = (target: EventTarget) => {
    const name = (target as HTMLInputElement).name as AuthField;
    if (!formRef.current || !FIELD_ORDER.includes(name)) return;
    const value = (target as HTMLInputElement).value;
    if (!submitted && !errors[name] && !value) return;
    const next = validateAuth(screen, readValues(formRef.current));
    setErrors((current) => {
      const updated = { ...current, [name]: next[name], form: undefined };
      if (name === 'password' && current.confirmPassword)
        updated.confirmPassword = next.confirmPassword;
      return updated;
    });
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = readValues(event.currentTarget);
    setSubmitted(true);
    setNotice('');
    const found = validateAuth(screen, values);
    if (Object.keys(found).length) {
      showErrors(found);
      return;
    }
    setErrors({});
    if (turnstileSiteKey && !captchaToken) {
      showErrors({ form: 'app.auth.errors.captchaRequired' });
      return;
    }
    setBusy(true);
    const email = values.email?.trim() ?? '';
    try {
      if (recovery) {
        await resetPassword(email, captchaToken || undefined);
        const requestId = `${Date.now()}-${Math.random()}`;
        localStorage.setItem(recoveryRequestKey, requestId);
        localStorage.removeItem(recoveryOpenedKey);
        setRecoveryRequestId(requestId);
        setNotice(i18n.t('app.auth.recoverySent'));
      } else if (reset) {
        await updatePassword(values.password!);
        setPasswordUpdated(true);
      } else if (register) {
        const nickname = normalizeNickname(values.nickname!)!;
        const nicknameFree = await isNicknameAvailable(nickname);
        const taken: AuthErrors = nicknameFree ? {} : { nickname: 'app.auth.nicknameTaken' };
        if (Object.keys(taken).length) {
          showErrors(taken);
          return;
        }
        await signUp(
          values.name!.trim(),
          nickname,
          email,
          values.password!,
          currentLegalConsent,
          captchaToken || undefined,
        );
        navigate(returnPath, { replace: true });
      } else {
        await signIn(email, values.password!, captchaToken || undefined);
        navigate(returnPath);
      }
    } catch (error) {
      const mapped = authErrorFromServer(error, { concealAccountExistence: register });
      showErrors(
        Object.keys(mapped).length
          ? mapped
          : {
              form:
                error instanceof Error && error.message
                  ? error.message
                  : 'app.auth.operationFailed',
            },
      );
    } finally {
      setBusy(false);
      if (turnstileSiteKey) {
        setCaptchaToken('');
        captchaRef.current?.reset();
      }
    }
  }

  const invalid = (name: AuthField) =>
    errors[name]
      ? { 'aria-invalid': true as const, 'aria-describedby': `${name}-error` }
      : { 'aria-invalid': false as const };

  const labelled = (name: AuthField, label: string, input: ReactNode, help?: ReactNode) => (
    <div>
      <label className="block text-sm font-medium">
        {label}
        {input}
      </label>
      {help}
      <FieldError name={name} errors={errors} />
    </div>
  );

  const passwordField = (name: 'password' | 'confirmPassword', label: string) =>
    labelled(
      name,
      label,
      <span className="relative mt-[0.4rem] block">
        <input
          name={name}
          maxLength={PASSWORD_MAX_LENGTH}
          type={showPassword ? 'text' : 'password'}
          autoComplete={register || reset ? 'new-password' : 'current-password'}
          className={`${field} pr-12`}
          // El margen de .app-field va en el contenedor para que el ojo quede centrado.
          style={{ marginTop: 0 }}
          {...invalid(name)}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={
            showPassword ? i18n.t('app.auth.hidePassword') : i18n.t('app.auth.showPassword')
          }
          title={showPassword ? i18n.t('app.auth.hidePassword') : i18n.t('app.auth.showPassword')}
          className="absolute inset-y-0 right-0 h-auto w-11 px-0 text-muted-foreground hover:text-accent hover:shadow-none motion-safe:hover:translate-y-0"
          onClick={() => setShowPassword((value) => !value)}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </Button>
      </span>,
    );

  const consent = (
    <fieldset
      className={`rounded-2xl border p-3 ${errors.legalConsent ? 'border-danger-text bg-secondary/40' : 'border-border bg-secondary/40'}`}
    >
      <legend className="sr-only">{i18n.t('app.legalConsent.title')}</legend>
      <label className="flex cursor-pointer items-start gap-3 text-sm leading-5 text-foreground">
        <input
          name="legalConsent"
          checked={legalAccepted}
          onChange={(event) => {
            setLegalAccepted(event.target.checked);
            if (event.target.checked)
              setErrors((current) => ({ ...current, legalConsent: undefined }));
          }}
          type="checkbox"
          className="mt-1 size-4 accent-primary"
          {...invalid('legalConsent')}
        />
        <span>
          {i18n.t('app.auth.legalAgreement')}{' '}
          <Link to="/terms" target="_blank" rel="noreferrer" className="app-text-link">
            {i18n.t('app.auth.terms')}
          </Link>
          {i18n.t('app.auth.legalAgreementConnector')}
          <Link to="/privacy" target="_blank" rel="noreferrer" className="app-text-link">
            {i18n.t('app.auth.privacy')}
          </Link>
          {i18n.t('app.auth.legalAgreementSuffix')}
        </span>
      </label>
      <FieldError name="legalConsent" errors={errors} />
    </fieldset>
  );

  if (passwordUpdated) {
    return (
      <Layout showHeader={false} hideNavigation>
        <div className="mx-auto max-w-md text-center">
          <section className={panel}>
            <span className="text-4xl">✓</span>
            <h1 className="mt-3 text-2xl font-black">{i18n.t('app.auth.passwordReset')}</h1>
            <p className="mt-3 text-muted-foreground">
              {i18n.t('app.auth.passwordResetDescription')}
            </p>
          </section>
        </div>
      </Layout>
    );
  }

  if (recoveryOpened) {
    return (
      <Layout showHeader={false} hideNavigation>
        <div className="mx-auto max-w-md text-center">
          <section className={panel}>
            <span className="text-4xl">✓</span>
            <h1 className="mt-3 text-2xl font-black">{i18n.t('app.auth.recoveryLinkOpened')}</h1>
            <p className="mt-3 text-muted-foreground">
              {i18n.t('app.auth.recoveryLinkOpenedDescription')}
            </p>
            <Button
              type="button"
              className={`${primary} mt-5 w-full`}
              onClick={() => window.close()}
            >
              {i18n.t('app.auth.closeTab')}
            </Button>
            <p className="mt-3 text-sm text-muted-foreground">{i18n.t('app.auth.closeTabHelp')}</p>
          </section>
        </div>
      </Layout>
    );
  }

  if (reset && configured && !loading && !user) {
    return (
      <Layout showHeader={false} hideNavigation>
        <div className="mx-auto max-w-md">
          <section className={panel}>
            <h1 className="text-2xl font-black">{title}</h1>
            <p className="mt-3 text-muted-foreground">{i18n.t('app.auth.invalidResetLink')}</p>
            <Button asChild className={`${primary} mt-5 w-full`}>
              <Link to="/forgot-password">{i18n.t('app.auth.requestNewLink')}</Link>
            </Button>
          </section>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showHeader={!recovery && !reset} hideNavigation={recovery || reset}>
      <div className="mx-auto max-w-md">
        <div className={panel}>
          <h1 className="text-2xl font-black">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {reset
              ? i18n.t('app.auth.resetPasswordDescription')
              : configured
                ? ''
                : i18n.t('app.auth.localMode')}
          </p>
          {(notice || errors.form) && (
            <div className="mt-4" role="alert">
              <Notice error={!notice}>{notice || i18n.t(errors.form!)}</Notice>
            </div>
          )}
          <form
            ref={formRef}
            className="mt-5 space-y-4"
            noValidate
            onSubmit={submit}
            onBlur={(event) => recheck(event.target)}
            onInput={(event) => recheck(event.target)}
          >
            {register &&
              labelled(
                'name',
                i18n.t('app.common.name'),
                <input
                  name="name"
                  autoComplete="name"
                  maxLength={NAME_MAX_LENGTH}
                  className={field}
                  placeholder={i18n.t('app.auth.yourName')}
                  {...invalid('name')}
                />,
              )}
            {register &&
              labelled(
                'nickname',
                i18n.t('app.common.nickname'),
                <input
                  name="nickname"
                  autoComplete="off"
                  maxLength={NICKNAME_MAX_LENGTH}
                  className={field}
                  placeholder={i18n.t('app.auth.yourNickname')}
                  {...invalid('nickname')}
                  aria-describedby={
                    errors.nickname ? 'nickname-error nickname-help' : 'nickname-help'
                  }
                />,
                <span id="nickname-help" className="mt-1 block text-xs text-muted-foreground">
                  {i18n.t('app.auth.nicknameHelp')}
                </span>,
              )}
            {!reset &&
              labelled(
                'email',
                i18n.t('app.common.email'),
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  className={field}
                  placeholder={i18n.t('app.auth.emailPlaceholder')}
                  {...invalid('email')}
                />,
              )}
            {!recovery && (
              <>
                {passwordField(
                  'password',
                  reset ? i18n.t('app.auth.newPassword') : i18n.t('app.common.password'),
                )}
                {screen === 'login' && (
                  <div className="-mt-2 flex justify-end">
                    <Link
                      to="/forgot-password"
                      className="text-sm font-semibold text-accent underline-offset-4 hover:underline focus-visible:underline"
                    >
                      {i18n.t('app.auth.forgotPassword')}
                    </Link>
                  </div>
                )}
                {(register || reset) &&
                  passwordField('confirmPassword', i18n.t('app.auth.confirmPassword'))}
              </>
            )}
            {register && consent}
            {turnstileSiteKey && (
              <TurnstileCaptcha
                ref={captchaRef}
                siteKey={turnstileSiteKey}
                onSuccess={(token) => {
                  setCaptchaToken(token);
                  setErrors((current) => ({ ...current, form: undefined }));
                }}
                onExpired={() => setCaptchaToken('')}
                onError={() => {
                  setCaptchaToken('');
                  setErrors((current) => ({ ...current, form: 'app.auth.errors.captchaFailed' }));
                }}
              />
            )}
            <Button disabled={busy} className={`${primary} w-full`}>
              {busy
                ? i18n.t('app.auth.processing')
                : recovery
                  ? i18n.t('app.auth.sendInstructions')
                  : reset
                    ? i18n.t('app.auth.updatePassword')
                    : i18n.t('app.auth.continue')}
            </Button>
          </form>
          {!recovery && !reset && (
            <GoogleAuthButton
              requiresConsent={register}
              consentAccepted={legalAccepted}
              redirectPath={returnPath}
              onConsentRequired={() =>
                showErrors({ ...errors, legalConsent: 'app.auth.legalConsentRequired' })
              }
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
