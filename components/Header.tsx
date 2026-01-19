'use client';

import Link from 'next/link';
import ThemeToggle from '@/lib/theme/ThemeToggle';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="flex items-center justify-between px-4 py-4">
        <nav>
          <Link
            href="/"
            className="font-heading text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            Home
          </Link>
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
