import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ThemeProvider } from '@/delux/context/ThemeContext';
import { ThemeToggle } from '@/delux/components/common/ThemeToggle';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  document.querySelectorAll('meta[name="theme-color"]').forEach(meta => meta.remove());
});

it('keeps the theme control connected to its provider when toggling', () => {
  localStorage.setItem('delux_theme', 'dark');
  render(<ThemeProvider><ThemeToggle /></ThemeProvider>);
  fireEvent.click(screen.getByRole('button', { name: 'Alternar para tema claro' }));
  expect(localStorage.getItem('delux_theme')).toBe('light');
  expect(document.documentElement.classList.contains('dark')).toBe(false);
  fireEvent.click(screen.getByRole('button', { name: 'Alternar para tema escuro' }));
  expect(localStorage.getItem('delux_theme')).toBe('dark');
  expect(document.documentElement.classList.contains('dark')).toBe(true);
});

it.each([
  ['dark', '#0B0E14'],
  ['light', '#F7F8FA'],
] as const)('requests matching system surfaces for installed %s theme', (theme, color) => {
  vi.spyOn(window, 'matchMedia').mockImplementation(query => ({
    matches: query === '(display-mode: standalone)', media: query,
    onchange: null, addListener() {}, removeListener() {},
    addEventListener() {}, removeEventListener() {}, dispatchEvent: () => true,
  }));
  // jsdom does not load the app stylesheet; supply its theme token here.
  vi.spyOn(window, 'getComputedStyle').mockReturnValue({
    getPropertyValue: () => color,
  } as unknown as CSSStyleDeclaration);
  const meta = document.createElement('meta');
  meta.name = 'theme-color';
  document.head.append(meta);
  localStorage.setItem('delux_theme', theme);
  render(<ThemeProvider><ThemeToggle /></ThemeProvider>);
  expect(meta.content).toBe(color);
  expect(document.documentElement.style.colorScheme).toBe(theme);
});