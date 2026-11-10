import React, { createContext, useContext, useState, useMemo } from 'react';
import { TRANSLATIONS } from './translations';

const LanguageContext = createContext({
  language: 'en',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (path) => path,
  isHindi: false,
});

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en');

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'hi' : 'en'));
  };

  const t = useMemo(() => {
    return (path, fallback = '') => {
      if (!path) return fallback;
      const keys = path.split('.');
      let current = TRANSLATIONS[language];
      for (const key of keys) {
        if (current && current[key] !== undefined) {
          current = current[key];
        } else {
          // Fallback to English if translation is missing
          let enCurrent = TRANSLATIONS.en;
          for (const enKey of keys) {
            if (enCurrent && enCurrent[enKey] !== undefined) {
              enCurrent = enCurrent[enKey];
            } else {
              return fallback || path;
            }
          }
          return enCurrent || fallback || path;
        }
      }
      return current || fallback || path;
    };
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage,
      t,
      isHindi: language === 'hi',
    }),
    [language, t]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
