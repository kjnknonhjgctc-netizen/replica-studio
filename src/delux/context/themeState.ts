import { createContext, useContext } from 'react';

export type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

// Preserve identity during hot updates: mounted providers and consumers must
// never hold different context objects while the preview updates.
export const ThemeContext =
  (import.meta.hot?.data['themeContext'] as React.Context<ThemeContextType | undefined> | undefined)
  ?? createContext<ThemeContextType | undefined>(undefined);

if (import.meta.hot) {
  import.meta.hot.data['themeContext'] = ThemeContext;
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}