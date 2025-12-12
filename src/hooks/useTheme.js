import { useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'bindicator:theme';

export function useTheme() {
  const getPreferred = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {}
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  };

  const [theme, setTheme] = useState(getPreferred());

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
    try { localStorage.setItem(STORAGE_KEY, theme); } catch {}
  }, [theme]);

  const toggleTheme = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);

  return { theme, isDark: theme === 'dark', toggleTheme };
}

