import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Feedback, FeedbackCategory, AppRating } from '@/types';

export function useUserFeedback() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setFeedback(data as Feedback[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const submitFeedback = useCallback(async (category: FeedbackCategory, subject: string, message: string) => {
    const { data, error } = await supabase
      .from('feedback')
      .insert({ category, subject, message })
      .select()
      .maybeSingle();
    if (error) throw error;
    if (data) setFeedback((prev) => [data as Feedback, ...prev]);
    return data;
  }, []);

  const deleteFeedback = useCallback(async (id: string) => {
    const { error } = await supabase.from('feedback').delete().eq('id', id);
    if (error) throw error;
    setFeedback((prev) => prev.filter((f) => f.id !== id));
  }, []);

  return { feedback, loading, submitFeedback, deleteFeedback, refetch: fetch };
}

export function useAppRating() {
  const [myRating, setMyRating] = useState<AppRating | null>(null);
  const [allRatings, setAllRatings] = useState<AppRating[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data: all } = await supabase
      .from('app_ratings')
      .select('*')
      .order('created_at', { ascending: false });
    if (all) setAllRatings(all as AppRating[]);

    const { data: mine } = await supabase
      .from('app_ratings')
      .select('*')
      .maybeSingle();
    setMyRating(mine as AppRating | null);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const submitRating = useCallback(async (rating: number, comment?: string) => {
    const { data: existing } = await supabase
      .from('app_ratings')
      .select('id')
      .maybeSingle();

    if (existing) {
      const { data, error } = await supabase
        .from('app_ratings')
        .update({ rating, comment: comment ?? null, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .maybeSingle();
      if (error) throw error;
      if (data) setMyRating(data as AppRating);
    } else {
      const { data, error } = await supabase
        .from('app_ratings')
        .insert({ rating, comment: comment ?? null })
        .select()
        .maybeSingle();
      if (error) throw error;
      if (data) setMyRating(data as AppRating);
    }
    fetch();
  }, [fetch]);

  const average = allRatings.length > 0
    ? allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length
    : 0;

  return { myRating, allRatings, average, count: allRatings.length, loading, submitRating };
}
