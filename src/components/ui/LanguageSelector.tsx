import { useTranslation } from 'react-i18next'

export function LanguageSelector() {
  const { i18n, t } = useTranslation()

  return <label className="inline-flex"><span className="sr-only">{t('language.label')}</span><select aria-label={t('language.label')} value={i18n.language} onChange={event => void i18n.changeLanguage(event.target.value)} className="rounded-full border border-border bg-card px-2 py-1.5 text-xs font-bold text-foreground outline-none transition-colors hover:border-primary focus:border-primary"><option value="es">ES</option><option value="en">EN</option></select></label>
}
