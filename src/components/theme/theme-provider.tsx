'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { themes, type Theme } from '@/lib/themes';
import { UserProfile } from '@/lib/types';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';

interface ThemeContextType {
  theme: Theme;
  setTheme: (themeName: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user, firestore } = useFirebase();
  const [currentThemeName, setCurrentThemeName] = useState<string>('default');

  const userProfileRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  useEffect(() => {
    if (userProfile?.theme && themes[userProfile.theme]) {
      setCurrentThemeName(userProfile.theme);
    } else {
      setCurrentThemeName('default');
    }
  }, [userProfile]);

  const theme = useMemo(() => themes[currentThemeName] || themes.default, [currentThemeName]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove(...Object.values(themes).map(t => t.name));
    root.classList.add(theme.name);

    const applyColors = (mode: 'light' | 'dark') => {
      const colors = theme.colors[mode];
      const prefix = mode === 'dark' ? '.dark' : ':root';
      
      let styleString = `${prefix} {\n`;
      for (const [key, value] of Object.entries(colors)) {
        if(value) {
          styleString += `  --${key}: ${value};\n`;
        }
      }
      styleString += '}\n';
      return styleString;
    }

    const styleTag = document.createElement('style');
    styleTag.id = 'dynamic-theme-styles';
    styleTag.innerHTML = applyColors('light') + applyColors('dark');
    
    document.head.querySelector('#dynamic-theme-styles')?.remove();
    document.head.appendChild(styleTag);
    
    return () => {
      if (styleTag.parentNode) {
        styleTag.parentNode.removeChild(styleTag);
      }
    }

  }, [theme]);

  const handleSetTheme = (themeName: string) => {
    if (themes[themeName]) {
      setCurrentThemeName(themeName);
      if (userProfileRef) {
        // Non-blocking update for better UX
        setDocumentNonBlocking(userProfileRef, { theme: themeName }, { merge: true });
      }
    }
  };

  const value = {
    theme,
    setTheme: handleSetTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
