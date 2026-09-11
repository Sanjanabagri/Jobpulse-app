import { useState, useEffect, useRef } from 'react';
import {
  X, Loader2, Save, Plus, Award, Target, MapPin, Briefcase, GraduationCap,
  FileText, Upload, Trash2, CheckCircle2, User, ChevronRight,
} from 'lucide-react';
import type { Profile, Domain } from '@/types';
import { supabase } from '@/lib/supabase';
import { DomainIcon } from './DomainIcon';
import { useWorkExperience, useEducations, useResumes } from '@/hooks/useProfileData';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
  domains: Domain[];
  onSaved: () => void;
}

const COMMON_SKILLS = [
  'React', 'TypeScript', 'JavaScript', 'Python', 'Java', 'Go', 'Node.js',
  'Vue', 'Angular', 'Flutter', 'Swift', 'Kotlin', 'Rust', 'C++', 'PHP', 'Ruby', 'Scala',
  'AWS', 'Docker', 'Kubernetes', 'PostgreSQL', 'MongoDB', 'GraphQL',
  'Redis', 'Elasticsearch', 'Terraform', 'CI/CD', 'Jenkins', 'Linux',
  'TensorFlow', 'PyTorch', 'Machine Learning', 'Data Analysis', 'SQL',
  'Figma', 'UI/UX', 'Product Management', 'Agile',
  'CCNA', 'CCNP', 'Routing', 'Switching', 'Firewall', 'Cisco', 'Network Security', 'TCP/IP',
  'SEO', 'SEM', 'Google Ads', 'Social Media Marketing', 'Content Marketing', 'Email Marketing', 'HubSpot', 'Google Analytics', 'Growth Hacking',
  'Financial Modeling', 'Excel', 'FP&A', 'Risk Management', 'Investment Banking', 'Treasury', 'Bloomberg', 'CFA',
  'Recruitment', 'Talent Acquisition', 'Payroll', 'Employee Relations', 'HRIS', 'Performance Management', 'Onboarding', 'Workday',
  'B2B Sales', 'B2C Sales', 'Account Management', 'Business Development', 'CRM', 'Salesforce', 'Lead Generation', 'Negotiation',
  'Process Optimization', 'Supply Chain Management', 'Six Sigma', 'Lean', 'Project Management', 'Operations Management',
  'Customer Success', 'Helpdesk', 'Zendesk', 'Technical Support', 'Ticketing Systems', 'CX',
  'Inventory Management', 'Warehousing', 'Procurement', 'Shipping', 'Freight', 'ERP', 'SAP MM',
  'Curriculum Development', 'Instructional Design', 'LMS', 'Teaching', 'Training Delivery', 'E-learning',
  'Copywriting', 'Technical Writing', 'Content Strategy', 'Editing', 'Blogging', 'SEO Writing', 'Ghostwriting',
  'Bookkeeping', 'Taxation', 'Audit', 'Tally', 'QuickBooks', 'Accounts Payable', 'Accounts Receivable', 'GST',
  'Corporate Law', 'Contract Drafting', 'Compliance', 'Litigation', 'Paralegal', 'Legal Research',
  'Patient Care', 'Nursing', 'Clinical Research', 'Pharma', 'Medical Devices', 'Healthcare Administration', 'HIPAA',
  'Management Consulting', 'Strategy', 'Advisory', 'Business Analysis', 'M&A', 'Case Studies',
];

type Tab = 'basic' | 'experience' | 'education' | 'resume';

export function EditProfileModal({ isOpen, onClose, profile, domains, onSaved }: EditProfileModalProps) {
  const [tab, setTab] = useState<Tab>('basic');
  const [fullName, setFullName] = useState(profile.full_name);
  const [headline, setHeadline] = useState(profile.headline);
  const [preferredDomainId, setPreferredDomainId] = useState(profile.preferred_domain_id);
  const [skills, setSkills] = useState<string[]>(profile.skills);
  const [skillInput, setSkillInput] = useState('');
  const [experienceYears, setExperienceYears] = useState(profile.experience_years);
  const [currentJobTitle, setCurrentJobTitle] = useState(profile.current_job_title);
  const [currentCompany, setCurrentCompany] = useState(profile.current_company);
  const [location, setLocation] = useState(profile.location);
  const [preferredLocation, setPreferredLocation] = useState(profile.preferred_location);
  const [remoteOnly, setRemoteOnly] = useState(profile.remote_only);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const workExp = useWorkExperience();
  const educations = useEducations();
  const resumes = useResumes();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFullName(profile.full_name);
      setHeadline(profile.headline);
      setPreferredDomainId(profile.preferred_domain_id);
      setSkills(profile.skills);
      setExperienceYears(profile.experience_years);
      setCurrentJobTitle(profile.current_job_title);
      setCurrentCompany(profile.current_company);
      setLocation(profile.location);
      setPreferredLocation(profile.preferred_location);
      setRemoteOnly(profile.remote_only);
      setError('');
      setTab('basic');
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  function addSkill(skill: string) {
    const trimmed = skill.trim();
    if (trimmed && !skills.includes(trimmed)) setSkills([...skills, trimmed]);
    setSkillInput('');
  }

  function removeSkill(skill: string) {
    setSkills(skills.filter((s) => s !== skill));
  }

  async function handleSave() {
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
        })
        .eq('id', profile.id);
      if (updateError) throw updateError;
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // Completeness calculation
  const completeness = (() => {
    let score = 0;
    if (fullName.trim()) score += 15;
    if (headline.trim()) score += 10;
    if (preferredDomainId) score += 10;
    if (skills.length >= 3) score += 15;
    if (currentJobTitle.trim()) score += 10;
    if (location.trim()) score += 10;
    if (workExp.items.length > 0) score += 10;
    if (educations.items.length > 0) score += 10;
    if (resumes.items.length > 0) score += 10;
    return Math.min(score, 100);
  })();

  const filteredSuggestions = COMMON_SKILLS.filter(
    (s) => !skills.includes(s) && s.toLowerCase().includes(skillInput.toLowerCase())
  ).slice(0, 6);

  const tabs: { id: Tab; label: string; icon: typeof User }[] = [
    { id: 'basic', label: 'Basics', icon: User },
    { id: 'experience', label: 'Experience', icon: Briefcase },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'resume', label: 'Resume', icon: FileText },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-900">Edit Profile</h2>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all duration-500"
                  style={{ width: `${completeness}%` }}
                />
              </div>
              <span className="text-xs font-medium text-slate-500">{completeness}%</span>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-200 px-4">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition ${
                  tab === t.id ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'basic' && (
            <div className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Full name</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Headline</label>
                <input type="text" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="e.g. Senior Backend Engineer"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Current role</label>
                  <input type="text" value={currentJobTitle} onChange={(e) => setCurrentJobTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Company</label>
                  <input type="text" value={currentCompany} onChange={(e) => setCurrentCompany(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Years of experience</label>
                  <input type="number" min="0" max="50" value={experienceYears} onChange={(e) => setExperienceYears(parseInt(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Location</label>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input type="text" value={location} onChange={(e) => setLocation(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100" />
                  </div>
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 flex items-center gap-1.5">
                  <Target className="h-4 w-4 text-slate-400" /> Primary domain
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {domains.map((d) => (
                    <button key={d.id} onClick={() => setPreferredDomainId(d.id)}
                      className={`flex items-center gap-1.5 rounded-xl border p-2 text-left transition ${preferredDomainId === d.id ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900' : 'border-slate-200 hover:bg-slate-50'}`}>
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${d.color} text-white`}>
                        <DomainIcon name={d.icon} className="h-3 w-3" />
                      </span>
                      <span className="truncate text-xs font-medium text-slate-700">{d.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-slate-400" /> Skills ({skills.length})
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {skills.map((s) => (
                    <span key={s} className="flex items-center gap-1 rounded-lg bg-sky-50 px-2.5 py-1 text-sm font-medium text-sky-700">
                      {s}
                      <button onClick={() => removeSkill(s)} className="text-sky-400 hover:text-sky-700"><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
                <div className="relative">
                  <input type="text" value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (skillInput.trim()) addSkill(skillInput); } }}
                    placeholder="Type a skill and press Enter..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100" />
                  {skillInput && filteredSuggestions.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                      {filteredSuggestions.map((s) => (
                        <button key={s} onClick={() => addSkill(s)}
                          className="flex w-full items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100">
                          <Plus className="h-3 w-3 text-slate-400" /> {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Preferred location</label>
                <input type="text" value={preferredLocation} onChange={(e) => setPreferredLocation(e.target.value)} placeholder="Bangalore / Remote"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100" />
              </div>
              <button onClick={() => setRemoteOnly(!remoteOnly)}
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-sm transition ${remoteOnly ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                {remoteOnly ? 'Remote jobs only' : 'Open to all job types'}
                <span className={`relative h-5 w-9 rounded-full transition ${remoteOnly ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${remoteOnly ? 'left-4' : 'left-0.5'}`} />
                </span>
              </button>
            </div>
          )}

          {tab === 'experience' && <WorkExperienceTab hook={workExp} />}
          {tab === 'education' && <EducationTab hook={educations} />}
          {tab === 'resume' && <ResumeTab hook={resumes} fileInputRef={fileInputRef} />}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-4">
          <div className="text-xs text-slate-400">
            {completeness < 100 ? `${100 - completeness}% to complete profile` : 'Profile complete!'}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><Save className="h-4 w-4" /> Save changes</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ WORK EXPERIENCE TAB ============

function WorkExperienceTab({ hook }: { hook: ReturnType<typeof useWorkExperience> }) {
  const { items, loading, add, remove } = hook;
  const [showForm, setShowForm] = useState(false);
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isCurrent, setIsCurrent] = useState(false);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!company.trim() || !title.trim() || !startDate) return;
    setSaving(true);
    try {
      await add({
        company: company.trim(),
        title: title.trim(),
        start_date: startDate,
        end_date: isCurrent ? null : (endDate || null),
        description: description.trim() || null,
        location: location.trim() || null,
        is_current: isCurrent,
      });
      setCompany(''); setTitle(''); setStartDate(''); setEndDate(''); setDescription(''); setLocation(''); setIsCurrent(false);
      setShowForm(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-slate-300" /></div>;

  return (
    <div className="space-y-4">
      {items.length === 0 && !showForm && (
        <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center">
          <Briefcase className="mx-auto mb-2 h-10 w-10 text-slate-200" />
          <p className="text-sm text-slate-400">No work experience added yet</p>
        </div>
      )}
      {items.map((exp) => (
        <div key={exp.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold text-slate-900">{exp.title}</h4>
              <p className="text-sm text-slate-600">{exp.company}{exp.location && ` · ${exp.location}`}</p>
              <p className="mt-0.5 text-xs text-slate-400">
                {new Date(exp.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} — {exp.is_current ? 'Present' : exp.end_date ? new Date(exp.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''}
              </p>
              {exp.description && <p className="mt-2 text-sm text-slate-600">{exp.description}</p>}
            </div>
            <button onClick={() => remove(exp.id)} className="rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
      {showForm ? (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <input placeholder="Company *" value={company} onChange={(e) => setCompany(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-sky-400 focus:bg-white focus:outline-none" />
            <input placeholder="Job title *" value={title} onChange={(e) => setTitle(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-sky-400 focus:bg-white focus:outline-none" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-slate-500">Start date *</label>
              <input type="month" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-sky-400 focus:bg-white focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">End date</label>
              <input type="month" value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={isCurrent}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-sky-400 focus:bg-white focus:outline-none disabled:opacity-40" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={isCurrent} onChange={(e) => setIsCurrent(e.target.checked)} className="rounded" />
            I currently work here
          </label>
          <input placeholder="Location (optional)" value={location} onChange={(e) => setLocation(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-sky-400 focus:bg-white focus:outline-none" />
          <textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-sky-400 focus:bg-white focus:outline-none" />
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={saving || !company.trim() || !title.trim() || !startDate}
              className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add
            </button>
            <button onClick={() => setShowForm(false)} className="rounded-lg px-4 py-2 text-sm text-slate-500 hover:bg-slate-100">Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-3 text-sm font-medium text-slate-600 transition hover:border-sky-400 hover:bg-sky-50 hover:text-sky-700">
          <Plus className="h-4 w-4" /> Add work experience
        </button>
      )}
    </div>
  );
}

// ============ EDUCATION TAB ============

function EducationTab({ hook }: { hook: ReturnType<typeof useEducations> }) {
  const { items, loading, add, remove } = hook;
  const [showForm, setShowForm] = useState(false);
  const [institution, setInstitution] = useState('');
  const [degree, setDegree] = useState('');
  const [fieldOfStudy, setFieldOfStudy] = useState('');
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');
  const [grade, setGrade] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!institution.trim() || !degree.trim()) return;
    setSaving(true);
    try {
      await add({
        institution: institution.trim(),
        degree: degree.trim(),
        field_of_study: fieldOfStudy.trim() || null,
        start_year: startYear ? parseInt(startYear) : null,
        end_year: endYear ? parseInt(endYear) : null,
        grade_percentage: grade.trim() || null,
        description: description.trim() || null,
      });
      setInstitution(''); setDegree(''); setFieldOfStudy(''); setStartYear(''); setEndYear(''); setGrade(''); setDescription('');
      setShowForm(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-slate-300" /></div>;

  return (
    <div className="space-y-4">
      {items.length === 0 && !showForm && (
        <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center">
          <GraduationCap className="mx-auto mb-2 h-10 w-10 text-slate-200" />
          <p className="text-sm text-slate-400">No education added yet</p>
        </div>
      )}
      {items.map((edu) => (
        <div key={edu.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold text-slate-900">{edu.degree}</h4>
              <p className="text-sm text-slate-600">{edu.institution}{edu.field_of_study && ` · ${edu.field_of_study}`}</p>
              <p className="mt-0.5 text-xs text-slate-400">
                {edu.start_year ? `${edu.start_year}` : ''}{edu.end_year ? ` — ${edu.end_year}` : ''}
                {edu.grade_percentage && ` · ${edu.grade_percentage}`}
              </p>
              {edu.description && <p className="mt-2 text-sm text-slate-600">{edu.description}</p>}
            </div>
            <button onClick={() => remove(edu.id)} className="rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
      {showForm ? (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <input placeholder="Institution *" value={institution} onChange={(e) => setInstitution(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-sky-400 focus:bg-white focus:outline-none" />
          <input placeholder="Degree * (e.g. B.Tech, MBA)" value={degree} onChange={(e) => setDegree(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-sky-400 focus:bg-white focus:outline-none" />
          <input placeholder="Field of study (e.g. Computer Science)" value={fieldOfStudy} onChange={(e) => setFieldOfStudy(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-sky-400 focus:bg-white focus:outline-none" />
          <div className="grid gap-3 sm:grid-cols-2">
            <input type="number" placeholder="Start year" value={startYear} onChange={(e) => setStartYear(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-sky-400 focus:bg-white focus:outline-none" />
            <input type="number" placeholder="End year" value={endYear} onChange={(e) => setEndYear(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-sky-400 focus:bg-white focus:outline-none" />
          </div>
          <input placeholder="Grade / Percentage (e.g. 85% or 3.8 GPA)" value={grade} onChange={(e) => setGrade(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-sky-400 focus:bg-white focus:outline-none" />
          <textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-sky-400 focus:bg-white focus:outline-none" />
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={saving || !institution.trim() || !degree.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add
            </button>
            <button onClick={() => setShowForm(false)} className="rounded-lg px-4 py-2 text-sm text-slate-500 hover:bg-slate-100">Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-3 text-sm font-medium text-slate-600 transition hover:border-sky-400 hover:bg-sky-50 hover:text-sky-700">
          <Plus className="h-4 w-4" /> Add education
        </button>
      )}
    </div>
  );
}

// ============ RESUME TAB ============

function ResumeTab({ hook, fileInputRef }: { hook: ReturnType<typeof useResumes>; fileInputRef: React.RefObject<HTMLInputElement> }) {
  const { items, loading, upload, remove, setActive } = hook;
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Maximum 5MB.');
      return;
    }
    const allowed = ['pdf', 'doc', 'docx'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !allowed.includes(ext)) {
      setError('Only PDF, DOC, DOCX files allowed.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      await upload(file);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-slate-300" /></div>;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center">
        <FileText className="mx-auto mb-3 h-12 w-12 text-slate-300" />
        <p className="text-sm font-medium text-slate-700">Upload your resume</p>
        <p className="mt-1 text-xs text-slate-400">PDF, DOC, DOCX — max 5MB</p>
        <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" onChange={handleUpload} className="hidden" />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
        >
          {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</> : <><Upload className="h-4 w-4" /> Choose file</>}
        </button>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      {items.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-slate-700">Your resumes</h4>
          {items.map((r) => (
            <div key={r.id} className={`flex items-center gap-3 rounded-xl border p-3 transition ${r.is_active ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
              <FileText className={`h-5 w-5 ${r.is_active ? 'text-emerald-600' : 'text-slate-400'}`} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{r.file_name}</p>
                <p className="text-xs text-slate-400">
                  {r.file_size ? `${(r.file_size / 1024).toFixed(0)} KB` : ''}
                  {r.is_active && ' · Active'}
                </p>
              </div>
              {!r.is_active && (
                <button onClick={() => setActive(r.id)} className="rounded-lg px-2 py-1 text-xs font-medium text-sky-600 hover:bg-sky-50">
                  Set active
                </button>
              )}
              <button onClick={() => remove(r.id, r.file_path)} className="rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
