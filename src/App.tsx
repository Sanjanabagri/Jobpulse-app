import { useState } from 'react';
import { Briefcase, CalendarClock, Sparkles, MessageCircle, Star, Users } from 'lucide-react';
import { SplashScreen } from '@/components/SplashScreen';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { JobFeed } from '@/components/JobFeed';
import { StatsBar } from '@/components/StatsBar';
import { AgentChat } from '@/components/AgentChat';
import { SubscribeModal } from '@/components/SubscribeModal';
import { FeedbackPage } from '@/components/FeedbackPage';
import { TeamsPage } from '@/components/TeamsPage';
import { DigestView } from '@/components/DigestView';
import { AuthPage } from '@/components/AuthPage';
import { ProfileOnboarding } from '@/components/ProfileOnboarding';
import { EditProfileModal } from '@/components/EditProfileModal';
import { useAuth } from '@/hooks/useAuth';
import { useDomains, useJobPostings, useDailyDigests, useSubscriberCount } from '@/hooks/useData';

type Tab = 'jobs' | 'triggers' | 'feedback' | 'teams';

function App() {
  const auth = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('jobs');
  const [selectedDomainSlug, setSelectedDomainSlug] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [showSplash, setShowSplash] = useState(true);
  const [editProfileOpen, setEditProfileOpen] = useState(false);

  const { domains } = useDomains();
  const subscriberCount = useSubscriberCount();
  const { jobs, loading, error, refetch } = useJobPostings(selectedDomainSlug, auth.profile);
  const { digests, loading: digestsLoading } = useDailyDigests();

  // Splash screen on app open
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  // Loading screen
  if (auth.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-sky-500/30">
            <Sparkles className="h-6 w-6 animate-pulse text-white" />
          </div>
          <p className="text-sm text-slate-500">Loading JobPulse...</p>
        </div>
      </div>
    );
  }

  // Not authenticated → Auth page
  if (!auth.isAuthenticated) {
    return <AuthPage auth={auth} />;
  }

  // Authenticated but profile not complete → Onboarding
  if (auth.isAuthenticated && !auth.isProfileComplete) {
    return <ProfileOnboarding auth={auth} domains={domains} />;
  }

  // Authenticated with completed profile → Main app
  const selectedDomain = domains.find((d) => d.slug === selectedDomainSlug) ?? null;
  const userId = auth.user?.id;

  function handleRefresh() {
    refetch();
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header
        onSubscribe={() => setSubscribeOpen(true)}
        onRefresh={handleRefresh}
        subscriberCount={subscriberCount}
        profile={auth.profile}
        domains={domains}
        onSignOut={auth.signOut}
        onEditProfile={() => setEditProfileOpen(true)}
        onNavigate={(tab) => setActiveTab(tab)}
      />

      <div className="flex">
        <Sidebar
          domains={domains}
          selectedSlug={selectedDomainSlug}
          onSelect={setSelectedDomainSlug}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="min-h-[calc(100vh-4rem)] flex-1 lg:w-[calc(100%-18rem)]">
          {/* Tab bar */}
          <div className="sticky top-16 z-10 flex items-center gap-1 border-b border-slate-200 bg-white/80 px-4 py-2 backdrop-blur-xl sm:px-6 lg:px-8">
            <button
              onClick={() => setActiveTab('jobs')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                activeTab === 'jobs' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Briefcase className="h-4 w-4" />
              Job Feed
            </button>
            <button
              onClick={() => setActiveTab('triggers')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                activeTab === 'triggers' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <CalendarClock className="h-4 w-4" />
              Daily Triggers
            </button>
            <button
              onClick={() => setActiveTab('teams')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                activeTab === 'teams' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Users className="h-4 w-4" />
              Teams
            </button>
            <button
              onClick={() => setActiveTab('feedback')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                activeTab === 'feedback' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Star className="h-4 w-4" />
              Feedback
            </button>
          </div>

          <StatsBar key={refreshKey} />

          {activeTab === 'jobs' ? (
            <JobFeed
              jobs={jobs}
              loading={loading}
              error={error}
              selectedDomain={selectedDomain}
              onOpenSidebar={() => setSidebarOpen(true)}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              userId={userId}
              hasProfile={!!auth.profile}
            />
          ) : activeTab === 'triggers' ? (
            <DigestView digests={digests} loading={digestsLoading} />
          ) : activeTab === 'teams' ? (
            <TeamsPage />
          ) : (
            <FeedbackPage />
          )
        </main>
      </div>

      {/* Floating agent button */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-5 right-5 z-30 flex items-center gap-2 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 px-4 py-3 font-semibold text-white shadow-xl shadow-violet-500/30 transition hover:scale-105 active:scale-95"
      >
        {chatOpen ? (
          <MessageCircle className="h-5 w-5" />
        ) : (
          <>
            <Sparkles className="h-5 w-5" />
            <span className="hidden sm:inline">Ask Agent</span>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
            </span>
          </>
        )}
      </button>

      <AgentChat isOpen={chatOpen} onClose={() => setChatOpen(false)} />
      {auth.profile && (
        <EditProfileModal
          isOpen={editProfileOpen}
          onClose={() => setEditProfileOpen(false)}
          profile={auth.profile}
          domains={domains}
          onSaved={auth.refreshProfile}
        />
      )}
      <SubscribeModal
        isOpen={subscribeOpen}
        onClose={() => setSubscribeOpen(false)}
        domains={domains}
      />
    </div>
  );
}

export default App;
