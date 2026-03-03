'use client';

import React, { useState, useEffect } from 'react';
import { ThemeProvider as SCThemeProvider } from 'styled-components';
import { GlobalStyle } from '../styles/GlobalStyle';
import { lightTheme, darkTheme } from '../styles/theme';
import { useAppStore } from '../stores/appStore';

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = useAppStore((s) => s.theme);
  const [systemDark, setSystemDark] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemDark(mql.matches);

    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const isDark =
    theme === 'dark' || (theme === 'system' && systemDark);

  const resolvedTheme = isDark ? darkTheme : lightTheme;

  useEffect(() => {
    const resolved = isDark ? 'dark' : 'light';
    document.documentElement.style.colorScheme = resolved;
    document.documentElement.setAttribute('data-theme', resolved);
  }, [isDark]);

  return (
    <SCThemeProvider theme={resolvedTheme}>
      <GlobalStyle />
      {children}
    </SCThemeProvider>
  );
}
