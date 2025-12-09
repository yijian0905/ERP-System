import { useEffect } from 'react';

import {
  accentColorValues,
  fontSizeScale,
  useAppearance,
} from '@/stores/settings';

/**
 * ThemeProvider applies appearance settings to the document in real-time
 * It handles:
 * - Light/Dark/System theme
 * - Accent color (primary color)
 * - Font size scaling
 * - Compact mode
 * - Animations toggle
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, accentColor, fontSize, compactMode, animations } = useAppearance();

  // Apply theme (light/dark)
  useEffect(() => {
    const root = window.document.documentElement;

    // Remove existing theme classes
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      // Check system preference
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }

    // Listen for system theme changes when using 'system'
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        root.classList.remove('light', 'dark');
        root.classList.add(e.matches ? 'dark' : 'light');
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    
    return undefined;
  }, [theme]);

  // Apply accent color
  useEffect(() => {
    const root = window.document.documentElement;
    const colorValue = accentColorValues[accentColor];

    // Update CSS custom properties for primary color
    const primaryHsl = `${colorValue.hue} ${colorValue.sat}% ${colorValue.light}%`;
    root.style.setProperty('--primary', primaryHsl);
    root.style.setProperty('--ring', primaryHsl);
    root.style.setProperty('--sidebar-primary', primaryHsl);
    root.style.setProperty('--sidebar-ring', primaryHsl);

    // For dark mode, we need slightly different values
    const isDark = root.classList.contains('dark');
    if (isDark) {
      // Lighter version for dark mode
      const darkPrimaryHsl = `${colorValue.hue} ${Math.min(colorValue.sat + 8, 100)}% ${Math.min(colorValue.light + 7, 70)}%`;
      root.style.setProperty('--primary', darkPrimaryHsl);
    }
  }, [accentColor, theme]);

  // Apply font size
  useEffect(() => {
    const root = window.document.documentElement;
    const scale = fontSizeScale[fontSize];
    
    // Set base font size (default is 16px)
    root.style.fontSize = `${scale * 16}px`;
  }, [fontSize]);

  // Apply compact mode
  useEffect(() => {
    const root = window.document.documentElement;
    
    if (compactMode) {
      root.classList.add('compact');
      // Reduce spacing
      root.style.setProperty('--spacing-scale', '0.875');
    } else {
      root.classList.remove('compact');
      root.style.removeProperty('--spacing-scale');
    }
  }, [compactMode]);

  // Apply animations toggle
  useEffect(() => {
    const root = window.document.documentElement;
    
    if (!animations) {
      root.classList.add('reduce-motion');
      root.style.setProperty('--transition-duration', '0ms');
    } else {
      root.classList.remove('reduce-motion');
      root.style.removeProperty('--transition-duration');
    }
  }, [animations]);

  return <>{children}</>;
}

/**
 * Hook to get the effective theme (resolved system theme)
 */
export function useEffectiveTheme(): 'light' | 'dark' {
  const { theme } = useAppearance();
  
  if (theme === 'system') {
    return typeof window !== 'undefined' && 
           window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  
  return theme;
}
