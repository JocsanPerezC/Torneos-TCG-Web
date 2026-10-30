import { Settings } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { useAuth } from '@/state/AuthContext';

export function AppSettingsPage() {
  const { t } = useTranslation();
  const { configured, loading, user } = useAuth();

  if (configured && !loading && !user) return <Navigate to="/login" replace />;
  if (loading || !user)
    return (
      <div className="app-loading-note">
        <i />
        <span>{t('app.common.loading')}</span>
      </div>
    );

  return (
    <section className="mx-auto max-w-2xl app-panel">
      <Settings className="text-accent" aria-hidden="true" />
      <h1 className="mt-4 text-3xl">{t('app.settings.title')}</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {t('app.settings.description')}
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-bold">{t('app.settings.language.title')}</h2>
        <LanguageSelector align="start" buttonClassName="min-h-11 px-4 text-sm" />
      </div>
    </section>
  );
}
