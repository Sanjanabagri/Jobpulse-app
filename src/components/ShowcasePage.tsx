import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Zap, Briefcase, GitCompare, BarChart3, Send, Building2, Star,
  Users, MessageCircle, Sparkles, ShieldCheck, TrendingUp, Target,
  Heart, Bell, Globe, ArrowRight, ArrowLeft, Play, Pause, X,
  CheckCircle2, Wallet, MapPin, Clock, Brain, Mic, Share2,
} from 'lucide-react';

interface Slide {
  icon: React.ReactNode;
  badge: string;
  title: string;
  subtitle: string;
  features: { icon: React.ReactNode; text: string }[];
  accent: string;
  bgGradient: string;
  mockup: 'dashboard' | 'jobfeed' | 'compare' | 'insights' | 'applications' | 'employer' | 'agent' | 'reviews';
}

const SLIDES: Slide[] = [
  {
    icon: <LayoutDashboard className="h-7 w-7" />,
    badge: 'Smart Dashboard',
    title: 'Your Career Command Center',
    subtitle: 'Personalized dashboard with match scores, skill gaps, and application pipeline — all in one view.',
    features: [
      { icon: <TrendingUp className="h-4 w-4" />, text: 'Real-time application pipeline' },
      { icon: <Target className="h-4 w-4" />, text: 'AI-powered job match scores' },
      { icon: <Brain className="h-4 w-4" />, text: 'Skill gap analysis per job' },
    ],
    accent: 'sky',
    bgGradient: 'from-sky-500 to-blue-600',
    mockup: 'dashboard',
  },
  {
    icon: <Briefcase className="h-7 w-7" />,
    badge: 'Verified Job Feed',
    title: 'Trust-Scored Jobs Only',
    subtitle: 'Every job is crawled, verified, and scored for freshness and trust. No more fake postings.',
    features: [
      { icon: <ShieldCheck className="h-4 w-4" />, text: 'Trust scores on every posting' },
      { icon: <Clock className="h-4 w-4" />, text: 'Freshness tracking (Fresh → Stale)' },
      { icon: <Heart className="h-4 w-4" />, text: 'Save jobs with one click' },
    ],
    accent: 'emerald',
    bgGradient: 'from-emerald-500 to-teal-600',
    mockup: 'jobfeed',
  },
  {
    icon: <Sparkles className="h-7 w-7" />,
    badge: 'AI Agent + Voice',
    title: 'Talk to Your Job Search',
    subtitle: 'Ask in natural language — by text or voice. Get instant job matches with trust and freshness badges.',
    features: [
      { icon: <Mic className="h-4 w-4" />, text: 'Voice-powered job search' },
      { icon: <MessageCircle className="h-4 w-4" />, text: 'Natural language queries' },
      { icon: <Zap className="h-4 w-4" />, text: 'Instant matched results' },
    ],
    accent: 'violet',
    bgGradient: 'from-violet-500 to-purple-600',
    mockup: 'agent',
  },
  {
    icon: <GitCompare className="h-7 w-7" />,
    badge: 'Job Comparison',
    title: 'Compare 3 Jobs Side-by-Side',
    subtitle: 'Stack up to 3 jobs and compare salary, trust, freshness, skills, and match score — visually.',
    features: [
      { icon: <Wallet className="h-4 w-4" />, text: 'Salary & benefits comparison' },
      { icon: <ShieldCheck className="h-4 w-4" />, text: 'Trust & freshness head-to-head' },
      { icon: <Target className="h-4 w-4" />, text: 'Match score breakdown' },
    ],
    accent: 'amber',
    bgGradient: 'from-amber-500 to-orange-600',
    mockup: 'compare',
  },
  {
    icon: <BarChart3 className="h-7 w-7" />,
    badge: 'Salary Insights',
    title: 'Know Your Worth',
    subtitle: 'Interactive charts showing salary trends by domain, job type, and location — powered by real job data.',
    features: [
      { icon: <TrendingUp className="h-4 w-4" />, text: 'Average, median, high, low' },
      { icon: <Globe className="h-4 w-4" />, text: 'By domain, type & location' },
      { icon: <Wallet className="h-4 w-4" />, text: 'Real market data' },
    ],
    accent: 'blue',
    bgGradient: 'from-blue-500 to-indigo-600',
    mockup: 'insights',
  },
  {
    icon: <Send className="h-7 w-7" />,
    badge: 'Application Tracker',
    title: 'Kanban-Style Pipeline',
    subtitle: 'Drag and drop applications across stages. From applied to offer — never lose track.',
    features: [
      { icon: <CheckCircle2 className="h-4 w-4" />, text: '6-stage Kanban board' },
      { icon: <ArrowRight className="h-4 w-4" />, text: 'Drag & drop status changes' },
      { icon: <FileText className="h-4 w-4" />, text: 'Resume & cover note per app' },
    ],
    accent: 'rose',
    bgGradient: 'from-rose-500 to-pink-600',
    mockup: 'applications',
  },
  {
    icon: <Building2 className="h-7 w-7" />,
    badge: 'Employer ATS',
    title: 'Built-in Hiring Tools',
    subtitle: 'Post jobs, manage applicants, and track candidates through your hiring pipeline — all in one place.',
    features: [
      { icon: <Briefcase className="h-4 w-4" />, text: 'Post & manage job listings' },
      { icon: <Users className="h-4 w-4" />, text: 'Applicant pipeline tracker' },
      { icon: <TrendingUp className="h-4 w-4" />, text: 'Promoted job listings' },
    ],
    accent: 'teal',
    bgGradient: 'from-teal-500 to-cyan-600',
    mockup: 'employer',
  },
  {
    icon: <Star className="h-7 w-7" />,
    badge: 'Company Reviews',
    title: 'Real Reviews, Real Insights',
    subtitle: 'Read and write company reviews with ratings, pros, cons, and recommendations — Glassdoor-style.',
    features: [
      { icon: <Star className="h-4 w-4" />, text: 'Star ratings + pros & cons' },
      { icon: <ShieldCheck className="h-4 w-4" />, text: 'Verified employee reviews' },
      { icon: <TrendingUp className="h-4 w-4" />, text: 'Most-reviewed companies' },
    ],
    accent: 'amber',
    bgGradient: 'from-amber-500 to-yellow-600',
    mockup: 'reviews',
  },
  {
    icon: <Share2 className="h-7 w-7" />,
    badge: 'Share & Collaborate',
    title: 'Share Jobs, Build Teams',
    subtitle: 'Share jobs to LinkedIn, Twitter, WhatsApp. Create teams and collaborate with friends on job searches.',
    features: [
      { icon: <Share2 className="h-4 w-4" />, text: 'Social sharing (LinkedIn, Twitter, WhatsApp)' },
      { icon: <Users className="h-4 w-4" />, text: 'Team-based job sharing' },
      { icon: <Bell className="h-4 w-4" />, text: 'Smart notifications' },
    ],
    accent: 'indigo',
    bgGradient: 'from-indigo-500 to-blue-600',
    mockup: 'reviews',
  },
];

function LayoutDashboard({ className }: { className?: string }) {
  return <BarChart3 className={className} />;
}

function FileText({ className }: { className?: string }) {
  return <Briefcase className={className} />;
}

interface ShowcasePageProps {
  onClose: () => void;
}

export function ShowcasePage({ onClose }: ShowcasePageProps) {
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const SLIDE_DURATION = 5000;

  const goNext = useCallback(() => {
    setCurrent((c) => (c + 1) % SLIDES.length);
    setProgress(0);
  }, []);

  const goPrev = useCallback(() => {
    setCurrent((c) => (c - 1 + SLIDES.length) % SLIDES.length);
    setProgress(0);
  }, []);

  useEffect(() => {
    if (!playing) return;
    timerRef.current = setInterval(goNext, SLIDE_DURATION);
    progressRef.current = setInterval(() => {
      setProgress((p) => Math.min(p + 100 / (SLIDE_DURATION / 50), 100));
    }, 50);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [playing, current, goNext]);

  const slide = SLIDES[current];

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden bg-slate-950">
      {/* Animated gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${slide.bgGradient} opacity-20 transition-all duration-1000`} />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />

      {/* Decorative orbs */}
      <div className={`absolute -top-40 -right-40 h-96 w-96 rounded-full bg-gradient-to-br ${slide.bgGradient} opacity-10 blur-3xl transition-all duration-1000`} />
      <div className={`absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-gradient-to-br ${slide.bgGradient} opacity-10 blur-3xl transition-all duration-1000`} />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 sm:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-sky-500/30">
            <Zap className="h-5 w-5 text-white" fill="white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">JobPulse</h1>
            <p className="text-xs text-slate-400">Product Showcase</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setPlaying(!playing)}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-white/10"
          >
            {playing ? <><Pause className="h-4 w-4" /> Pause</> : <><Play className="h-4 w-4" /> Play</>}
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-white/10"
          >
            <X className="h-4 w-4" /> Exit
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative z-10 mx-auto flex gap-1.5 px-6 sm:px-10">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => { setCurrent(i); setProgress(0); }}
            className="group relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/10"
          >
            <div
              className={`absolute inset-y-0 left-0 rounded-full transition-all ${i === current ? 'bg-white' : i < current ? 'bg-white/60' : 'bg-transparent'}`}
              style={i === current ? { width: `${progress}%` } : i < current ? { width: '100%' } : { width: '0%' }}
            />
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 mx-auto flex h-[calc(100vh-7rem)] max-w-6xl items-center px-6 sm:px-10">
        <div className="grid w-full items-center gap-8 lg:grid-cols-2">
          {/* Left: Text content */}
          <div key={`text-${current}`} className="slide-in-left">
            <div className={`mb-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${slide.bgGradient} px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-lg`}>
              {slide.icon}
              {slide.badge}
            </div>

            <h2 className="text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
              {slide.title}
            </h2>

            <p className="mt-4 text-base leading-relaxed text-slate-300 sm:text-lg">
              {slide.subtitle}
            </p>

            <div className="mt-6 space-y-2.5">
              {slide.features.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 text-sm text-slate-200 fade-in-up"
                  style={{ animationDelay: `${i * 150}ms` }}
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${slide.bgGradient} text-white shadow-md`}>
                    {f.icon}
                  </div>
                  {f.text}
                </div>
              ))}
            </div>

            {/* Slide counter */}
            <div className="mt-8 flex items-center gap-4">
              <span className="text-sm font-medium text-slate-400">
                {String(current + 1).padStart(2, '0')} / {String(SLIDES.length).padStart(2, '0')}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={goPrev}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={goNext}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right: Mockup */}
          <div key={`mockup-${current}`} className="slide-in-right hidden lg:block">
            <FeatureMockup type={slide.mockup} accent={slide.accent} bgGradient={slide.bgGradient} />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(30px) scale(0.95); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .slide-in-left { animation: slideInLeft 0.6s ease-out forwards; }
        .slide-in-right { animation: slideInRight 0.6s ease-out forwards; }
        .fade-in-up { animation: fadeInUp 0.5s ease-out forwards; opacity: 0; }
      `}</style>
    </div>
  );
}

function FeatureMockup({ type, accent, bgGradient }: { type: Slide['mockup']; accent: string; bgGradient: string }) {
  const accentColor: Record<string, string> = {
    sky: 'bg-sky-500', emerald: 'bg-emerald-500', violet: 'bg-violet-500',
    amber: 'bg-amber-500', blue: 'bg-blue-500', rose: 'bg-rose-500',
    teal: 'bg-teal-500', indigo: 'bg-indigo-500',
  };
  const ac = accentColor[accent] || 'bg-sky-500';

  if (type === 'dashboard') {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-800/80 p-5 shadow-2xl backdrop-blur-xl">
        <div className="mb-4 grid grid-cols-3 gap-3">
          {['Available Jobs', 'Good Matches', 'Applications'].map((label, i) => (
            <div key={label} className="rounded-xl bg-white/5 p-3">
              <p className="text-xs text-slate-400">{label}</p>
              <p className="mt-1 text-2xl font-bold text-white">{['1,247', '38', '7'][i]}</p>
            </div>
          ))}
        </div>
        <div className="mb-4 rounded-xl bg-white/5 p-4">
          <p className="mb-2 text-xs font-medium text-slate-400">Application Pipeline</p>
          <div className="flex gap-1.5">
            {['Applied', 'Reviewing', 'Interview', 'Offer'].map((s, i) => (
              <div key={s} className="flex-1">
                <div className={`h-2 rounded-full ${i === 0 ? 'bg-sky-500' : i === 1 ? 'bg-amber-500' : i === 2 ? 'bg-violet-500' : 'bg-emerald-500'}`} style={{ opacity: 1 - i * 0.2 }} />
                <p className="mt-1 text-[10px] text-slate-500">{s}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${ac} text-white text-xs font-bold`}>{i}</div>
              <div className="flex-1">
                <div className="h-2 w-32 rounded-full bg-white/10" />
                <div className="mt-1.5 h-1.5 w-24 rounded-full bg-white/5" />
              </div>
              <div className={`flex items-center gap-1 rounded-full ${ac} bg-opacity-20 px-2 py-0.5 text-[10px] font-bold text-white`}>
                <Zap className="h-2.5 w-2.5" /> {85 + i}%
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'jobfeed') {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-800/80 p-5 shadow-2xl backdrop-blur-xl">
        <div className="mb-4 flex gap-2">
          <div className="h-8 flex-1 rounded-lg bg-white/5" />
          <div className="h-8 w-20 rounded-lg bg-white/5" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl bg-white/5 p-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/10" />
                <div className="flex-1">
                  <div className="h-2.5 w-40 rounded-full bg-white/10" />
                  <div className="mt-2 h-1.5 w-28 rounded-full bg-white/5" />
                  <div className="mt-3 flex gap-1.5">
                    <span className="flex items-center gap-0.5 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                      <ShieldCheck className="h-2.5 w-2.5" /> Trust 85
                    </span>
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-300">Fresh</span>
                    <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] font-medium text-sky-300">Remote</span>
                  </div>
                </div>
                <Heart className="h-5 w-5 text-rose-400" fill="currentColor" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'agent') {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-800/80 p-5 shadow-2xl backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-2">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${bgGradient} text-white`}>
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold text-white">JobPulse AI Agent</span>
          <Mic className="ml-auto h-4 w-4 text-violet-400" />
        </div>
        <div className="space-y-3">
          <div className="ml-auto max-w-[80%] rounded-xl rounded-tr-sm bg-violet-600/30 px-3 py-2 text-xs text-white">
            Find me remote React jobs paying above 15 LPA
          </div>
          <div className="max-w-[90%] rounded-xl rounded-tl-sm bg-white/5 px-3 py-2 text-xs text-slate-300">
            I found 12 matching jobs! Here are the top 3 with trust scores:
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-white/5 bg-white/5 p-3">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-white/10" />
                <div className="flex-1">
                  <div className="h-2 w-32 rounded-full bg-white/10" />
                  <div className="mt-1.5 h-1.5 w-20 rounded-full bg-white/5" />
                </div>
                <span className="flex items-center gap-0.5 text-[10px] font-bold text-violet-300">
                  <Zap className="h-2.5 w-2.5" /> {88 + i}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'compare') {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-800/80 p-5 shadow-2xl backdrop-blur-xl">
        <p className="mb-4 text-sm font-semibold text-white">Comparing 3 Jobs</p>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl bg-white/5 p-3">
              <div className="mb-2 h-8 w-8 rounded-lg bg-white/10" />
              <div className="h-2 w-full rounded-full bg-white/10" />
              <div className="mt-1.5 h-1.5 w-3/4 rounded-full bg-white/5" />
              <div className="mt-3 space-y-1.5">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-400">Salary</span>
                  <span className="font-bold text-emerald-300">₹{15 + i}L</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-400">Trust</span>
                  <span className="font-bold text-sky-300">{80 + i}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-400">Match</span>
                  <span className="font-bold text-violet-300">{85 + i}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'insights') {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-800/80 p-5 shadow-2xl backdrop-blur-xl">
        <div className="mb-4 grid grid-cols-4 gap-2">
          {[['Avg', '₹18L'], ['Med', '₹15L'], ['High', '₹45L'], ['Low', '₹8L']].map(([l, v]) => (
            <div key={l} className="rounded-lg bg-white/5 p-2 text-center">
              <p className="text-[10px] text-slate-400">{l}</p>
              <p className="text-sm font-bold text-white">{v}</p>
            </div>
          ))}
        </div>
        <div className="space-y-3">
          {['Software', 'Data Science', 'Design', 'Marketing'].map((d, i) => (
            <div key={d} className="flex items-center gap-3">
              <span className="w-24 text-xs text-slate-400">{d}</span>
              <div className="flex-1">
                <div className="h-6 rounded-md bg-white/5">
                  <div className={`h-full rounded-md bg-gradient-to-r ${bgGradient}`} style={{ width: `${85 - i * 12}%` }} />
                </div>
              </div>
              <span className="text-xs font-bold text-white">₹{20 - i * 3}L</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'applications') {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-800/80 p-5 shadow-2xl backdrop-blur-xl">
        <p className="mb-4 text-sm font-semibold text-white">Application Pipeline</p>
        <div className="grid grid-cols-4 gap-2">
          {[
            ['Applied', '3', 'bg-sky-500'],
            ['Review', '2', 'bg-amber-500'],
            ['Interview', '1', 'bg-violet-500'],
            ['Offer', '1', 'bg-emerald-500'],
          ].map(([label, count, color]) => (
            <div key={label} className="rounded-xl bg-white/5 p-2">
              <p className="mb-2 text-[10px] font-medium text-slate-400">{label}</p>
              <div className={`mb-2 inline-flex h-5 w-5 items-center justify-center rounded-full ${color} text-[10px] font-bold text-white`}>{count}</div>
              <div className="space-y-1.5">
                <div className="rounded-lg bg-white/5 p-1.5">
                  <div className="h-1.5 w-full rounded-full bg-white/10" />
                </div>
                <div className="rounded-lg bg-white/5 p-1.5">
                  <div className="h-1.5 w-full rounded-full bg-white/10" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'employer') {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-800/80 p-5 shadow-2xl backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white/10" />
          <div>
            <div className="h-2.5 w-24 rounded-full bg-white/10" />
            <div className="mt-1.5 h-1.5 w-16 rounded-full bg-white/5" />
          </div>
          <span className={`ml-auto rounded-full bg-gradient-to-r ${bgGradient} px-2.5 py-1 text-[10px] font-bold text-white`}>POSTED</span>
        </div>
        <p className="mb-3 text-xs font-medium text-slate-400">Applicants Pipeline</p>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
              <div className="h-8 w-8 rounded-full bg-white/10" />
              <div className="flex-1">
                <div className="h-2 w-24 rounded-full bg-white/10" />
                <div className="mt-1.5 flex gap-1">
                  <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] text-slate-400">React</span>
                  <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] text-slate-400">TypeScript</span>
                </div>
              </div>
              <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-slate-300">
                {['Screening', 'Interview', 'Offer'][i - 1]}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // reviews
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-800/80 p-5 shadow-2xl backdrop-blur-xl">
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white/5 p-3 text-center">
          <p className="text-3xl font-bold text-white">4.2</p>
          <div className="mt-1 flex justify-center gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star key={n} className={`h-3 w-3 ${n <= 4 ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} />
            ))}
          </div>
          <p className="mt-1 text-[10px] text-slate-400">Overall Rating</p>
        </div>
        <div className="rounded-xl bg-white/5 p-3 text-center">
          <p className="text-3xl font-bold text-emerald-400">87%</p>
          <p className="mt-1 text-[10px] text-slate-400">Would Recommend</p>
        </div>
      </div>
      <div className="space-y-2.5">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-xl bg-white/5 p-3">
            <div className="flex items-center justify-between">
              <div className="h-2 w-20 rounded-full bg-white/10" />
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className={`h-2.5 w-2.5 ${n <= 4 + (i % 2) ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} />
                ))}
              </div>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-emerald-500/10 p-2">
                <p className="text-[9px] font-bold uppercase text-emerald-400">Pros</p>
                <div className="mt-1 h-1.5 w-full rounded-full bg-white/5" />
              </div>
              <div className="rounded-lg bg-red-500/10 p-2">
                <p className="text-[9px] font-bold uppercase text-red-400">Cons</p>
                <div className="mt-1 h-1.5 w-full rounded-full bg-white/5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
