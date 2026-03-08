import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import nb from './locales/nb.json';
import en from './locales/en.json';

const STORAGE_KEY = 'dp-lang';
const savedLang = localStorage.getItem(STORAGE_KEY);
const defaultLang = savedLang ?? 'nb';

i18n.use(initReactI18next).init({
  resources: {
    nb: { translation: nb },
    en: { translation: en },
  },
  lng: defaultLang,
  fallbackLng: 'nb',
  interpolation: { escapeValue: false },
});

i18n.on('languageChanged', (lng) => {
  localStorage.setItem(STORAGE_KEY, lng);
  document.documentElement.lang = lng === 'nb' ? 'nb' : 'en';
});

document.documentElement.lang = defaultLang === 'nb' ? 'nb' : 'en';

export default i18n;
