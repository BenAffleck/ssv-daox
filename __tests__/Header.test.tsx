import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Header from '@/components/Header';
import { ThemeProvider } from '@/lib/theme/ThemeProvider';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));

// Mock the module registry so this Header unit test is independent of the live
// registry contents (which modules are active vs. coming-soon can change).
vi.mock('@/lib/data/modules', () => {
  const ACTIVE = 'active';
  const COMING_SOON = 'coming_soon';
  const all = [
    { id: 'dao-delegates', slug: 'delegates', name: 'DAO Delegates', description: '', status: ACTIVE, sortOrder: 1 },
    { id: 'dao-timeline', slug: 'timeline', name: 'DAO Timeline', description: '', status: ACTIVE, sortOrder: 2 },
    { id: 'placeholder', slug: 'placeholder', name: 'Placeholder', description: '', status: COMING_SOON, sortOrder: 9 },
  ];
  return {
    getModulesSorted: () => all,
    getActiveModules: () => all.filter((m) => m.status === ACTIVE),
    getComingSoonModules: () => all.filter((m) => m.status === COMING_SOON),
    getModuleBySlug: (slug: string) => all.find((m) => m.slug === slug),
  };
});

describe('Header', () => {
  it('renders DAOx title', () => {
    render(
      <ThemeProvider>
        <Header />
      </ThemeProvider>
    );

    expect(screen.getByText('DAOx')).toBeInTheDocument();
  });

  it('renders home link', () => {
    render(
      <ThemeProvider>
        <Header />
      </ThemeProvider>
    );

    const homeLinks = screen.getAllByRole('link', { name: /daox/i });
    expect(homeLinks.length).toBeGreaterThan(0);
  });

  it('DAOx title links to home page', () => {
    const { container } = render(
      <ThemeProvider>
        <Header />
      </ThemeProvider>
    );
    const titleLink = container.querySelector('a[href="/"]');

    expect(titleLink).toBeInTheDocument();
    expect(titleLink).toHaveTextContent('DAOx');
  });

  it('header has sticky positioning', () => {
    const { container } = render(
      <ThemeProvider>
        <Header />
      </ThemeProvider>
    );
    const header = container.querySelector('header');

    expect(header).toHaveClass('sticky');
    expect(header).toHaveClass('top-0');
  });

  it('renders navigation items for active modules', () => {
    render(
      <ThemeProvider>
        <Header />
      </ThemeProvider>
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('DAO Delegates')).toBeInTheDocument();
    expect(screen.getByText('DAO Timeline')).toBeInTheDocument();
  });

  it('renders Guest user pill', () => {
    render(
      <ThemeProvider>
        <Header />
      </ThemeProvider>
    );

    const guestElements = screen.getAllByText('Guest');
    expect(guestElements.length).toBeGreaterThan(0);
  });

  it('renders More button for coming-soon modules', () => {
    render(
      <ThemeProvider>
        <Header />
      </ThemeProvider>
    );

    expect(screen.getByText('More')).toBeInTheDocument();
  });
});
