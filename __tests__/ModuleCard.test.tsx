import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ModuleCard from '@/components/ModuleCard';
import { Module, ModuleStatus } from '@/lib/types';

describe('ModuleCard', () => {
  const activeModule: Module = {
    id: 'test-1',
    slug: 'test-active',
    name: 'Active Module',
    status: ModuleStatus.ACTIVE,
    sortOrder: 1,
  };

  const comingSoonModule: Module = {
    id: 'test-2',
    slug: 'test-coming',
    name: 'Coming Soon Module',
    status: ModuleStatus.COMING_SOON,
    sortOrder: 2,
  };

  it('renders active module card', () => {
    render(<ModuleCard module={activeModule} />);

    expect(screen.getByText('Active Module')).toBeInTheDocument();
    expect(screen.queryByText('Coming Soon')).not.toBeInTheDocument();
  });

  it('renders coming soon module card with badge', () => {
    render(<ModuleCard module={comingSoonModule} />);

    expect(screen.getByText('Coming Soon Module')).toBeInTheDocument();
    expect(screen.getByText('Coming Soon')).toBeInTheDocument();
  });

  it('active card renders as a link', () => {
    const { container } = render(<ModuleCard module={activeModule} />);
    const link = container.querySelector('a');

    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/test-active');
    expect(link).toHaveClass('cursor-pointer');
  });

  it('coming soon card does not render as a link', () => {
    const { container } = render(<ModuleCard module={comingSoonModule} />);
    const link = container.querySelector('a');

    expect(link).not.toBeInTheDocument();
  });

  it('active card has hover styling classes', () => {
    const { container } = render(<ModuleCard module={activeModule} />);
    const link = container.querySelector('a');

    expect(link).toHaveClass('hover:border-primary');
    expect(link).toHaveClass('hover:shadow-lg');
  });

  it('coming soon card has muted styling', () => {
    const { container } = render(<ModuleCard module={comingSoonModule} />);
    const card = container.firstChild as HTMLElement;

    expect(card).toHaveClass('opacity-70');
    expect(card).toHaveClass('bg-muted/40');
  });
});
