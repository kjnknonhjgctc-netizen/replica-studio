import React, { useEffect, useState } from 'react';
import { ThemeContext, type Theme } from './themeState';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('delux_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch {
      // Fallback if localStorage or window is unavailable
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
    // Installed Android chrome gets a consistent dark surface. The page's
    // selected theme remains unchanged; the OS ultimately owns its gesture bar.
    const standalone = window.matchMedia('(display-mode: standalone)');
    const syncSystemAppearance = () => {
      root.style.colorScheme = standalone.matches ? 'dark' : theme;
      const installedColor = getComputedStyle(root).getPropertyValue('--delux-system-background').trim();
      const color = standalone.matches || theme === 'dark'
        ? installedColor
        : '#F7F8FA';
      document.querySelectorAll('meta[name="theme-color"]').forEach(m => {
        m.setAttribute('content', color);
        m.removeAttribute('media');
      });
    };
    syncSystemAppearance();
    standalone.addEventListener('change', syncSystemAppearance);
    try {
      localStorage.setItem('delux_theme', theme);
    } catch {
      // ignore
    }
    return () => standalone.removeEventListener('change', syncSystemAppearance);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === 'dark', toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

