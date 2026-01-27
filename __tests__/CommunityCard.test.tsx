import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CommunityCard from '@/components/CommunityCard';
import { CommunityTool } from '@/lib/types';

describe('CommunityCard', () => {
  const testTool: CommunityTool = {
    id: 'test-tool',
    name: 'Test Tool',
    description: 'A tool for testing purposes',
    url: 'https://example.com',
    sortOrder: 1,
  };

  it('renders the tool name', () => {
    render(<CommunityCard tool={testTool} />);
    expect(screen.getByText('Test Tool')).toBeInTheDocument();
  });

  it('renders the tool description', () => {
    render(<CommunityCard tool={testTool} />);
    expect(screen.getByText('A tool for testing purposes')).toBeInTheDocument();
  });

  it('renders the Community badge', () => {
    render(<CommunityCard tool={testTool} />);
    expect(screen.getByText('Community')).toBeInTheDocument();
  });

  it('renders as an external link with correct href', () => {
    const { container } = render(<CommunityCard tool={testTool} />);
    const link = container.querySelector('a');

    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://example.com');
  });

  it('opens link in new tab with security attributes', () => {
    const { container } = render(<CommunityCard tool={testTool} />);
    const link = container.querySelector('a');

    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('has gradient background styling', () => {
    const { container } = render(<CommunityCard tool={testTool} />);
    const link = container.querySelector('a');

    expect(link).toHaveClass('bg-gradient-to-br');
    expect(link).toHaveClass('from-secondary/10');
    expect(link).toHaveClass('to-accent/10');
  });

  it('has colored border styling', () => {
    const { container } = render(<CommunityCard tool={testTool} />);
    const link = container.querySelector('a');

    expect(link).toHaveClass('border-secondary/40');
    expect(link).toHaveClass('hover:border-secondary');
  });

  it('has hover shadow styling', () => {
    const { container } = render(<CommunityCard tool={testTool} />);
    const link = container.querySelector('a');

    expect(link).toHaveClass('hover:shadow-lg');
    expect(link).toHaveClass('hover:shadow-secondary/20');
  });

  it('renders external link icon', () => {
    const { container } = render(<CommunityCard tool={testTool} />);
    const svg = container.querySelector('svg');

    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });
});
