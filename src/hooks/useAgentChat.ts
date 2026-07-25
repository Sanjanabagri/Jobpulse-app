import { useState, useCallback, useRef, useEffect } from 'react';
import { EDGE_FUNCTIONS, supabase, edgeHeaders } from '@/lib/supabase';
import type { ChatMessage, AgentResponse } from '@/types';

const WELCOME: ChatMessage = {
  role: 'agent',
  content: "Hi! I'm your JobPulse agent. I scan job portals across the web daily, classify every posting by domain, and score each job for trust and freshness. Ask me things like:\n\n\u2022 \"Show me 5 React jobs\"\n\u2022 \"Any remote DevOps roles?\"\n\u2022 \"What's trending today?\"\n\u2022 \"How many jobs do we have?\"\n\u2022 \"Best match for my profile\"",
  timestamp: Date.now(),
};

export function useAgentChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: text, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // Get the current session token for personalized matching
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        ...edgeHeaders(),
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch(EDGE_FUNCTIONS.agent, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query: text }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`Agent error (${res.status})`);
      const data: AgentResponse = await res.json();

      const agentMsg: ChatMessage = {
        role: 'agent',
        content: data.reply,
        jobs: data.jobs || [],
        timestamp: Date.now(),
        stats: data.stats,
        trending: data.trending,
      };
      setMessages((prev) => [...prev, agentMsg]);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      const agentMsg: ChatMessage = {
        role: 'agent',
        content: `Sorry, I hit an error: ${err.message}. Please try again.`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, agentMsg]);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  useEffect(() => () => abortRef.current?.abort(), []);

  return { messages, send, loading };
}
