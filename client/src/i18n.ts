import i18n from 'i18next';
import i18nBackend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';
import env from './env';

const getCurrentHost = env.REACT_APP_BACKEND_URL;
const savedLanguage = localStorage.getItem('i18nextLng') || 'en_uk';

i18n
  .use(i18nBackend)
  .use(initReactI18next)
  .init({
    debug: true,
    fallbackLng: 'en_uk',
    lng: savedLanguage,
    interpolation: {
      escapeValue: false,
    },
    backend: {
      loadPath: `${getCurrentHost}/i18n/{{lng}}.json`,
    },
  });

// Update localStorage whenever the language changes.
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('i18nextLng', lng);
});

export default i18n;
