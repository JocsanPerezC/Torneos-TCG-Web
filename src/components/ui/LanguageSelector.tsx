import { ChevronDown, Languages } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supportedLanguages } from '../../i18n'

export function LanguageSelector() {
  const { i18n, t } = useTranslation()
  const [open, setOpen] = useState(false)
  const selectorRef = useRef<HTMLDivElement>(null)
  const language = i18n.resolvedLanguage ?? i18n.language

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!selectorRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', closeWithEscape)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', closeWithEscape)
    }
  }, [])

  return <div ref={selectorRef} className="relative inline-flex">
    <button type="button" aria-label={t('language.label')} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(value => !value)} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1.5 text-xs font-bold text-foreground shadow-sm transition-all hover:border-primary hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1">
      <Languages size={15} aria-hidden="true" />
      <span>{language.toUpperCase()}</span>
      <ChevronDown size={14} aria-hidden="true" className={`transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
    {open && <div role="listbox" aria-label={t('language.label')} className="absolute right-0 top-[calc(100%+0.5rem)] z-50 min-w-36 overflow-hidden rounded-2xl border border-border bg-card p-1.5 shadow-xl">
      {supportedLanguages.map(code => <button key={code} type="button" role="option" aria-selected={language === code} onClick={() => { void i18n.changeLanguage(code); setOpen(false) }} className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-semibold transition-colors ${language === code ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-secondary'}`}><span>{t(`language.${code}`)}</span><span className="text-xs opacity-75">{code.toUpperCase()}</span></button>)}
    </div>}
  </div>
}
