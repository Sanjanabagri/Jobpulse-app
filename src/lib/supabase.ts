import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const EDGE_FUNCTIONS = {
  fetchJobs: `${supabaseUrl}/functions/v1/fetch-jobs`,
  dailyDigest: `${supabaseUrl}/functions/v1/daily-digest`,
  agent: `${supabaseUrl}/functions/v1/agent`,
} as const;

export function edgeHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${supabaseAnonKey}`,
    'Content-Type': 'application/json',
  };
}
