import { LayoutGrid, X } from 'lucide-react';
import { useState } from 'react';
import type { Domain } from '@/types';
import { DomainIcon } from './DomainIcon';
import { useJobStats } from '@/hooks/useData';

interface SidebarProps {
  domains: Domain[];
  selectedSlug: string | null;
  onSelect: (slug: string | null) => void;
  isOpen: boolean;
  onClose: () => void;
}

const TECH_SLUGS = new Set([
  'frontend', 'backend', 'fullstack', 'devops', 'data-science', 'mobile',
  'design', 'product', 'security', 'blockchain', 'qa', 'devrel',
]);

function groupDomains(domains: Domain[]) {
  const tech: Domain[] = [];
  const nonTech: Domain[] = [];
  for (const d of domains) {
    if (TECH_SLUGS.has(d.slug)) tech.push(d);
    else nonTech.push(d);
  }
  return { tech, nonTech };
}

export function Sidebar({ domains, selectedSlug, onSelect, isOpen, onClose }: SidebarProps) {
  const { stats } = useJobStats();
  const countFor = (slug: string) => stats.perDomain.find((d) => d.domain.slug === slug)?.count ?? 0;
  const { tech, nonTech } = groupDomains(domains);
  const [showAllTech, setShowAllTech] = useState(true);
  const [showAllNonTech, setShowAllNonTech] = useState(true);

  function renderDomainButton(domain: Domain) {
    const count = countFor(domain.slug);
    const isSelected = selectedSlug === domain.slug;
    return (
      <button
        key={domain.id}
        onClick={() => { onSelect(domain.slug); onClose(); }}
        className={`group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition ${
          isSelected
            ? 'bg-slate-900 text-white'
            : 'text-slate-700 hover:bg-slate-100'
        }`}
      >
        <span className="flex items-center gap-2.5 truncate">
          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${domain.color} text-white shadow-sm`}>
            <DomainIcon name={domain.icon} className="h-3.5 w-3.5" />
          </span>
          <span className="truncate">{domain.name}</span>
        </span>
        {count > 0 && (
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
            isSelected ? 'bg-white/20' : 'bg-slate-100 text-slate-600 group-hover:bg-white'
          }`}>
            {count}
          </span>
        )}
      </button>
    );
  }

  function renderSection(label: string, items: Domain[], expanded: boolean, onToggle: () => void) {
    if (items.length === 0) return null;
    return (
      <div className="mb-2">
        <button
          onClick={onToggle}
          className="flex w-full items-center justify-between px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-600"
        >
          {label}
          <span className="text-slate-300">{expanded ? '−' : '+'}</span>
        </button>
        {expanded && <div className="space-y-0.5">{items.map(renderDomainButton)}</div>}
      </div>
    );
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-30 h-full w-72 transform border-r border-slate-200 bg-white transition-transform duration-300 lg:sticky lg:top-16 lg:z-10 lg:h-[calc(100vh-4rem)] lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 lg:hidden">
          <span className="font-semibold text-slate-900">Domains</span>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <div className="flex h-full flex-col overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Job Domains
          </p>

          <button
            onClick={() => { onSelect(null); onClose(); }}
            className={`mb-1 flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              selectedSlug === null
                ? 'bg-slate-900 text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <LayoutGrid className="h-4 w-4" />
              All Jobs
            </span>
            <span className={`rounded-full px-2 py-0.5 text-xs ${selectedSlug === null ? 'bg-white/20' : 'bg-slate-100 text-slate-600'}`}>
              {stats.total}
            </span>
          </button>

          {renderSection('Tech & Engineering', tech, showAllTech, () => setShowAllTech(!showAllTech))}
          {renderSection('Business & Other', nonTech, showAllNonTech, () => setShowAllNonTech(!showAllNonTech))}

          <div className="mt-auto rounded-xl bg-gradient-to-br from-sky-50 to-blue-50 p-4">
            <p className="text-xs font-semibold text-sky-900">Daily Triggers</p>
            <p className="mt-1 text-xs text-sky-700">
              The agent crawls job portals every day at 06:00 UTC and generates domain-wise triggers at 07:00 UTC.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
