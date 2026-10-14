import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Profile, UserRole } from '../types/database.types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  role: UserRole | null;
  isLoading: boolean;
  isSuperAdmin: boolean;
  isWebsiteAdmin: boolean;
  isEventManager: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | Error | null }>;
  refreshProfile: () => Promise<void>;
  devSignIn: (role?: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = useCallback(async (userId: string) => {
    if (!isSupabaseConfigured) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[SIGN Auth] Failed to load profile:', error.message);
        return;
      }
      setProfile(data as Profile);
    } catch (err) {
      console.error('[SIGN Auth] Unexpected error fetching profile:', err);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Restore local demo session if available
      try {
        const stored = localStorage.getItem('sign_dev_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.user && parsed.profile) {
            setUser(parsed.user);
            setProfile(parsed.profile);
          }
        }
      } catch (err) {
        console.error('[SIGN Dev Auth] Failed to restore demo session:', err);
      }
      setIsLoading(false);
      return;
    }

    // Initial session retrieval
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    // Listen to auth state transitions
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        await fetchProfile(newSession.user.id);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return {
        error: new Error(
          'Supabase credentials are not yet configured. Please populate VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
        ),
      };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    if (!isSupabaseConfigured) {
      return {
        error: new Error(
          'Supabase credentials are not yet configured. Please populate VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
        ),
      };
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    return { error };
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    try {
      localStorage.removeItem('sign_dev_user');
    } catch {
      // Ignore in environments without localStorage
    }
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  const devSignIn = (selectedRole: UserRole = 'super_admin') => {
    const roleDetails: Record<UserRole, { name: string; title: string; email: string }> = {
      super_admin: {
        name: 'Dr. Fawad Ali',
        title: 'Chairman & Executive Super Admin',
        email: 'fawad.sgth@gmail.com',
      },
      website_admin: {
        name: 'Adil Khan',
        title: 'Founding President & Website Admin',
        email: 'adilmusawir@gmail.com',
      },
      event_manager: {
        name: 'Saleem Jan',
        title: 'General Secretary & Event Manager',
        email: 'sj3463586@gmail.com',
      },
      member: {
        name: 'Irshad Ahmad',
        title: 'Media & Communication Head',
        email: 'irshadahmad.access@gmail.com',
      },
    };

    const details = roleDetails[selectedRole];
    const mockUser: User = {
      id: `dev-${selectedRole}-id`,
      app_metadata: { provider: 'email' },
      user_metadata: { full_name: details.name },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email: details.email,
      phone: '',
      role: 'authenticated',
      updated_at: new Date().toISOString(),
    };

    const mockProfile: Profile = {
      id: `dev-${selectedRole}-id`,
      email: details.email,
      full_name: `${details.name} (${details.title})`,
      role: selectedRole,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setUser(mockUser);
    setProfile(mockProfile);

    try {
      localStorage.setItem(
        'sign_dev_user',
        JSON.stringify({ user: mockUser, profile: mockProfile })
      );
    } catch (err) {
      console.error('[SIGN Dev Auth] Failed to save demo session to localStorage:', err);
    }
  };

  const resetPassword = async (email: string) => {
    if (!isSupabaseConfigured) {
      return {
        error: new Error('Supabase credentials are not configured yet in .env.'),
      };
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  };

  const role: UserRole | null = profile?.role ?? (user ? 'member' : null);
  const isSuperAdmin = role === 'super_admin';
  const isWebsiteAdmin = role === 'website_admin' || isSuperAdmin;
  const isEventManager = role === 'event_manager' || isSuperAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        role,
        isLoading,
        isSuperAdmin,
        isWebsiteAdmin,
        isEventManager,
        isConfigured: isSupabaseConfigured,
        signIn,
        signUp,
        signOut,
        resetPassword,
        refreshProfile,
        devSignIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
