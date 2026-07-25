import { useState, useRef, useEffect } from 'react';
import {
  Send, Sparkles, Loader2, Bot, User, X, ExternalLink, MapPin,
  Briefcase, ShieldCheck, AlertTriangle, Mic, MicOff, Volume2, Square,
} from 'lucide-react';
import { useAgentChat } from '@/hooks/useAgentChat';
import { useVoice } from '@/hooks/useVoice';
import { timeAgo } from '@/lib/utils';
import { DomainIcon } from './DomainIcon';

const SUGGESTIONS = [
  'Best match for my profile',
  'Show me 5 remote jobs',
  "What's trending today?",
  'How many jobs do we have?',
  'Any DevOps roles?',
];

const VOICE_SUGGESTIONS = [
  'Show me marketing jobs in Mumbai',
  'Find remote finance roles',
  'What skills are trending?',
  'Any healthcare jobs?',
];

interface AgentChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AgentChat({ isOpen, onClose }: AgentChatProps) {
  const { messages, send, loading } = useAgentChat();
  const [input, setInput] = useState('');
  const [voiceMode, setVoiceMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastSpokenRef = useRef<number>(-1);

  const { voiceState, interimText, supported, startListening, stopListening, speak, stopSpeaking } = useVoice({
    onTranscript: (text) => {
      send(text);
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Auto-speak the latest agent reply when in voice mode
  useEffect(() => {
    if (!voiceMode || loading) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === 'agent' && lastMsg.timestamp !== lastSpokenRef.current) {
      lastSpokenRef.current = lastMsg.timestamp;
      speak(lastMsg.content, () => {
        // After speaking, automatically re-listen if still in voice mode
        if (voiceMode && voiceState === 'idle') {
          startListening();
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, loading, voiceMode]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    send(input);
    setInput('');
  }

  function toggleVoiceMode() {
    if (!supported) return;
    if (voiceMode) {
      setVoiceMode(false);
      stopSpeaking();
      stopListening();
    } else {
      setVoiceMode(true);
      startListening();
    }
  }

  function handleMicClick() {
    if (!supported) return;
    if (voiceState === 'listening') {
      stopListening();
    } else {
      stopSpeaking();
      startListening();
    }
  }

  const isListening = voiceState === 'listening';
  const isSpeaking = voiceState === 'speaking';
  const isProcessing = voiceState === 'processing';

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed bottom-0 right-0 z-40 flex h-[100vh] w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 sm:h-[calc(100vh-4rem)] sm:bottom-0 sm:top-16 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/30">
              <Sparkles className="h-5 w-5 text-white" />
              {voiceMode && (
                <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
                  isListening ? 'bg-red-500 animate-pulse' : isSpeaking ? 'bg-sky-500' : 'bg-emerald-500'
                }`} />
              )}
            </div>
            <div>
              <p className="font-semibold text-slate-900">JobPulse Agent</p>
              <p className="text-xs text-emerald-600">
                {isListening ? 'Listening...' : isSpeaking ? 'Speaking...' : isProcessing ? 'Processing...' : voiceMode ? 'Voice mode on' : 'Online'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {supported && (
              <button
                onClick={toggleVoiceMode}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                  voiceMode
                    ? 'bg-violet-100 text-violet-700 hover:bg-violet-200'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
                title={voiceMode ? 'Turn off voice mode' : 'Turn on voice mode'}
              >
                {voiceMode ? <Volume2 className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                <span className="hidden sm:inline">{voiceMode ? 'Voice' : 'Voice'}</span>
              </button>
            )}
            <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Voice status banner when listening/speaking */}
        {voiceMode && (isListening || isSpeaking || isProcessing || interimText) && (
          <div className="border-b border-violet-100 bg-gradient-to-r from-violet-50 to-purple-50 px-4 py-2.5">
            <div className="flex items-center gap-2">
              {isListening && (
                <>
                  <div className="flex items-center gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <span
                        key={i}
                        className="h-3 w-1 rounded-full bg-violet-500 animate-pulse"
                        style={{ animationDelay: `${i * 120}ms`, height: `${8 + Math.random() * 12}px` }}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-medium text-violet-700">
                    {interimText || 'Listening... speak now'}
                  </span>
                </>
              )}
              {isProcessing && (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-600" />
                  <span className="text-xs font-medium text-violet-700">Processing your request...</span>
                </>
              )}
              {isSpeaking && (
                <>
                  <button
                    onClick={stopSpeaking}
                    className="flex items-center gap-1 text-xs font-medium text-violet-700 hover:text-violet-900"
                  >
                    <Square className="h-3 w-3 fill-current" />
                    Stop speaking
                  </button>
                  <span className="text-xs text-violet-500 ml-auto">Agent is talking...</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                msg.role === 'user'
                  ? 'bg-slate-700 text-white'
                  : 'bg-gradient-to-br from-violet-500 to-purple-600 text-white'
              }`}>
                {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              <div className={`max-w-[85%] space-y-2 ${msg.role === 'user' ? 'items-end' : ''}`}>
                <div className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-slate-900 text-white'
                    : 'border border-slate-200 bg-white text-slate-700'
                }`}>
                  {msg.content.split('\n').map((line, idx) => (
                    <p key={idx} className={idx > 0 ? 'mt-1' : ''}>{line}</p>
                  ))}
                </div>

                {/* Job results */}
                {msg.jobs && msg.jobs.length > 0 && (
                  <div className="space-y-2">
                    {msg.jobs.map((job) => (
                      <div key={job.id} className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">{job.title}</p>
                            <p className="truncate text-xs text-slate-600">{job.company}</p>
                          </div>
                          {job.apply_url && (
                            <a
                              href={job.apply_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0 rounded-md bg-sky-600 px-2 py-1 text-xs font-medium text-white hover:bg-sky-700"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          {typeof job.trust_score === 'number' && (
                            <span className={`flex items-center gap-0.5 rounded px-1.5 py-0.5 font-semibold ${job.trust_score >= 70 ? 'bg-emerald-50 text-emerald-700' : job.trust_score >= 50 ? 'bg-sky-50 text-sky-700' : 'bg-red-50 text-red-700'}`}>
                              {job.trust_score >= 50 ? <ShieldCheck className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                              {job.trust_score}
                            </span>
                          )}
                          {job.freshness_label && (
                            <span className={`rounded px-1.5 py-0.5 font-medium ${job.freshness_label === 'fresh' ? 'bg-emerald-50 text-emerald-700' : job.freshness_label === 'active' ? 'bg-sky-50 text-sky-700' : job.freshness_label === 'aging' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                              {job.freshness_label}
                            </span>
                          )}
                          {typeof job.match_score === 'number' && (
                            <span className="flex items-center gap-0.5 rounded bg-violet-50 px-1.5 py-0.5 font-bold text-violet-700">
                              <Sparkles className="h-3 w-3" />{job.match_score}%
                            </span>
                          )}
                          {job.location && <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{job.location}</span>}
                          {job.is_remote && <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-medium text-emerald-700">Remote</span>}
                          {job.job_type && <span className="flex items-center gap-0.5"><Briefcase className="h-3 w-3" />{job.job_type}</span>}
                          <span>{timeAgo(job.posted_at)}</span>
                        </div>
                        {job.tags && job.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {job.tags.slice(0, 4).map((t) => (
                              <span key={t} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Trending / Stats visual */}
                {msg.trending && msg.trending.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {msg.trending.slice(0, 6).map((t) => (
                      <div key={t.slug} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2">
                        <span className={`flex h-6 w-6 items-center justify-center rounded ${t.color} text-white`}>
                          <DomainIcon name={t.icon} className="h-3 w-3" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-slate-700">{t.domain}</p>
                          <p className="text-xs text-slate-500">{t.count} new</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <span className="h-2 w-2 animate-bounce rounded-full bg-violet-400 [animation-delay:0ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-violet-400 [animation-delay:150ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-violet-400 [animation-delay:300ms]" />
              </div>
            </div>
          )}
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && (
          <div className="border-t border-slate-200 bg-white px-4 py-2">
            <div className="flex flex-wrap gap-1.5">
              {(voiceMode ? VOICE_SUGGESTIONS : SUGGESTIONS).map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                >
                  {voiceMode && <Mic className="mr-1 inline h-3 w-3" />}
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Unsupported browser notice */}
        {!supported && voiceMode && (
          <div className="border-t border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-700">
            Voice features need Chrome, Safari, or Edge. Firefox doesn't support speech recognition.
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-white p-3">
          {voiceMode ? (
            <div className="flex items-center justify-between gap-2">
              {/* Voice mode: large mic button */}
              <div className="flex flex-1 items-center justify-center">
                <button
                  type="button"
                  onClick={handleMicClick}
                  disabled={!supported}
                  className={`flex h-14 w-14 items-center justify-center rounded-full transition active:scale-95 disabled:opacity-40 ${
                    isListening
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/40 animate-pulse'
                      : 'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30 hover:scale-105'
                  }`}
                  title={isListening ? 'Stop listening' : 'Tap to speak'}
                >
                  {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                </button>
              </div>
              <button
                type="button"
                onClick={() => setVoiceMode(false)}
                className="rounded-lg px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100"
              >
                Type instead
              </button>
            </div>
          ) : (
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                rows={1}
                placeholder="Ask about jobs, domains, trends..."
                className="max-h-24 flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-100"
              />
              {supported && (
                <button
                  type="button"
                  onClick={() => { setVoiceMode(true); startListening(); }}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                  title="Switch to voice mode"
                >
                  <Mic className="h-4 w-4" />
                </button>
              )}
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white transition hover:opacity-90 active:scale-95 disabled:opacity-40"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          )}
        </form>
      </div>
    </>
  );
}
