'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  Activity,
  Calculator,
  CornerDownLeft,
  ExternalLink,
  Gauge,
  LayoutGrid,
  Search,
  SearchX,
  Telescope,
} from 'lucide-react';
import { ExternalToolCategory, type ExternalTool, type Module } from '@/lib/types';
import {
  buildSearchIndex,
  searchItems,
  type ScoredItem,
  type SearchItem,
} from '@/lib/search';

const OPEN_EVENT = 'daox:open-search';

/** Programmatically open the global search palette from anywhere on the page. */
export function openSearchPalette() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(OPEN_EVENT));
}

interface SearchPaletteProps {
  modules: Module[];
  tools: ExternalTool[];
}

const CATEGORY_BADGE: Record<string, string> = {
  Module: 'badge-sm-primary',
  'Coming Soon': 'badge-sm-muted',
  [ExternalToolCategory.SIMULATOR]: 'badge-sm-secondary',
  [ExternalToolCategory.CALCULATOR]: 'badge-sm-primary',
  [ExternalToolCategory.DASHBOARD]: 'badge-sm-accent',
  [ExternalToolCategory.EXPLORER]: 'badge-sm-warning',
};

function ItemIcon({ item, active }: { item: SearchItem; active: boolean }) {
  const cls = active ? 'text-primary' : 'text-muted';
  if (item.kind === 'module') return <LayoutGrid size={16} className={cls} />;
  const cat = item.category;
  if (cat === ExternalToolCategory.DASHBOARD) return <Gauge size={16} className={cls} />;
  if (cat === ExternalToolCategory.SIMULATOR) return <Activity size={16} className={cls} />;
  if (cat === ExternalToolCategory.EXPLORER) return <Telescope size={16} className={cls} />;
  return <Calculator size={16} className={cls} />;
}

interface ResultRowProps {
  item: SearchItem;
  idx: number;
  active: boolean;
  onHover: () => void;
  onClick: () => void;
}

function ResultRow({ item, idx, active, onHover, onClick }: ResultRowProps) {
  return (
    <div
      data-idx={idx}
      data-active={active ? 'true' : 'false'}
      role="option"
      aria-selected={active}
      onMouseMove={onHover}
      onClick={onClick}
      className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
        active
          ? 'border-primary/40 bg-primary/10'
          : 'border-transparent hover:bg-card-hover'
      }`}
    >
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md border border-border bg-background">
        <ItemIcon item={item} active={active} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="truncate font-heading text-[14px] font-semibold text-foreground">
            {item.name}
          </span>
          {item.featured && (
            <span className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full bg-primary px-2 py-0.5 font-heading text-[11px] font-medium text-white">
              Featured
            </span>
          )}
          <span
            className={`${CATEGORY_BADGE[item.category] ?? 'badge-sm-muted'} shrink-0 whitespace-nowrap font-heading`}
          >
            {item.category}
          </span>
        </div>
        <div className="truncate text-xs text-muted">{item.description}</div>
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted sm:hidden">
          <span className="truncate">{item.host}</span>
          {item.external && <ExternalLink size={11} className="flex-shrink-0" />}
        </div>
      </div>
      <div className="hidden flex-shrink-0 items-center gap-2 text-[11px] text-muted sm:flex">
        <span>{item.host}</span>
        {item.external && <ExternalLink size={13} />}
        {active && <CornerDownLeft size={14} className="text-primary" />}
      </div>
    </div>
  );
}

const KBD_CLASS =
  'inline-flex items-center rounded border border-border bg-background px-1.5 py-px font-heading text-[10px] font-semibold text-foreground';

export default function SearchPalette({ modules, tools }: SearchPaletteProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const index = useMemo(() => buildSearchIndex(modules, tools), [modules, tools]);
  const results: ScoredItem[] = useMemo(() => searchItems(index, q), [index, q]);

  const grouped = useMemo(() => {
    const out: {
      Modules: Array<ScoredItem & { _idx: number }>;
      'External tools': Array<ScoredItem & { _idx: number }>;
    } = { Modules: [], 'External tools': [] };
    results.forEach((r, idx) => {
      const bucket = r.item.kind === 'module' ? 'Modules' : 'External tools';
      out[bucket].push({ ...r, _idx: idx });
    });
    return out;
  }, [results]);

  useEffect(() => {
    setActive(0);
  }, [q]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const el = list.querySelector<HTMLDivElement>(`[data-idx="${active}"]`);
    if (!el) return;
    const elTop = el.offsetTop;
    const elBot = elTop + el.offsetHeight;
    if (elTop < list.scrollTop) list.scrollTop = elTop;
    else if (elBot > list.scrollTop + list.clientHeight) {
      list.scrollTop = elBot - list.clientHeight;
    }
  }, [active]);

  // Global Ctrl/Cmd+K toggle, Esc close, and `daox:open-search` listener
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isToggle = (e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey);
      if (isToggle) {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    const onOpenEvent = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener(OPEN_EVENT, onOpenEvent);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener(OPEN_EVENT, onOpenEvent);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setQ('');
    setActive(0);
    const t = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(t);
  }, [open]);

  const choose = useCallback(
    (item: SearchItem | undefined) => {
      if (!item) return;
      setOpen(false);
      if (item.url === '#') return;
      if (item.external) {
        window.open(item.url, '_blank', 'noopener,noreferrer');
      } else {
        router.push(item.url);
      }
    },
    [router],
  );

  const onInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(results[active]?.item);
    }
  };

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center bg-black/45 px-4 pt-[12vh] backdrop-blur-sm"
      onClick={() => setOpen(false)}
      data-testid="search-palette-scrim"
    >
      <div
        role="dialog"
        aria-label="Search tools and modules"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[70vh] w-full max-w-[640px] flex-col overflow-hidden rounded-xl border border-border bg-card"
        style={{
          boxShadow: '0 24px 60px -12px rgba(0,0,0,.35), var(--shadow-glow-lg)',
          animation: 'palette-in .14s ease-out',
        }}
      >
        <div className="flex items-center gap-2.5 border-b border-border px-4 py-3.5">
          <Search size={18} className="flex-shrink-0 text-muted" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onInputKey}
            placeholder="Search modules, simulators, calculators, dashboards…"
            aria-label="Search query"
            className="flex-1 border-none bg-transparent font-body text-[15px] text-foreground placeholder:text-muted/70 focus:outline-none"
          />
          <span className="rounded border border-border bg-background px-1.5 py-0.5 font-heading text-[11px] font-semibold text-muted">
            Esc
          </span>
        </div>

        <div ref={listRef} className="flex-1 overflow-auto p-2" role="listbox">
          {results.length === 0 ? (
            <div className="flex flex-col items-center px-4 py-10 text-center">
              <SearchX size={22} className="mb-2 text-muted" />
              <div className="text-sm font-medium text-foreground">
                No matches for &ldquo;{q}&rdquo;
              </div>
              <div className="mt-1 text-xs text-muted">
                Try a different keyword, or browse below.
              </div>
            </div>
          ) : (
            Object.entries(grouped).map(([group, items]) =>
              items.length === 0 ? null : (
                <div key={group}>
                  <div className="px-2.5 pb-1 pt-2 font-heading text-[10px] font-semibold uppercase tracking-wider text-muted">
                    {group}
                  </div>
                  {items.map(({ item, _idx }) => (
                    <ResultRow
                      key={item.id}
                      item={item}
                      idx={_idx}
                      active={_idx === active}
                      onHover={() => setActive(_idx)}
                      onClick={() => choose(item)}
                    />
                  ))}
                </div>
              ),
            )
          )}
        </div>

        <div className="flex items-center gap-3.5 border-t border-border bg-card-hover px-3.5 py-2 text-[11px] text-muted">
          <span className="inline-flex items-center gap-1">
            <kbd className={KBD_CLASS}>↑</kbd>
            <kbd className={KBD_CLASS}>↓</kbd>
            navigate
          </span>
          <span className="inline-flex items-center gap-1">
            <kbd className={KBD_CLASS}>↵</kbd>
            open
          </span>
          <span className="inline-flex items-center gap-1">
            <kbd className={KBD_CLASS}>Esc</kbd>
            close
          </span>
          <span className="flex-1" />
          <span>
            {results.length} result{results.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}

interface SearchTriggerProps {
  variant?: 'desktop' | 'mobile';
  className?: string;
}

export function SearchTrigger({ variant = 'desktop', className = '' }: SearchTriggerProps) {
  const [shortcutLabel, setShortcutLabel] = useState('Ctrl K');

  useEffect(() => {
    if (typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform)) {
      setShortcutLabel('⌘ K');
    }
  }, []);

  if (variant === 'mobile') {
    return (
      <button
        type="button"
        onClick={openSearchPalette}
        aria-label="Open search"
        data-testid="search-trigger-mobile"
        className={`flex w-full items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 font-body text-[13px] text-muted transition-colors hover:border-primary ${className}`}
      >
        <Search size={14} />
        <span className="flex-1 text-left">Search modules & tools…</span>
        <span className="inline-flex items-center rounded border border-border bg-background px-1.5 py-0.5 font-heading text-[11px] font-semibold text-muted">
          {shortcutLabel}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={openSearchPalette}
      aria-label="Open search (Ctrl+K)"
      data-testid="search-trigger"
      className={`inline-flex h-[34px] min-w-[200px] items-center gap-2 rounded-lg border border-border bg-card pl-3 pr-2 font-body text-[13px] text-muted transition-colors hover:border-primary ${className}`}
    >
      <Search size={14} />
      <span className="flex-1 text-left">Search…</span>
      <span className="inline-flex items-center rounded border border-border bg-background px-1.5 py-0.5 font-heading text-[11px] font-semibold text-muted">
        {shortcutLabel}
      </span>
    </button>
  );
}
