import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { GoogleAuthButton } from '../../components/auth/GoogleAuthButton';
import { useAuth } from '../../state/AuthContext';
import { currentLegalConsent } from '../../legal';
import { field, Layout, Notice, panel, primary } from './shared';

export function Auth({ title }: { title: string }) {
  const { configured, user, signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const recovery = title === 'Recupera tu contraseña';
  const register = title === 'Crea tu cuenta';
  useEffect(() => {
    if (register && user) navigate('/dashboard', { replace: true });
  }, [register, user, navigate]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get('email')).trim();
    const password = String(data.get('password'));
    setBusy(true);
    setMessage('');
    try {
      if (recovery) {
        await resetPassword(email);
        setMessage('Revisa tu correo para continuar con la recuperación.');
      } else if (register) {
        const name = String(data.get('name')).trim();
        if (password !== String(data.get('confirmPassword')))
          throw new Error('Las contraseñas no coinciden.');
        await signUp(name, email, password, currentLegalConsent);
        /* setMessage('Cuenta creada. Revisa tu correo para confirmar tu cuenta; esta pestaña entrará al panel automáticamente.'); // Restaurar al reactivar Confirm email en Supabase. */ navigate(
          '/dashboard',
          { replace: true },
        );
      } else {
        await signIn(email, password);
        navigate('/dashboard');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo completar la operación.');
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
        <button
          type="button"
          aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-slate-400 hover:text-amber-300"
          onClick={() => setShowPassword((value) => !value)}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </span>
    </label>
  );
  return (
    <Layout>
      <div className="mx-auto max-w-md">
        <div className={panel}>
          <h1 className="text-2xl font-black">{title}</h1>
          <p className="mt-2 text-sm text-slate-300">
            {configured
              ? ''
              : 'Configura Supabase para activar el acceso real; el modo demo no requiere cuenta.'}
          </p>
          {message && (
            <div className="mt-4">
              <Notice error={!message.includes('Revisa') && !message.includes('creada')}>
                {message}
              </Notice>
            </div>
          )}
          <form className="mt-5 space-y-4" onSubmit={submit}>
            {register && (
              <label className="block text-sm font-medium">
                Nombre
                <input
                  required
                  name="name"
                  autoComplete="name"
                  className={field}
                  placeholder="Tu nombre"
                />
              </label>
            )}
            <label className="block text-sm font-medium">
              Correo
              <input
                required
                name="email"
                type="email"
                autoComplete="email"
                className={field}
                placeholder="correo@gmail.com"
              />
            </label>
            {!recovery && (
              <>
                {passwordField('password', 'Contraseña')}
                {register && passwordField('confirmPassword', 'Confirmar contraseña')}
              </>
            )}
            <button disabled={busy} className={`${primary} w-full`}>
              {busy ? 'Procesando…' : recovery ? 'Enviar instrucciones' : 'Continuar'}
            </button>
          </form>
          {!recovery && <GoogleAuthButton />}
          <Link
            className="mt-5 block text-center text-sm text-amber-300 underline"
            to={title === 'Inicia sesión' ? '/register' : '/login'}
          >
            {title === 'Inicia sesión'
              ? '¿No tienes cuenta? Regístrate'
              : 'Volver al inicio de sesión'}
          </Link>
          {!recovery && (
            <Link
              className="mx-auto mt-3 inline-flex w-full justify-center rounded-lg border border-slate-500 px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800"
              to="/forgot-password"
            >
              Olvidé mi contraseña
            </Link>
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
              ? 'Confirmando tu cuenta…'
              : user
                ? '¡Cuenta confirmada!'
                : 'Revisa la confirmación'}
          </h1>
          <p className="mt-3 text-slate-300">
            {user
              ? 'Ya puedes cerrar esta pestaña y volver a la ventana original. Entrarás al panel automáticamente.'
              : 'Estamos validando el enlace. Espera un momento o vuelve a abrir el enlace del correo.'}
          </p>
          {user && (
            <button type="button" className={`${primary} mt-5`} onClick={() => window.close()}>
              Cerrar pestaña
            </button>
          )}
        </section>
      </div>
    </Layout>
  );
}
