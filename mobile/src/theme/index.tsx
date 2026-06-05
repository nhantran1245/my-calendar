/**
 * Cadence theme context for React Native.
 *
 * Wraps the app with ThemeProvider and exposes useTheme().
 * Follows the OS color scheme by default; can be overridden.
 *
 * Usage:
 *   // In _layout.tsx:
 *   <ThemeProvider><Stack /></ThemeProvider>
 *
 *   // In any component:
 *   const { colors, isDark, toggleTheme } = useTheme();
 *   style={{ backgroundColor: colors.bgPage }}
 */

import React, { createContext, useContext, useState } from 'react';
import { useColorScheme } from 'react-native';
import { colors as themeColors } from './tokens';

export type { CalendarCategory } from './tokens';
export { colors, spacing, radii, fonts, textStyles, duration, calendarColors, palette } from './tokens';

// ─── Context ──────────────────────────────────────────────────

interface ThemeContextValue {
  isDark: boolean;
  colors: typeof themeColors.light;
  toggleTheme: () => void;
  setTheme: (mode: 'light' | 'dark' | 'system') => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [override, setOverride] = useState<'light' | 'dark' | 'system'>('system');

  const resolvedDark =
    override === 'system' ? systemScheme === 'dark' : override === 'dark';

  const [manualDark, setManualDark] = useState(resolvedDark);
  const isDark = override === 'system' ? resolvedDark : manualDark;

  const value: ThemeContextValue = {
    isDark,
    colors: isDark ? themeColors.dark : themeColors.light,
    toggleTheme: () => {
      const next = !isDark;
      setManualDark(next);
      setOverride(next ? 'dark' : 'light');
    },
    setTheme: (mode) => {
      setOverride(mode);
      if (mode !== 'system') setManualDark(mode === 'dark');
    },
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
