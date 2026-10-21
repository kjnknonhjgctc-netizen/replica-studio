import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { ThemeProvider } from '@/delux/context/ThemeContext';
import { ThemeToggle } from '@/delux/components/common/ThemeToggle';

afterEach(cleanup);

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