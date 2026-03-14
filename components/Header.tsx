'use client';

import Link from 'next/link';
import ThemeToggle from '@/lib/theme/ThemeToggle';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="flex items-center justify-between px-4 py-4">
        <nav>
          <Link
            href="/"
            className="flex items-center gap-2 font-heading text-sm font-medium text-foreground transition-colors hover:text-primary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="22" viewBox="100 60 300 340" fill="none" className="flex-shrink-0">
              <path fill="#2DB1FF" d="m204.141 337.252 37.927-46.64c3.96-4.869 11.415-4.869 15.375 0l37.928 46.64a9.856 9.856 0 0 1 0 12.445l-37.928 46.64c-3.96 4.87-11.415 4.87-15.375 0l-37.927-46.64a9.856 9.856 0 0 1 0-12.445Z" opacity=".62"/>
              <path fill="#2DB1FF" d="m263.064 223.197 37.927-46.64c3.96-4.869 11.415-4.869 15.376 0l37.926 46.64a9.855 9.855 0 0 1 0 12.446l-37.926 46.639c-3.961 4.87-11.416 4.87-15.376 0l-37.927-46.639a9.858 9.858 0 0 1 0-12.446Zm-117.852 0 37.928-46.64c3.96-4.869 11.415-4.869 15.375 0l37.927 46.64a9.858 9.858 0 0 1 0 12.446l-37.927 46.639c-3.96 4.87-11.415 4.87-15.375 0l-37.928-46.639a9.858 9.858 0 0 1 0-12.446Zm58.929-72.899 37.927-46.646c3.96-4.87 11.415-4.87 15.375 0l37.928 46.64a9.856 9.856 0 0 1 0 12.445l-37.928 46.64c-3.96 4.87-11.415 4.87-15.375 0l-37.927-46.634a9.856 9.856 0 0 1 0-12.445Z"/>
            </svg>
            DAOx
          </Link>
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
