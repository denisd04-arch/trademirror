import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { Profile } from '../types';
import { profileService } from '../services/profileService';

type AuthContextValue = {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  configured: boolean;
  isEmailVerified: boolean;
  isAccountDisabled: boolean;
  signUp: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  updatePassword: (password: string) => Promise<{ error?: string }>;
  updateEmail: (email: string) => Promise<{ error?: string }>;
  resendVerification: () => Promise<{ error?: string }>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const configured = isSupabaseConfigured();

  const loadProfile = useCallback(async (userId: string) => {
    try {
      const data = await profileService.get(userId);
      setProfile(data);
      return data;
    } catch {
      setProfile(null);
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user.id);
  }, [loadProfile, user]);

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        loadProfile(data.session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (nextSession?.user) {
        loadProfile(nextSession.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [configured, loadProfile]);

  const signUp: AuthContextValue['signUp'] = async ({
    email,
    password,
    firstName,
    lastName,
  }) => {
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedFirst || !trimmedLast || !trimmedEmail || !password) {
      return { error: 'First name, last name, email, and password are required' };
    }

    const { error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: { first_name: trimmedFirst, last_name: trimmedLast },
        emailRedirectTo: `${window.location.origin}/verify-email`,
      },
    });
    return error ? { error: error.message } : {};
  };

  const signIn: AuthContextValue['signIn'] = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    if (data.user) {
      const loadedProfile = await loadProfile(data.user.id);
      if (!profileService.isAccountActive(loadedProfile)) {
        await supabase.auth.signOut();
        setProfile(null);
        return { error: 'Your account is currently unavailable. Please contact support.' };
      }
      await profileService.updateLastLogin();
      await loadProfile(data.user.id);
    }
    return {};
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const resetPassword: AuthContextValue['resetPassword'] = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return error ? { error: error.message } : {};
  };

  const updatePassword: AuthContextValue['updatePassword'] = async (password) => {
    const { error } = await supabase.auth.updateUser({ password });
    return error ? { error: error.message } : {};
  };

  const updateEmail: AuthContextValue['updateEmail'] = async (email) => {
    const { error } = await supabase.auth.updateUser({ email });
    return error ? { error: error.message } : {};
  };

  const resendVerification: AuthContextValue['resendVerification'] = async () => {
    if (!user?.email) return { error: 'No email found' };
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email,
      options: { emailRedirectTo: `${window.location.origin}/verify-email` },
    });
    return error ? { error: error.message } : {};
  };

  const isEmailVerified = Boolean(user?.email_confirmed_at ?? profile?.email_verified);
  const isAccountDisabled = Boolean(profile && profile.account_status === 'disabled');

  const value = useMemo(
    () => ({
      user,
      profile,
      session,
      loading,
      configured,
      isEmailVerified,
      isAccountDisabled,
      signUp,
      signIn,
      signOut,
      resetPassword,
      updatePassword,
      updateEmail,
      resendVerification,
      refreshProfile,
    }),
    [
      user,
      profile,
      session,
      loading,
      configured,
      isEmailVerified,
      isAccountDisabled,
      refreshProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
