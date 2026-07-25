import { useState, useEffect, useRef, useCallback } from 'react';
import { Zap, Radar, ChevronUp, ArrowRight } from 'lucide-react';

const SKILL_KEYWORDS = [
  'React', 'Python', 'AWS', 'Kubernetes', 'DevOps', 'Data Science',
  'TypeScript', 'Node.js', 'Go', 'Machine Learning', 'Docker',
  'PostgreSQL', 'GraphQL', 'Flutter', 'Swift', 'Kotlin', 'Terraform',
  'Frontend', 'Backend', 'Full Stack', 'Cloud', 'Microservices',
  'Java', 'Spring', 'Redis', 'MongoDB', 'CI/CD', 'Blockchain',
  'Cybersecurity', 'UI/UX', 'Product Management', 'Android', 'iOS',
  'TensorFlow', 'PyTorch', 'Elasticsearch', 'Kafka', 'Rust', 'C++',
  'Remote', 'Hiring Now', 'Senior', 'Lead', 'Architect',
];

const SWIPE_THRESHOLD = 60;

interface SplashProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashProps) {
  const [progress, setProgress] = useState(0);
  const [fading, setFading] = useState(false);
  const [ready, setReady] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [dragging, setDragging] = useState(false);

  const startYRef = useRef<number | null>(null);
  const startXRef = useRef<number | null>(null);
  const completedRef = useRef(false);

  // Fill progress bar once, then stay at 100%
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setReady(true);
          return 100;
        }
        return p + 3;
      });
    }, 40);
    return () => clearInterval(interval);
  }, []);

  const finish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    setFading(true);
    setTimeout(onComplete, 500);
  }, [onComplete]);

  // Touch handlers — swipe up
  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    startYRef.current = t.clientY;
    startXRef.current = t.clientX;
    setDragging(true);
  }

  function onTouchMove(e: React.TouchEvent) {
    if (startYRef.current === null) return;
    const dy = e.touches[0].clientY - startYRef.current;
    const dx = e.touches[0].clientX - (startXRef.current ?? 0);
    // Only respond to upward swipe
    if (dy < 0 && Math.abs(dy) > Math.abs(dx)) {
      setDragOffset(Math.max(dy, -200));
    }
  }

  function onTouchEnd() {
    if (dragOffset < -SWIPE_THRESHOLD) {
      finish();
    }
    setDragOffset(0);
    setDragging(false);
    startYRef.current = null;
    startXRef.current = null;
  }

  // Mouse handlers — drag up (desktop)
  function onMouseDown(e: React.MouseEvent) {
    startYRef.current = e.clientY;
    startXRef.current = e.clientX;
    setDragging(true);
  }

  function onMouseMove(e: React.MouseEvent) {
    if (startYRef.current === null || !dragging) return;
    const dy = e.clientY - startYRef.current;
    if (dy < 0) {
      setDragOffset(Math.max(dy, -200));
    }
  }

  function onMouseUp() {
    if (dragOffset < -SWIPE_THRESHOLD) {
      finish();
    }
    setDragOffset(0);
    setDragging(false);
    startYRef.current = null;
    startXRef.current = null;
  }

  // Keyboard fallback
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowUp') && ready) {
        finish();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ready, finish]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-slate-900 select-none transition-opacity duration-500 ${
        fading ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        transform: dragOffset ? `translateY(${dragOffset}px)` : undefined,
        transition: dragging ? 'none' : 'transform 0.3s ease-out, opacity 0.5s ease-out',
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950" />

      {/* Radial glow */}
      <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-500/10 blur-3xl" />

      {/* Floating skill keywords */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {SKILL_KEYWORDS.map((keyword, i) => {
          const left = (i * 37 + 13) % 95;
          const delay = (i * 0.3) % 8;
          const duration = 12 + (i % 5) * 3;
          const fontSize = 0.7 + (i % 4) * 0.15;
          const opacity = 0.08 + (i % 5) * 0.04;
          return (
            <span
              key={keyword}
              className="absolute font-semibold text-sky-200 whitespace-nowrap"
              style={{
                left: `${left}%`,
                bottom: `-5%`,
                fontSize: `${fontSize}rem`,
                opacity,
                animation: `floatUp ${duration}s linear ${delay}s infinite`,
              }}
            >
              {keyword}
            </span>
          );
        })}
      </div>

      {/* Logo + radar */}
      <div className="relative z-10 flex flex-col items-center pointer-events-none">
        {/* Radar rings */}
        <div className="relative flex h-32 w-32 items-center justify-center">
          <span className="absolute h-full w-full animate-ping rounded-full border border-sky-400/30" style={{ animationDuration: '2s' }} />
          <span className="absolute h-24 w-24 animate-ping rounded-full border border-sky-400/20" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
          <span className="absolute h-16 w-16 animate-ping rounded-full border border-sky-400/15" style={{ animationDuration: '3s', animationDelay: '1s' }} />

          {/* Logo badge */}
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 shadow-2xl shadow-sky-500/40">
            <Zap className="h-8 w-8 text-white" fill="white" />
          </div>
        </div>

        {/* Wordmark */}
        <h1 className="mt-8 text-3xl font-bold tracking-tight text-white">
          Job<span className="bg-gradient-to-r from-sky-400 to-blue-400 bg-clip-text text-transparent">Pulse</span>
        </h1>

        {/* Tagline */}
        <div className="mt-3 flex items-center gap-2">
          <Radar className="h-4 w-4 animate-spin text-sky-400" style={{ animationDuration: '3s' }} />
          <p className="text-sm font-medium text-slate-400">
            {progress < 30 ? 'Scanning the job market...' :
             progress < 60 ? 'Analyzing skill demands...' :
             progress < 90 ? 'Verifying job postings...' :
             'Ready'}
          </p>
        </div>
      </div>

      {/* Progress bar / Swipe hint */}
      <div className="absolute bottom-0 left-0 right-0 z-10 pb-10 pt-6">
        {ready ? (
          /* Swipe-to-continue hint */
          <div className="flex flex-col items-center gap-2">
            {/* Drag handle indicator */}
            <div className="mb-3 h-1 w-12 rounded-full bg-white/20" />

            {/* Animated chevron */}
            <div className="relative flex h-12 w-12 items-center justify-center">
              <ChevronUp className="absolute h-6 w-6 text-sky-400 animate-bounce" style={{ animationDuration: '1.5s' }} />
              <ChevronUp className="absolute h-8 w-8 text-sky-400/30 animate-ping" style={{ animationDuration: '2s' }} />
            </div>

            <p className="text-sm font-semibold text-white/90">
              Swipe up to continue
            </p>
            <p className="text-xs text-slate-500">
              or press Enter
            </p>

            {/* Desktop fallback button */}
            <button
              onClick={finish}
              className="mt-4 flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:scale-105 active:scale-95 lg:hidden xl:hidden"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          /* Progress bar while loading */
          <div className="mx-auto w-56">
            <div className="h-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-400 to-blue-500 transition-all duration-100 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-center text-xs text-slate-500">{progress}%</p>
          </div>
        )}
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes floatUp {
          0% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: var(--kw-opacity, 0.15);
          }
          85% {
            opacity: var(--kw-opacity, 0.15);
          }
          100% {
            transform: translateY(-110vh) translateX(20px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
