import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en } from '@/i18n/en';
import { es } from '@/i18n/es';

export const supportedLanguages = ['es', 'en'] as const;

const resources = {
  es: { translation: es },
  en: { translation: en },
};

const initialLanguage =
  typeof window === 'undefined'
    ? 'es'
    : (localStorage.getItem('torneos-tcg.language') ??
      (navigator.language.startsWith('en') ? 'en' : 'es'));

void i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage,
  fallbackLng: 'es',
  interpolation: { escapeValue: false },
});

i18n.on('languageChanged', (language) => localStorage.setItem('torneos-tcg.language', language));

export default i18n;
