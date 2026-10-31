import { normalizeNickname } from '@/lib/userProfile';

export type AuthScreen = 'login' | 'register' | 'recovery';
export type AuthField =
  'name' | 'nickname' | 'email' | 'password' | 'confirmPassword' | 'legalConsent' | 'form';
/** Clave de i18n del mensaje de cada campo con error. */
export type AuthErrors = Partial<Record<AuthField, string>>;

export type AuthValues = {
  name?: string;
  nickname?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  legalConsent?: boolean;
};

export const PASSWORD_MIN_LENGTH = 6;
export const PASSWORD_MAX_LENGTH = 128;
export const NAME_MAX_LENGTH = 80;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Revisa los campos visibles de cada pantalla y devuelve qué está mal en cada uno. */
export function validateAuth(screen: AuthScreen, values: AuthValues): AuthErrors {
  const errors: AuthErrors = {};
  const email = values.email?.trim() ?? '';
  if (!email) errors.email = 'app.auth.errors.required';
  else if (!EMAIL_PATTERN.test(email)) errors.email = 'app.auth.errors.emailInvalid';
  if (screen === 'recovery') return errors;

  const password = values.password ?? '';
  if (!password) errors.password = 'app.auth.errors.required';
  if (screen === 'login') return errors;

  const name = values.name?.trim() ?? '';
  if (!name) errors.name = 'app.auth.errors.required';
  else if (name.length > NAME_MAX_LENGTH) errors.name = 'app.auth.errors.nameTooLong';

  if (!values.nickname?.trim()) errors.nickname = 'app.auth.errors.required';
  else if (!normalizeNickname(values.nickname)) errors.nickname = 'app.auth.nicknameInvalid';

  if (password && password.length < PASSWORD_MIN_LENGTH)
    errors.password = 'app.auth.errors.passwordShort';
  else if (password.length > PASSWORD_MAX_LENGTH) errors.password = 'app.auth.errors.passwordLong';

  if (!values.confirmPassword) errors.confirmPassword = 'app.auth.errors.required';
  else if (values.confirmPassword !== password)
    errors.confirmPassword = 'app.auth.passwordsMismatch';

  if (!values.legalConsent) errors.legalConsent = 'app.auth.legalConsentRequired';
  return errors;
}

/** Traduce los errores de Supabase Auth al campo y mensaje que entiende el usuario. */
export function authErrorFromServer(error: unknown): AuthErrors {
  const code = (error as { code?: string } | null)?.code ?? '';
  const message = error instanceof Error ? error.message : '';
  if (code === 'invalid_credentials' || /invalid login credentials/i.test(message))
    return { form: 'app.auth.errors.invalidCredentials' };
  if (
    code === 'user_already_exists' ||
    code === 'email_exists' ||
    /already registered/i.test(message)
  )
    return { email: 'app.auth.errors.emailTaken' };
  if (code === 'weak_password') return { password: 'app.auth.errors.passwordShort' };
  if (code === 'email_address_invalid') return { email: 'app.auth.errors.emailInvalid' };
  if (code.startsWith('over_') || /rate limit|for security purposes/i.test(message))
    return { form: 'app.auth.errors.tooManyAttempts' };
  if (code === 'email_not_confirmed') return { form: 'app.auth.errors.emailNotConfirmed' };
  return {};
}
