import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/themeState';

interface ThemeToggleProps {
  variant?: 'icon' | 'segmented' | 'button';
  size?: 'sm' | 'md';
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'icon',
  size = 'md',
  className = '',
  showLabel = false
}) => {
  const { theme, isDark, toggleTheme, setTheme } = useTheme();

  if (variant === 'segmented') {
    return (
      <div
        className={`inline-flex items-center p-1 rounded-xl bg-muted  border border-border  transition-colors select-none ${className}`}
        role="group"
        aria-label="Selecionar tema claro ou escuro"
      >
        <button
          type="button"
          onClick={() => setTheme('light')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            !isDark
              ? 'bg-card text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-muted-foreground'
          }`}
          aria-pressed={!isDark}
        >
          <Sun className="w-3.5 h-3.5 text-warning" />
          <span>Claro</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme('dark')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            isDark
              ? 'bg-feature text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          aria-pressed={isDark}
        >
          <Moon className="w-3.5 h-3.5 text-primary" />
          <span>Escuro</span>
        </button>
      </div>
    );
  }

  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border border-border  bg-card  hover:bg-card  text-foreground  shadow-2xs cursor-pointer ${className}`}
        aria-label={isDark ? 'Alternar para tema claro' : 'Alternar para tema escuro'}
        title={isDark ? 'Alternar para tema claro' : 'Alternar para tema escuro'}
      >
        {isDark ? (
          <>
            <Sun className="w-4 h-4 text-warning animate-spin-once" />
            <span>Tema Claro</span>
          </>
        ) : (
          <>
            <Moon className="w-4 h-4 text-primary" />
            <span>Tema Escuro</span>
          </>
        )}
      </button>
    );
  }

  // Default: Icon button
  const iconSizeClass = size === 'sm' ? 'w-8 h-8' : 'w-9 h-9';
  const iconDim = size === 'sm' ? 'w-4 h-4' : 'w-4.5 h-4.5';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex items-center justify-center rounded-xl border transition-all cursor-pointer active:scale-95 ${iconSizeClass} ${
        isDark
          ? 'bg-feature/90 hover:bg-feature text-warning border-border shadow-xs'
          : 'bg-card hover:bg-muted text-muted-foreground hover:text-foreground border-border/90 shadow-2xs'
      } ${className}`}
      aria-label={isDark ? 'Alternar para tema claro' : 'Alternar para tema escuro'}
      title={isDark ? 'Alternar para tema claro' : 'Alternar para tema escuro'}
    >
      {isDark ? (
        <Sun className={`${iconDim} text-warning transition-transform duration-200 rotate-0 hover:rotate-45`} />
      ) : (
        <Moon className={`${iconDim} text-muted-foreground transition-transform duration-200 hover:-rotate-12`} />
      )}
      {showLabel && (
        <span className="sr-only">{isDark ? 'Tema claro' : 'Tema escuro'}</span>
      )}
    </button>
  );
};
