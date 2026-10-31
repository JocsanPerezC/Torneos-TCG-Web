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
      <h1 className="flex items-center gap-3 text-3xl">
        <Settings className="size-7 shrink-0 text-accent" aria-hidden="true" />
        {t('app.settings.title')}
      </h1>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-bold">{t('app.settings.language.title')}</h2>
        <LanguageSelector align="start" buttonClassName="min-h-11 px-4 text-sm" />
      </div>
    </section>
  );
}
