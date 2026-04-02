'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Calendar, FileText, Menu, X, User, ChevronDown } from 'lucide-react';
import ThemeToggle from '@/lib/theme/ThemeToggle';
import { getActiveModules, getComingSoonModules } from '@/lib/data/modules';
import type { Module } from '@/lib/types';

const slugIconMap: Record<string, React.ComponentType<{ size?: number }>> = {
  'delegates': Users,
  'timeline': Calendar,
  'governance-proposals': FileText,
};

function getIconForSlug(slug: string) {
  return slugIconMap[slug] || FileText;
}

function isRouteActive(pathname: string, slug: string): boolean {
  return pathname === `/${slug}` || pathname.startsWith(`/${slug}/`);
}

export default function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const activeModules = getActiveModules();
  const comingSoonModules = getComingSoonModules();

  // Close "More" dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    if (moreOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [moreOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setMoreOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 font-heading text-[15px] font-semibold tracking-tight text-foreground transition-colors hover:text-primary"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="22" viewBox="100 60 300 340" fill="none" className="flex-shrink-0">
            <path fill="#2DB1FF" d="m204.141 337.252 37.927-46.64c3.96-4.869 11.415-4.869 15.375 0l37.928 46.64a9.856 9.856 0 0 1 0 12.445l-37.928 46.64c-3.96 4.87-11.415 4.87-15.375 0l-37.927-46.64a9.856 9.856 0 0 1 0-12.445Z" opacity=".62"/>
            <path fill="#2DB1FF" d="m263.064 223.197 37.927-46.64c3.96-4.869 11.415-4.869 15.376 0l37.926 46.64a9.855 9.855 0 0 1 0 12.446l-37.926 46.639c-3.961 4.87-11.416 4.87-15.376 0l-37.927-46.639a9.858 9.858 0 0 1 0-12.446Zm-117.852 0 37.928-46.64c3.96-4.869 11.415-4.869 15.375 0l37.927 46.64a9.858 9.858 0 0 1 0 12.446l-37.927 46.639c-3.96 4.87-11.415 4.87-15.375 0l-37.928-46.639a9.858 9.858 0 0 1 0-12.446Zm58.929-72.899 37.927-46.646c3.96-4.87 11.415-4.87 15.375 0l37.928 46.64a9.856 9.856 0 0 1 0 12.445l-37.928 46.64c-3.96 4.87-11.415 4.87-15.375 0l-37.927-46.634a9.856 9.856 0 0 1 0-12.445Z"/>
          </svg>
          DAOx
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          <Link
            href="/"
            className={pathname === '/' ? 'nav-item-active' : 'nav-item'}
          >
            <Home size={16} />
            Home
          </Link>

          {activeModules.map((mod: Module) => {
            const Icon = getIconForSlug(mod.slug);
            const active = isRouteActive(pathname, mod.slug);
            return (
              <Link
                key={mod.slug}
                href={`/${mod.slug}`}
                className={active ? 'nav-item-active' : 'nav-item'}
              >
                <Icon size={16} />
                {mod.name}
              </Link>
            );
          })}

          {comingSoonModules.length > 0 && (
            <div className="relative" ref={moreRef}>
              <button
                onClick={() => setMoreOpen(!moreOpen)}
                className="nav-item"
              >
                <Menu size={16} />
                More
                <ChevronDown size={14} className={`transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
              </button>

              {moreOpen && (
                <div className="absolute right-0 top-full mt-2 min-w-48 rounded-lg border border-border bg-card p-2 shadow-lg">
                  {comingSoonModules.map((mod: Module) => {
                    const Icon = getIconForSlug(mod.slug);
                    return (
                      <div
                        key={mod.slug}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-muted opacity-60"
                        style={{ fontSize: '13px' }}
                      >
                        <Icon size={16} />
                        <span>{mod.name}</span>
                        <span className="badge-sm-muted ml-auto">Coming Soon</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Right section */}
        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-[13px] text-muted">
            <User size={14} />
            Guest
          </div>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="nav-item md:hidden"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-b border-border bg-background/95 px-6 pb-4 backdrop-blur-md md:hidden">
          <nav className="flex flex-col gap-1">
            <Link
              href="/"
              className={pathname === '/' ? 'nav-item-active' : 'nav-item'}
            >
              <Home size={16} />
              Home
            </Link>

            {activeModules.map((mod: Module) => {
              const Icon = getIconForSlug(mod.slug);
              const active = isRouteActive(pathname, mod.slug);
              return (
                <Link
                  key={mod.slug}
                  href={`/${mod.slug}`}
                  className={active ? 'nav-item-active' : 'nav-item'}
                >
                  <Icon size={16} />
                  {mod.name}
                </Link>
              );
            })}

            {comingSoonModules.map((mod: Module) => {
              const Icon = getIconForSlug(mod.slug);
              return (
                <div
                  key={mod.slug}
                  className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-muted opacity-60"
                  style={{ fontSize: '13px' }}
                >
                  <Icon size={16} />
                  <span>{mod.name}</span>
                  <span className="badge-sm-muted ml-auto">Coming Soon</span>
                </div>
              );
            })}
          </nav>

          <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
            <ThemeToggle />
            <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-[13px] text-muted">
              <User size={14} />
              Guest
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
