import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Ticket } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  joinTournament,
  loadJoinableTournament,
  type JoinableTournament,
} from '../data/playerRepository';
import { getUserProfile } from '../lib/userProfile';
import { useAuth } from '../state/AuthContext';
import { Button } from '../components/ui/button';

function tokenFromInput(value: string) {
  const match = value.trim().match(/\/unirse\/([a-z0-9]+)/i);
  return match?.[1] ?? value.trim();
}

export function JoinTournamentPage() {
  const { t } = useTranslation();
  const { token } = useParams();
  const { configured, isPlayer, loading, user } = useAuth();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<JoinableTournament>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    if (!token || !user || !isPlayer) return;
    void loadJoinableTournament(token)
      .then((item) => {
        if (active) setTournament(item);
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : t('app.join.error'));
      });
    return () => {
      active = false;
    };
  }, [isPlayer, t, token, user]);

  if (!configured) return <Navigate to="/" replace />;
  if (!token) {
    const submitToken = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const nextToken = tokenFromInput(String(new FormData(event.currentTarget).get('token')));
      if (nextToken) navigate(`/unirse/${nextToken}`);
    };
    return (
      <section className="mx-auto max-w-md">
        <div className="app-panel">
          <h1 className="m-0 text-3xl">{t('app.join.title')}</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {t('app.join.manualDescription')}
          </p>
          <form className="mt-5 space-y-4" onSubmit={submitToken}>
            <label className="text-sm font-semibold">
              {t('app.join.code')}
              <input
                required
                name="token"
                className="app-field"
                placeholder={t('app.join.codePlaceholder')}
              />
            </label>
            <Button className="app-button app-button--primary w-full">{t('app.join.open')}</Button>
          </form>
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

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      await joinTournament(token, String(new FormData(event.currentTarget).get('name')));
      navigate('/dashboard', { replace: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('app.join.error'));
    } finally {
      setBusy(false);
    }
  };

  if (!tournament && !error)
    return (
      <div className="app-loading-note">
        <i />
        <span>{t('app.common.loading')}</span>
      </div>
    );
  if (!tournament)
    return (
      <section className="mx-auto max-w-md">
        <div className="app-panel">
          <h1 className="m-0 text-3xl">{t('app.join.unavailableTitle')}</h1>
          <p role="alert" className="mt-3 text-sm leading-6 text-muted-foreground">
            {error ?? t('app.join.unavailableDescription')}
          </p>
        </div>
      </section>
    );

  const { name } = getUserProfile(user);
  return (
    <section className="mx-auto max-w-md">
      <div className="app-panel">
        <Ticket className="text-accent" aria-hidden="true" />
        <h1 className="mt-4 text-3xl">{tournament.name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('app.join.tournamentDetails', {
            format: tournament.format,
            slots: tournament.availableSlots,
          })}
        </p>
        <form className="mt-5 space-y-4" onSubmit={submit}>
          <label className="text-sm font-semibold">
            {t('app.join.playerName')}
            <input required name="name" defaultValue={name} className="app-field" />
          </label>
          {error && (
            <p role="alert" className="text-sm text-red-300">
              {error}
            </p>
          )}
          <Button
            disabled={busy || tournament.availableSlots <= 0}
            className="app-button app-button--primary w-full"
          >
            {busy ? t('app.auth.processing') : t('app.join.confirm')}
          </Button>
        </form>
      </div>
    </section>
  );
}
