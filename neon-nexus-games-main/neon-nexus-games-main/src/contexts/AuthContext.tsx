import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  theme: string;
  sound_enabled: boolean;
  notifications_enabled: boolean;
  coins: number;
  xp: number;
  level: number;
  games_played: number;
  wins: number;
  hours_played: number;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, username?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!error && data) {
        setProfile(data as Profile);
      }
    } catch {
      // Network error fetching profile — silently ignore, profile stays null
    }
  };

  useEffect(() => {
    // Use onAuthStateChange ONLY — it fires immediately with the current session
    // from localStorage, so no need for a separate getSession() call.
    // getSession() + onAuthStateChange together causes a double-fetch and a noticeable delay.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Defer profile fetch with setTimeout to avoid Supabase auth deadlock
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }

        // Mark loading done as soon as we get the first auth state
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (err: unknown) {
      // Catch network-level errors (e.g., "Failed to fetch" / offline / CORS)
      const message =
        err instanceof Error
          ? err.message.includes('fetch')
            ? 'Cannot connect to server. Please check your internet connection and try again.'
            : err.message
          : 'An unexpected error occurred. Please try again.';
      return { error: new Error(message) };
    }
  };

  const signUp = async (email: string, password: string, username?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) return { error };

      // If signup succeeded and username provided, update profile
      if (data.user && username) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ username })
          .eq('user_id', data.user.id);

        // Handle unique constraint violation
        if (profileError?.code === '23505') {
          return { error: new Error('Username already taken') };
        }
        if (profileError) {
          return { error: profileError };
        }
      }

      return { error: null };
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message.includes('fetch')
            ? 'Cannot connect to server. Please check your internet connection and try again.'
            : err.message
          : 'An unexpected error occurred. Please try again.';
      return { error: new Error(message) };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id);

    if (!error) {
      setProfile(prev => prev ? { ...prev, ...updates } : null);
    }

    return { error };
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      loading,
      signUp,
      signIn,
      signOut,
      updateProfile,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
