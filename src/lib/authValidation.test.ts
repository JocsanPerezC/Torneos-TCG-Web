import { describe, expect, it } from 'vitest';
import { authErrorFromServer, validateAuth } from '@/lib/authValidation';

const validRegistration = {
  name: 'Jocsan Pérez',
  nickname: 'Jocsan',
  email: 'jocsan@gmail.com',
  password: 'secreta1',
  confirmPassword: 'secreta1',
  legalConsent: true,
};

describe('validateAuth', () => {
  it('acepta un registro completo', () => {
    expect(validateAuth('register', validRegistration)).toEqual({});
  });

  it('señala cada campo del registro con su propio motivo', () => {
    expect(
      validateAuth('register', {
        name: ' ',
        nickname: 'J',
        email: 'jocsan@gmail',
        password: '123',
        confirmPassword: '124',
        legalConsent: false,
      }),
    ).toEqual({
      name: 'app.auth.errors.required',
      nickname: 'app.auth.nicknameInvalid',
      email: 'app.auth.errors.emailInvalid',
      password: 'app.auth.errors.passwordShort',
      confirmPassword: 'app.auth.passwordsMismatch',
      legalConsent: 'app.auth.legalConsentRequired',
    });
  });

  it('en el inicio de sesión no exige el largo mínimo de la contraseña', () => {
    expect(validateAuth('login', { email: 'a@b.co', password: '1' })).toEqual({});
    expect(validateAuth('login', { email: '', password: '' })).toEqual({
      email: 'app.auth.errors.required',
      password: 'app.auth.errors.required',
    });
  });

  it('la recuperación solo revisa el correo', () => {
    expect(validateAuth('recovery', { email: 'nombre' })).toEqual({
      email: 'app.auth.errors.emailInvalid',
    });
  });
});

describe('authErrorFromServer', () => {
  it('lleva cada error de Supabase a su campo', () => {
    expect(authErrorFromServer({ code: 'invalid_credentials' })).toEqual({
      form: 'app.auth.errors.invalidCredentials',
    });
    expect(authErrorFromServer({ code: 'user_already_exists' })).toEqual({
      email: 'app.auth.errors.emailTaken',
    });
    expect(authErrorFromServer({ code: 'over_email_send_rate_limit' })).toEqual({
      form: 'app.auth.errors.tooManyAttempts',
    });
    expect(authErrorFromServer(new Error('algo raro'))).toEqual({});
  });
});
