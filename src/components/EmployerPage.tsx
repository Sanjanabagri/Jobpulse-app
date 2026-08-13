import { useState } from 'react';
import { Loader2, Plus, Briefcase, Trash2, ExternalLink, MapPin, Building2, Sparkles, Edit3, X, Check, Rocket } from 'lucide-react';
import { useCompanyProfile, useEmployerJobs } from '@/hooks/useEmployer';
import { useAuth } from '@/hooks/useAuth';
import { timeAgo } from '@/lib/utils';
import type { EmployerJob, EmployerJobStatus, CompanyProfile } from '@/types';
import type { Domain } from '@/types';

export function EmployerPage({ domains }: { domains: Domain[] }) {
  const auth = useAuth();
  const { company, loading: companyLoading, createCompany } = useCompanyProfile();
  const { jobs, loading: jobsLoading, createJob, updateJob, deleteJob } = useEmployerJobs();

  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [showJobForm, setShowJobForm] = useState(false);
  const [editingJob, setEditingJob] = useState<EmployerJob | null>(null);

  if (companyLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Employer Dashboard</h2>
          <p className="mt-1 text-sm text-slate-500">Create a company profile to start posting jobs.</p>
        </div>
        {showCompanyForm ? (
          <CompanyForm
            onSubmit={async (input) => { await createCompany(input); setShowCompanyForm(false); }}
            onCancel={() => setShowCompanyForm(false)}
          />
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 py-16 text-center">
            <Building2 className="mx-auto mb-3 h-12 w-12 text-slate-200" />
            <p className="text-sm font-medium text-slate-600">No company profile yet</p>
            <p className="mt-1 text-sm text-slate-400">Create your company profile to post jobs and reach candidates.</p>
            <button
              onClick={() => setShowCompanyForm(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" /> Create Company Profile
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Company header */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-sky-500/20">
            {company.logo_url ? (
              <img src={company.logo_url} alt={company.name} className="h-14 w-14 rounded-2xl object-cover" />
            ) : (
              <Building2 className="h-6 w-6 text-white" />
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">{company.name}</h2>
            <div className="mt-0.5 flex items-center gap-2 text-sm text-slate-500">
              {company.industry && <span>{company.industry}</span>}
              {company.location && <><span>·</span><MapPin className="h-3.5 w-3.5" /><span>{company.location}</span></>}
              {company.size_range && <><span>·</span><span>{company.size_range}</span></>}
            </div>
          </div>
        </div>
        <button
          onClick={() => { setEditingJob(null); setShowJobForm(true); }}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Post a Job</span>
        </button>
      </div>

      {showJobForm && (
        <div className="mb-6">
          <JobForm
            domains={domains}
            company={company}
            editingJob={editingJob}
            onSubmit={async (input) => {
              if (editingJob) {
                await updateJob(editingJob.id, input);
              } else {
                await createJob(input);
              }
              setShowJobForm(false);
              setEditingJob(null);
            }}
            onCancel={() => { setShowJobForm(false); setEditingJob(null); }}
          />
        </div>
      )}

      {/* Jobs list */}
      <div className="mb-3 flex items-center gap-2">
        <Briefcase className="h-5 w-5 text-slate-400" />
        <h3 className="text-lg font-semibold text-slate-900">Posted Jobs</h3>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">{jobs.length}</span>
      </div>

      {jobsLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center">
          <Briefcase className="mx-auto mb-2 h-10 w-10 text-slate-200" />
          <p className="text-sm text-slate-400">No jobs posted yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <EmployerJobCard
              key={job.id}
              job={job}
              onEdit={() => { setEditingJob(job); setShowJobForm(true); }}
              onDelete={() => { if (confirm('Delete this job?')) deleteJob(job.id); }}
              onTogglePromoted={() => updateJob(job.id, { is_promoted: !job.is_promoted })}
              onToggleStatus={() => {
                const next: EmployerJobStatus = job.status === 'draft' ? 'active' : job.status === 'active' ? 'closed' : 'draft';
                updateJob(job.id, { status: next, posted_at: next === 'active' && !job.posted_at ? new Date().toISOString() : job.posted_at });
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CompanyForm({ onSubmit, onCancel }: {
  onSubmit: (input: Partial<CompanyProfile>) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState('');
  const [sizeRange, setSizeRange] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        name: name.trim(),
        website: website.trim() || undefined,
        description: description.trim() || undefined,
        industry: industry.trim() || undefined,
        location: location.trim() || undefined,
        size_range: sizeRange.trim() || undefined,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Company name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Website</label>
            <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Industry</label>
            <input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Technology, Finance..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Location</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Bangalore, India"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Company size</label>
            <input value={sizeRange} onChange={(e) => setSizeRange(e.target.value)} placeholder="11-50, 51-200..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100" />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">About the company</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100" />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex items-center gap-2">
          <button type="submit" disabled={saving || !name.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Create Company
          </button>
          <button type="button" onClick={onCancel}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function JobForm({ domains, company, editingJob, onSubmit, onCancel }: {
  domains: Domain[];
  company: CompanyProfile;
  editingJob: EmployerJob | null;
  onSubmit: (input: any) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(editingJob?.title ?? '');
  const [description, setDescription] = useState(editingJob?.description ?? '');
  const [location, setLocation] = useState(editingJob?.location ?? '');
  const [isRemote, setIsRemote] = useState(editingJob?.is_remote ?? false);
  const [jobType, setJobType] = useState(editingJob?.job_type ?? 'full-time');
  const [experienceLevel, setExperienceLevel] = useState(editingJob?.experience_level ?? '');
  const [salaryMin, setSalaryMin] = useState(editingJob?.salary_min?.toString() ?? '');
  const [salaryMax, setSalaryMax] = useState(editingJob?.salary_max?.toString() ?? '');
  const [tagsInput, setTagsInput] = useState(editingJob?.tags?.join(', ') ?? '');
  const [status, setStatus] = useState<EmployerJobStatus>(editingJob?.status ?? 'draft');
  const [isPromoted, setIsPromoted] = useState(editingJob?.is_promoted ?? false);
  const [domainId, setDomainId] = useState(editingJob?.domain_id ?? '');
  const [applyUrl, setApplyUrl] = useState(editingJob?.apply_url ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        company_profile_id: company.id,
        title: title.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        is_remote: isRemote,
        job_type: jobType,
        experience_level: experienceLevel.trim() || undefined,
        salary_min: salaryMin ? parseInt(salaryMin) : undefined,
        salary_max: salaryMax ? parseInt(salaryMax) : undefined,
        tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
        status,
        is_promoted: isPromoted,
        domain_id: domainId || undefined,
        apply_url: applyUrl.trim() || undefined,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">{editingJob ? 'Edit Job' : 'Post a New Job'}</h3>
        <button onClick={onCancel} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
          <X className="h-5 w-5" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Job title *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Location</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Bangalore / Remote"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Job type</label>
            <select value={jobType} onChange={(e) => setJobType(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100">
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
              <option value="freelance">Freelance</option>
            </select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Experience level</label>
            <select value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100">
              <option value="">Any</option>
              <option value="entry">Entry (0-2 yrs)</option>
              <option value="junior">Junior (2-4 yrs)</option>
              <option value="mid">Mid (4-7 yrs)</option>
              <option value="senior">Senior (7-10 yrs)</option>
              <option value="lead">Lead (10+ yrs)</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Domain</label>
            <select value={domainId} onChange={(e) => setDomainId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100">
              <option value="">Select domain</option>
              {domains.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Salary min</label>
            <input type="number" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Salary max</label>
            <input type="number" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100" />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Tags (comma-separated)</label>
          <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="React, TypeScript, AWS"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Apply URL / Email</label>
          <input value={applyUrl} onChange={(e) => setApplyUrl(e.target.value)} placeholder="https://... or careers@company.com"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100" />
        </div>
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => setIsRemote(!isRemote)}
            className={`flex items-center justify-between rounded-xl border px-4 py-2.5 text-sm transition flex-1 ${
              isRemote ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-700'
            }`}>
            {isRemote ? 'Remote OK' : 'Not remote'}
            <span className={`relative h-5 w-9 rounded-full transition ${isRemote ? 'bg-emerald-500' : 'bg-slate-300'}`}>
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${isRemote ? 'left-4' : 'left-0.5'}`} />
            </span>
          </button>
          <select value={status} onChange={(e) => setStatus(e.target.value as EmployerJobStatus)}
            className="rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-sky-400 focus:outline-none">
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <button type="button" onClick={() => setIsPromoted(!isPromoted)}
          className={`flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-sm transition ${
            isPromoted ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-slate-200 bg-slate-50 text-slate-700'
          }`}>
          <span className="flex items-center gap-2">
            <Rocket className="h-4 w-4" />
            {isPromoted ? 'Promoted — appears at top of feed' : 'Promote this job (premium)'}
          </span>
          <span className={`relative h-5 w-9 rounded-full transition ${isPromoted ? 'bg-amber-500' : 'bg-slate-300'}`}>
            <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${isPromoted ? 'left-4' : 'left-0.5'}`} />
          </span>
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex items-center gap-2">
          <button type="submit" disabled={saving || !title.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {editingJob ? 'Update Job' : 'Post Job'}
          </button>
          <button type="button" onClick={onCancel}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function EmployerJobCard({ job, onEdit, onDelete, onTogglePromoted, onToggleStatus }: {
  job: EmployerJob;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePromoted: () => void;
  onToggleStatus: () => void;
}) {
  const statusConfig: Record<string, { label: string; color: string }> = {
    draft: { label: 'Draft', color: 'text-slate-600 bg-slate-100' },
    active: { label: 'Active', color: 'text-emerald-700 bg-emerald-50' },
    closed: { label: 'Closed', color: 'text-red-600 bg-red-50' },
  };
  const sc = statusConfig[job.status] ?? statusConfig.draft;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900">{job.title}</h3>
            {job.is_promoted && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                <Sparkles className="h-3 w-3" /> Promoted
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${sc.color}`}>{sc.label}</span>
            {job.location && <><MapPin className="h-3.5 w-3.5" /><span>{job.location}</span></>}
            {job.is_remote && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-600">Remote</span>}
            {job.job_type && <span className="text-xs text-slate-400">{job.job_type}</span>}
          </div>
          {job.tags && job.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {job.tags.slice(0, 6).map((tag) => (
                <span key={tag} className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{tag}</span>
              ))}
            </div>
          )}
          <p className="mt-2 text-xs text-slate-400">
            {job.posted_at ? `Posted ${timeAgo(job.posted_at)}` : 'Not posted yet'}
            {job.salary_min && job.salary_max && ` · ${job.salary_min}-${job.salary_max} ${job.currency}`}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          {job.apply_url && (
            <a href={job.apply_url} target="_blank" rel="noopener noreferrer"
              className="rounded-lg p-2 text-slate-400 transition hover:bg-sky-50 hover:text-sky-600">
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
          <button onClick={onTogglePromoted} title="Toggle promoted"
            className={`rounded-lg p-2 transition ${job.is_promoted ? 'text-amber-500 hover:bg-amber-50' : 'text-slate-300 hover:bg-slate-100 hover:text-amber-500'}`}>
            <Sparkles className="h-4 w-4" />
          </button>
          <button onClick={onToggleStatus} title="Change status"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100">
            <Rocket className="h-4 w-4" />
          </button>
          <button onClick={onEdit} className="rounded-lg p-2 text-slate-400 transition hover:bg-sky-50 hover:text-sky-600">
            <Edit3 className="h-4 w-4" />
          </button>
          <button onClick={onDelete} className="rounded-lg p-2 text-slate-300 transition hover:bg-red-50 hover:text-red-500">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
