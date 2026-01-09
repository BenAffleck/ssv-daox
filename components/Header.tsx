'use client';

import Link from 'next/link';
import ThemeToggle from '@/lib/theme/ThemeToggle';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="container mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link
          href="/"
          className="font-heading text-2xl font-bold text-primary transition-colors hover:text-secondary"
        >
          DAOx
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/"
            className="font-heading text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            Home
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
