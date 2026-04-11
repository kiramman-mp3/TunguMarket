import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

const STORAGE_KEY = 'tungu_accessibility';

const defaultSettings = {
  darkMode: false,
  highContrast: false,
  boldText: false,
};

export const ThemeProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  // Aplicar clases al root <html> cada vez que cambian los settings
  useEffect(() => {
    const root = document.documentElement;

    root.classList.toggle('dark-mode', settings.darkMode);
    root.classList.toggle('high-contrast', settings.highContrast);
    root.classList.toggle('bold-text', settings.boldText);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const toggleDarkMode = () => setSettings(prev => ({ ...prev, darkMode: !prev.darkMode }));
  const toggleHighContrast = () => setSettings(prev => ({ ...prev, highContrast: !prev.highContrast }));
  const toggleBoldText = () => setSettings(prev => ({ ...prev, boldText: !prev.boldText }));

  const resetAll = () => setSettings(defaultSettings);

  return (
    <ThemeContext.Provider value={{
      ...settings,
      toggleDarkMode,
      toggleHighContrast,
      toggleBoldText,
      resetAll,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme debe usarse dentro de ThemeProvider');
  return context;
};
