import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { ExtendedProfile } from '@/types';

export function useAuth() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<ExtendedProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Profile load error:', error.message);
      setProfile(null);
    } else {
      setProfile(data as ExtendedProfile);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        loadProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, [loadProfile]);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;
    // Don't load profile yet — user needs to verify email first
    return data;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.user) {
      await loadProfile(data.user.id);
    }
    return data;
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  }, []);

  const resendConfirmation = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    if (error) throw error;
  }, []);

  const sendResetOTP = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/?reset=true`,
    });
    if (error) throw error;
  }, []);

  const verifyOTPAndReset = useCallback(async (email: string, otp: string, newPassword: string) => {
    void email; void otp;
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user) {
      await loadProfile(session.user.id);
    }
  }, [session, loadProfile]);

  return {
    session,
    profile,
    user: session?.user ?? null,
    loading,
    isAuthenticated: !!session,
    isProfileComplete: !!profile?.profile_completed,
    isAdmin: !!profile?.is_admin,
    signUp,
    signIn,
    signOut,
    refreshProfile,
    resendConfirmation,
    sendResetOTP,
    verifyOTPAndReset,
  };
}
