import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Feedback, AppRating, VisitorSession, AdminFeedback } from '@/types';

export function useAllFeedback() {
  const [feedback, setFeedback] = useState<AdminFeedback[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) {
      setFeedback(data as AdminFeedback[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const updateStatus = useCallback(async (id: string, status: string) => {
    const { error } = await supabase.from('feedback').update({ status }).eq('id', id);
    if (error) throw error;
    setFeedback((prev) => prev.map((f) => (f.id === id ? { ...f, status: status as Feedback['status'] } : f)));
  }, []);

  return { feedback, loading, updateStatus, refetch: fetch };
}

export function useAllRatings() {
  const [ratings, setRatings] = useState<AppRating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('app_ratings')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setRatings(data as AppRating[]);
        setLoading(false);
      });
  }, []);

  const average = ratings.length > 0 ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length : 0;
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: ratings.filter((r) => r.rating === star).length,
  }));

  return { ratings, loading, average, count: ratings.length, distribution };
}

export function useVisitorStats() {
  const [sessions, setSessions] = useState<VisitorSession[]>([]);
  const [stats, setStats] = useState({
    totalVisits: 0,
    uniqueVisitors: 0,
    signedInUsers: 0,
    todayVisits: 0,
    weekVisits: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('visitor_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error || !data) {
        setLoading(false);
        return;
      }
      const all = data as VisitorSession[];
      setSessions(all);

      const uniqueSessionIds = new Set(all.map((s) => s.session_id).filter(Boolean));
      const uniqueUserIds = new Set(all.map((s) => s.user_id).filter(Boolean));
      const now = Date.now();
      const todayStart = new Date(now - 24 * 60 * 60 * 1000).toISOString();
      const weekStart = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

      setStats({
        totalVisits: all.length,
        uniqueVisitors: uniqueSessionIds.size,
        signedInUsers: uniqueUserIds.size,
        todayVisits: all.filter((s) => s.created_at >= todayStart).length,
        weekVisits: all.filter((s) => s.created_at >= weekStart).length,
      });
      setLoading(false);
    }
    load();
  }, []);

  return { sessions, stats, loading };
}

export function useAdminProfiles() {
  const [profiles, setProfiles] = useState<{ id: string; full_name: string; created_at: string; profile_completed: boolean; is_employer: boolean | null }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, full_name, created_at, profile_completed, is_employer')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setProfiles(data);
        setLoading(false);
      });
  }, []);

  return { profiles, loading };
}

const SESSION_ID_KEY = 'jp_session_id';

function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_ID_KEY);
  if (!id) {
    id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(SESSION_ID_KEY, id);
  }
  return id;
}

export function trackVisit(params: {
  userId?: string;
  userEmail?: string;
  userName?: string;
  isSignin?: boolean;
  page?: string;
}) {
  const sessionId = getSessionId();
  supabase.from('visitor_sessions').insert({
    session_id: sessionId,
    user_id: params.userId ?? null,
    user_email: params.userEmail ?? null,
    user_name: params.userName ?? null,
    is_signin: params.isSignin ?? false,
    page: params.page ?? null,
  }).then(({ error }) => {
    if (error) console.warn('Visit tracking failed:', error.message);
  });
}
