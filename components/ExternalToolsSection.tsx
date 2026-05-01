'use client';

import { useState } from 'react';
import { ExternalTool, ExternalToolCategory } from '@/lib/types';

interface ExternalToolsSectionProps {
  tools: ExternalTool[];
}

type Filter = 'All' | ExternalToolCategory;

const FILTERS: Filter[] = [
  'All',
  ExternalToolCategory.SIMULATOR,
  ExternalToolCategory.CALCULATOR,
  ExternalToolCategory.DASHBOARD,
  ExternalToolCategory.EXPLORER,
  ExternalToolCategory.CLAIM,
];

const CATEGORY_BADGE: Record<ExternalToolCategory, string> = {
  [ExternalToolCategory.SIMULATOR]: 'badge-sm-secondary',
  [ExternalToolCategory.CALCULATOR]: 'badge-sm-primary',
  [ExternalToolCategory.DASHBOARD]: 'badge-sm-accent',
  [ExternalToolCategory.EXPLORER]: 'badge-sm-warning',
  [ExternalToolCategory.CLAIM]: 'badge-sm-danger',
};

const ExternalLinkIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
    />
  </svg>
);

const ArrowRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m0 0l-6-6m6 6l-6 6" />
  </svg>
);

const InfoIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

function ToolRow({ tool, isLast }: { tool: ExternalTool; isLast: boolean }) {
  return (
    <a
      href={tool.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group block px-5 py-4 ${
        isLast ? '' : 'border-b border-border'
      } transition-colors hover:bg-card-hover`}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5">
          <h3 className="font-heading text-[14px] font-semibold tracking-tight text-foreground">
            {tool.name}
          </h3>
          {tool.featured && (
            <span
              data-testid="featured-badge"
              className="inline-flex items-center rounded-full bg-primary px-2 py-0.5 font-heading text-[11px] font-medium text-white"
            >
              Featured
            </span>
          )}
          {tool.categories.map((cat) => (
            <span key={cat} className={`${CATEGORY_BADGE[cat]} font-heading`}>
              {cat}
            </span>
          ))}
        </div>
        <div className="inline-flex shrink-0 items-center gap-1.5 text-[11px] text-muted">
          <span>{tool.host}</span>
          <ExternalLinkIcon className="h-3.5 w-3.5 transition-colors group-hover:text-primary" />
        </div>
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-muted">{tool.description}</p>
      <div className="mt-2 text-xs leading-relaxed text-muted">
        <span className="font-medium text-foreground">{tool.inputs}</span>
        <span className="mx-1.5">→</span>
        {tool.outputs}
      </div>
    </a>
  );
}

export default function ExternalToolsSection({ tools }: ExternalToolsSectionProps) {
  const [filter, setFilter] = useState<Filter>('All');
  const visible = tools.filter(
    (t) => filter === 'All' || t.categories.includes(filter),
  );

  return (
    <section className="mt-20">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            External Tools
          </h2>
          <p className="text-sm text-muted">
            Calculators, simulators, dashboards, and explorers from across the SSV community.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setFilter(c)}
              className={filter === c ? 'filter-btn-active' : 'filter-btn'}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        {visible.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-muted">
            No tools match this filter.
          </div>
        ) : (
          visible.map((tool, i) => (
            <ToolRow key={tool.id} tool={tool} isLast={i === visible.length - 1} />
          ))
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-dashed border-border bg-card px-5 py-3.5">
        <div className="flex items-center gap-3 text-[13px] text-muted">
          <InfoIcon className="h-4 w-4 flex-shrink-0" />
          <span>
            Built a tool the DAO would use? Submit it for inclusion — community tools are curated, not auto-listed.
          </span>
        </div>
        <a
          href="https://github.com/BenAffleck/ssv-daox/issues/new"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-primary hover:opacity-80"
        >
          Submit a tool
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </a>
      </div>
    </section>
  );
}
