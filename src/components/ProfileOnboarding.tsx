import { useState } from 'react';
import { Zap, ArrowRight, ArrowLeft, Check, Plus, X, Loader2, MapPin, Briefcase, Award, Target } from 'lucide-react';
import type { Domain } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { DomainIcon } from './DomainIcon';

interface ProfileOnboardingProps {
  auth: ReturnType<typeof useAuth>;
  domains: Domain[];
}

const COMMON_SKILLS = [
  // Tech — Frontend / Backend / Full Stack
  'React', 'TypeScript', 'JavaScript', 'Python', 'Java', 'Go', 'Node.js',
  'Vue', 'Angular', 'Flutter', 'Swift', 'Kotlin', 'Rust', 'C++', 'PHP', 'Ruby', 'Scala',
  // Tech — DevOps / Cloud / Data
  'AWS', 'Docker', 'Kubernetes', 'PostgreSQL', 'MongoDB', 'GraphQL',
  'Redis', 'Elasticsearch', 'Terraform', 'CI/CD', 'Jenkins', 'Linux',
  'TensorFlow', 'PyTorch', 'Machine Learning', 'Data Analysis', 'SQL',
  // Tech — Other
  'Figma', 'UI/UX', 'Product Management', 'Agile',
  // Network Engineering
  'CCNA', 'CCNP', 'Routing', 'Switching', 'Firewall', 'Cisco', 'Network Security', 'TCP/IP',
  // Marketing
  'SEO', 'SEM', 'Google Ads', 'Social Media Marketing', 'Content Marketing', 'Email Marketing', 'HubSpot', 'Google Analytics', 'Growth Hacking',
  // Finance
  'Financial Modeling', 'Excel', 'FP&A', 'Risk Management', 'Investment Banking', 'Treasury', 'Bloomberg', 'CFA',
  // HR & People
  'Recruitment', 'Talent Acquisition', 'Payroll', 'Employee Relations', 'HRIS', 'Performance Management', 'Onboarding', 'Workday',
  // Sales
  'B2B Sales', 'B2C Sales', 'Account Management', 'Business Development', 'CRM', 'Salesforce', 'Lead Generation', 'Negotiation',
  // Operations
  'Process Optimization', 'Supply Chain Management', 'Six Sigma', 'Lean', 'Project Management', 'Operations Management',
  // Customer Support
  'Customer Success', 'Helpdesk', 'Zendesk', 'Technical Support', 'Ticketing Systems', 'CX',
  // Logistics & Supply Chain
  'Inventory Management', 'Warehousing', 'Procurement', 'Shipping', 'Freight', 'ERP', 'SAP MM',
  // Education & Training
  'Curriculum Development', 'Instructional Design', 'LMS', 'Teaching', 'Training Delivery', 'E-learning',
  // Content & Writing
  'Copywriting', 'Technical Writing', 'Content Strategy', 'Editing', 'Blogging', 'SEO Writing', 'Ghostwriting',
  // Accounting
  'Bookkeeping', 'Taxation', 'Audit', 'Tally', 'QuickBooks', 'Accounts Payable', 'Accounts Receivable', 'GST',
  // Legal
  'Corporate Law', 'Contract Drafting', 'Compliance', 'Litigation', 'Paralegal', 'Legal Research',
  // Healthcare
  'Patient Care', 'Nursing', 'Clinical Research', 'Pharma', 'Medical Devices', 'Healthcare Administration', 'HIPAA',
  // Consulting
  'Management Consulting', 'Strategy', 'Advisory', 'Business Analysis', 'M&A', 'Case Studies',
];

export function ProfileOnboarding({ auth, domains }: ProfileOnboardingProps) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Profile fields
  const [fullName, setFullName] = useState(auth.profile?.full_name || '');
  const [headline, setHeadline] = useState('');
  const [preferredDomainId, setPreferredDomainId] = useState<string | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [experienceYears, setExperienceYears] = useState(0);
  const [currentJobTitle, setCurrentJobTitle] = useState('');
  const [currentCompany, setCurrentCompany] = useState('');
  const [location, setLocation] = useState('');
  const [preferredLocation, setPreferredLocation] = useState('');
  const [remoteOnly, setRemoteOnly] = useState(false);

  const userId = auth.user?.id;
  if (!userId) return null;

  function addSkill(skill: string) {
    const trimmed = skill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
    }
    setSkillInput('');
  }

  function removeSkill(skill: string) {
    setSkills(skills.filter((s) => s !== skill));
  }

  async function handleComplete() {
    if (!userId) return;
    if (skills.length === 0) {
      setError('Add at least one skill so the agent can match jobs to your profile.');
      setStep(2);
      return;
    }
    if (!preferredDomainId) {
      setError('Pick your primary domain so we can personalize your feed.');
      setStep(2);
      return;
    }

    setSaving(true);
    setError('');
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          headline,
          preferred_domain_id: preferredDomainId,
          skills,
          experience_years: experienceYears,
          current_job_title: currentJobTitle,
          current_company: currentCompany,
          location,
          preferred_location: preferredLocation,
          remote_only: remoteOnly,
          profile_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) throw updateError;
      await auth.refreshProfile();
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  }

  const filteredSkillSuggestions = COMMON_SKILLS.filter(
    (s) => !skills.includes(s) && s.toLowerCase().includes(skillInput.toLowerCase())
  ).slice(0, 8);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-sky-500/30">
              <Zap className="h-5 w-5 text-white" fill="white" />
            </div>
            <span className="font-bold text-slate-900">JobPulse</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-20 rounded-full transition ${step >= 1 ? 'bg-sky-500' : 'bg-slate-200'}`} />
            <div className={`h-2 w-20 rounded-full transition ${step >= 2 ? 'bg-sky-500' : 'bg-slate-200'}`} />
            <div className={`h-2 w-20 rounded-full transition ${step >= 3 ? 'bg-sky-500' : 'bg-slate-200'}`} />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-10">
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Let's set up your profile</h1>
              <p className="mt-1 text-sm text-slate-500">This powers your personalized match scores and daily triggers.</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Full name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Headline</label>
                <div className="relative">
                  <Briefcase className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="e.g. Senior Backend Engineer"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Current role</label>
                  <input
                    type="text"
                    value={currentJobTitle}
                    onChange={(e) => setCurrentJobTitle(e.target.value)}
                    placeholder="Software Engineer"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Current company</label>
                  <input
                    type="text"
                    value={currentCompany}
                    onChange={(e) => setCurrentCompany(e.target.value)}
                    placeholder="Acme Inc."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Years of experience</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(parseInt(e.target.value) || 0)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Location</label>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Bangalore, India"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Preferred location</label>
                  <input
                    type="text"
                    value={preferredLocation}
                    onChange={(e) => setPreferredLocation(e.target.value)}
                    placeholder="Bangalore / Remote"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <button onClick={() => setStep(1)} className="mb-3 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <h1 className="text-2xl font-bold text-slate-900">Your domain & skills</h1>
              <p className="mt-1 text-sm text-slate-500">Pick your primary domain and add skills — the agent uses these to compute your match score.</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 flex items-center gap-1.5">
                  <Target className="h-4 w-4 text-slate-400" />
                  Primary domain
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {domains.map((domain) => {
                    const selected = preferredDomainId === domain.id;
                    return (
                      <button
                        key={domain.id}
                        onClick={() => setPreferredDomainId(domain.id)}
                        className={`flex items-center gap-2 rounded-xl border p-2.5 text-left transition ${
                          selected ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${domain.color} text-white`}>
                          <DomainIcon name={domain.icon} className="h-3.5 w-3.5" />
                        </span>
                        <span className="truncate text-xs font-medium text-slate-700">{domain.name}</span>
                        {selected && <Check className="ml-auto h-3.5 w-3.5 shrink-0 text-slate-900" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-slate-400" />
                  Skills {skills.length > 0 && <span className="text-slate-400">({skills.length})</span>}
                </label>

                <div className="flex flex-wrap gap-2 mb-3">
                  {skills.map((skill) => (
                    <span key={skill} className="flex items-center gap-1 rounded-lg bg-sky-50 px-2.5 py-1 text-sm font-medium text-sky-700">
                      {skill}
                      <button onClick={() => removeSkill(skill)} className="text-sky-400 hover:text-sky-700">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (skillInput.trim()) addSkill(skillInput);
                      }
                    }}
                    placeholder="Type a skill and press Enter..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100"
                  />
                  {skillInput && filteredSkillSuggestions.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                      {filteredSkillSuggestions.map((s) => (
                        <button
                          key={s}
                          onClick={() => addSkill(s)}
                          className="flex w-full items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
                        >
                          <Plus className="h-3 w-3 text-slate-400" />
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {COMMON_SKILLS.filter((s) => !skills.includes(s)).slice(0, 12).map((s) => (
                    <button
                      key={s}
                      onClick={() => addSkill(s)}
                      className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 flex items-center justify-between text-sm font-medium text-slate-700">
                  Remote only?
                </label>
                <button
                  onClick={() => setRemoteOnly(!remoteOnly)}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-sm transition ${
                    remoteOnly ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                >
                  {remoteOnly ? 'Yes, show remote jobs only' : 'No, show all jobs'}
                  <span className={`relative h-5 w-9 rounded-full transition ${remoteOnly ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                    <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${remoteOnly ? 'left-4' : 'left-0.5'}`} />
                  </span>
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
            )}

            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!preferredDomainId || skills.length === 0}
                className="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-40"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <button onClick={() => setStep(2)} className="mb-3 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <h1 className="text-2xl font-bold text-slate-900">Review & confirm</h1>
              <p className="mt-1 text-sm text-slate-500">Here's what the agent will use to match jobs to you.</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <ReviewItem label="Name" value={fullName} />
                <ReviewItem label="Headline" value={headline || 'Not set'} />
                <ReviewItem label="Current role" value={currentJobTitle || 'Not set'} />
                <ReviewItem label="Experience" value={`${experienceYears} years`} />
                <ReviewItem label="Location" value={location || 'Not set'} />
                <ReviewItem label="Preferred location" value={preferredLocation || 'Any'} />
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Primary domain</p>
                {(() => {
                  const d = domains.find((d) => d.id === preferredDomainId);
                  return d ? (
                    <div className="mt-1 flex items-center gap-2">
                      <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${d.color} text-white`}>
                        <DomainIcon name={d.icon} className="h-3.5 w-3.5" />
                      </span>
                      <span className="font-medium text-slate-900">{d.name}</span>
                    </div>
                  ) : <p className="mt-1 text-slate-400">Not selected</p>;
                })()}
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Skills ({skills.length})</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {skills.map((s) => (
                    <span key={s} className="rounded-lg bg-sky-50 px-2.5 py-1 text-sm font-medium text-sky-700">{s}</span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${remoteOnly ? 'bg-emerald-100' : 'bg-slate-200'}`}>
                  {remoteOnly ? <Check className="h-4 w-4 text-emerald-600" /> : <X className="h-4 w-4 text-slate-400" />}
                </div>
                <p className="text-sm text-slate-600">{remoteOnly ? 'Remote jobs only' : 'Open to all job types'}</p>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
            )}

            <div className="flex justify-between">
              <button onClick={() => setStep(2)} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                onClick={handleComplete}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
              >
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><Check className="h-4 w-4" /> Complete profile</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 font-medium text-slate-900">{value}</p>
    </div>
  );
}
