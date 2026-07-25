import { useState, useEffect } from 'react';
import { X, Loader2, Save, Plus, Award, Target, MapPin } from 'lucide-react';
import type { Profile, Domain } from '@/types';
import { supabase } from '@/lib/supabase';
import { DomainIcon } from './DomainIcon';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
  domains: Domain[];
  onSaved: () => void;
}

const COMMON_SKILLS = [
  'React', 'TypeScript', 'JavaScript', 'Python', 'Java', 'Go', 'Node.js',
  'AWS', 'Docker', 'Kubernetes', 'PostgreSQL', 'MongoDB', 'GraphQL',
  'Vue', 'Angular', 'Flutter', 'Swift', 'Kotlin', 'TensorFlow', 'PyTorch',
  'Redis', 'Elasticsearch', 'Terraform', 'CI/CD', 'Linux', 'Figma',
  'UI/UX', 'Product Management', 'Machine Learning', 'Data Analysis', 'SQL',
  'Rust', 'C++', 'PHP', 'Ruby', 'Scala',
];

export function EditProfileModal({ isOpen, onClose, profile, domains, onSaved }: EditProfileModalProps) {
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

  const filteredSuggestions = COMMON_SKILLS.filter(
    (s) => !skills.includes(s) && s.toLowerCase().includes(skillInput.toLowerCase())
  ).slice(0, 6);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">Edit Profile</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Full name</label>
            <input
              type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Headline</label>
            <input
              type="text" value={headline} onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Senior Backend Engineer"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Current role</label>
              <input
                type="text" value={currentJobTitle} onChange={(e) => setCurrentJobTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Company</label>
              <input
                type="text" value={currentCompany} onChange={(e) => setCurrentCompany(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Years of experience</label>
              <input
                type="number" min="0" max="50" value={experienceYears}
                onChange={(e) => setExperienceYears(parseInt(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Location</label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text" value={location} onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 flex items-center gap-1.5">
              <Target className="h-4 w-4 text-slate-400" /> Primary domain
            </label>
            <div className="grid grid-cols-3 gap-2">
              {domains.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setPreferredDomainId(d.id)}
                  className={`flex items-center gap-1.5 rounded-xl border p-2 text-left transition ${
                    preferredDomainId === d.id ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
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
                  <button onClick={() => removeSkill(s)} className="text-sky-400 hover:text-sky-700">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="relative">
              <input
                type="text" value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (skillInput.trim()) addSkill(skillInput); } }}
                placeholder="Type a skill and press Enter..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
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
            <input
              type="text" value={preferredLocation} onChange={(e) => setPreferredLocation(e.target.value)}
              placeholder="Bangalore / Remote"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100"
            />
          </div>

          <button
            onClick={() => setRemoteOnly(!remoteOnly)}
            className={`flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-sm transition ${
              remoteOnly ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-700'
            }`}>
            {remoteOnly ? 'Remote jobs only' : 'Open to all job types'}
            <span className={`relative h-5 w-9 rounded-full transition ${remoteOnly ? 'bg-emerald-500' : 'bg-slate-300'}`}>
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${remoteOnly ? 'left-4' : 'left-0.5'}`} />
            </span>
          </button>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}
        </div>

        <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
          <button onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50">
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><Save className="h-4 w-4" /> Save changes</>}
          </button>
        </div>
      </div>
    </div>
  );
}
