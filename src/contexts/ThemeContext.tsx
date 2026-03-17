import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

type Theme = 'light' | 'dark' | 'neon';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem('gaming-theme');
    return (stored as Theme) || 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark', 'neon');
    root.classList.add(theme);
    localStorage.setItem('gaming-theme', theme);
  }, [theme]);

  // Sync theme from profile on auth change
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // Defer to avoid deadlock
          setTimeout(async () => {
            const { data } = await supabase
              .from('profiles')
              .select('theme')
              .eq('user_id', session.user.id)
              .single();
            
            if (data?.theme && ['light', 'dark', 'neon'].includes(data.theme)) {
              setThemeState(data.theme as Theme);
            }
          }, 0);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    
    // Persist to database if user is logged in
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('profiles')
        .update({ theme: newTheme })
        .eq('user_id', user.id);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
