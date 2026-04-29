import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExternalToolsSection from '@/components/ExternalToolsSection';
import { ExternalTool, ExternalToolCategory } from '@/lib/types';

const tools: ExternalTool[] = [
  {
    id: 'sim-a',
    name: 'Sim A',
    description: 'Simulator A description',
    categories: [ExternalToolCategory.SIMULATOR],
    inputs: 'X · Y',
    outputs: 'Z',
    host: 'sim-a.xyz',
    url: 'https://sim-a.xyz',
    sortOrder: 1,
  },
  {
    id: 'calc-b',
    name: 'Calc B',
    description: 'Calculator B description',
    categories: [ExternalToolCategory.CALCULATOR],
    inputs: 'A',
    outputs: 'B',
    host: 'calc-b.xyz',
    url: 'https://calc-b.xyz',
    sortOrder: 2,
  },
  {
    id: 'dash-c',
    name: 'Dash C',
    description: 'Dashboard C description',
    categories: [ExternalToolCategory.DASHBOARD],
    inputs: 'feed',
    outputs: 'metrics',
    host: 'dash-c.xyz',
    url: 'https://dash-c.xyz',
    sortOrder: 3,
  },
  {
    id: 'expl-d',
    name: 'Expl D',
    description: 'Explorer D description',
    categories: [ExternalToolCategory.EXPLORER],
    inputs: 'address',
    outputs: 'cluster',
    host: 'expl-d.xyz',
    url: 'https://expl-d.xyz',
    sortOrder: 4,
  },
  {
    id: 'multi-e',
    name: 'Multi E',
    description: 'Tool that fits two categories',
    categories: [ExternalToolCategory.CALCULATOR, ExternalToolCategory.SIMULATOR],
    inputs: 'P · Q',
    outputs: 'R',
    host: 'multi-e.xyz',
    url: 'https://multi-e.xyz',
    sortOrder: 5,
  },
  {
    id: 'feat-f',
    name: 'Feat F',
    description: 'Featured tool description',
    categories: [ExternalToolCategory.EXPLORER],
    inputs: 'something',
    outputs: 'something else',
    host: 'feat-f.xyz',
    url: 'https://feat-f.xyz',
    featured: true,
    sortOrder: 99,
  },
];

describe('ExternalToolsSection', () => {
  it('renders the section title and all tools by default', () => {
    render(<ExternalToolsSection tools={tools} />);
    expect(screen.getByRole('heading', { name: /External Tools/i })).toBeInTheDocument();
    expect(screen.getByText('Sim A')).toBeInTheDocument();
    expect(screen.getByText('Calc B')).toBeInTheDocument();
    expect(screen.getByText('Dash C')).toBeInTheDocument();
    expect(screen.getByText('Expl D')).toBeInTheDocument();
    expect(screen.getByText('Multi E')).toBeInTheDocument();
    expect(screen.getByText('Feat F')).toBeInTheDocument();
  });

  it('exposes all four category filters', () => {
    render(<ExternalToolsSection tools={tools} />);
    expect(screen.getByRole('button', { name: 'Simulator' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Calculator' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Explorer' })).toBeInTheDocument();
  });

  it('renders one badge per assigned category', () => {
    const { container } = render(<ExternalToolsSection tools={[tools[4]]} />);
    const row = container.querySelector('a[href="https://multi-e.xyz"]') as HTMLElement;
    expect(within(row).getByText('Calculator')).toBeInTheDocument();
    expect(within(row).getByText('Simulator')).toBeInTheDocument();
  });

  it('renders a Featured badge for featured tools and not for others', () => {
    const { container } = render(<ExternalToolsSection tools={tools} />);
    const featRow = container.querySelector('a[href="https://feat-f.xyz"]') as HTMLElement;
    expect(within(featRow).getByText('Featured')).toBeInTheDocument();

    const calcRow = container.querySelector('a[href="https://calc-b.xyz"]') as HTMLElement;
    expect(within(calcRow).queryByText('Featured')).not.toBeInTheDocument();
  });

  it('narrows rows when a category filter is selected', async () => {
    const user = userEvent.setup();
    render(<ExternalToolsSection tools={tools} />);

    await user.click(screen.getByRole('button', { name: 'Calculator' }));

    expect(screen.getByText('Calc B')).toBeInTheDocument();
    expect(screen.getByText('Multi E')).toBeInTheDocument();
    expect(screen.queryByText('Sim A')).not.toBeInTheDocument();
    expect(screen.queryByText('Dash C')).not.toBeInTheDocument();
    expect(screen.queryByText('Expl D')).not.toBeInTheDocument();
  });

  it('narrows rows by Explorer filter', async () => {
    const user = userEvent.setup();
    render(<ExternalToolsSection tools={tools} />);
    await user.click(screen.getByRole('button', { name: 'Explorer' }));

    expect(screen.getByText('Expl D')).toBeInTheDocument();
    expect(screen.getByText('Feat F')).toBeInTheDocument();
    expect(screen.queryByText('Sim A')).not.toBeInTheDocument();
    expect(screen.queryByText('Calc B')).not.toBeInTheDocument();
  });

  it('shows a multi-category tool under each of its category filters', async () => {
    const user = userEvent.setup();
    render(<ExternalToolsSection tools={tools} />);

    await user.click(screen.getByRole('button', { name: 'Calculator' }));
    expect(screen.getByText('Multi E')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Simulator' }));
    expect(screen.getByText('Multi E')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Dashboard' }));
    expect(screen.queryByText('Multi E')).not.toBeInTheDocument();
  });

  it('shows an empty-state message when no tools match', async () => {
    const user = userEvent.setup();
    render(<ExternalToolsSection tools={[tools[0]]} />); // only Simulator
    await user.click(screen.getByRole('button', { name: 'Dashboard' }));
    expect(screen.getByText(/No tools match this filter/i)).toBeInTheDocument();
  });

  it('renders rows as external links with correct security attributes', () => {
    const { container } = render(<ExternalToolsSection tools={[tools[0]]} />);
    const link = container.querySelector('a[href="https://sim-a.xyz"]');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('applies the active filter class to the selected chip', async () => {
    const user = userEvent.setup();
    render(<ExternalToolsSection tools={tools} />);

    const allBtn = screen.getByRole('button', { name: 'All' });
    expect(allBtn).toHaveClass('filter-btn-active');

    const simBtn = screen.getByRole('button', { name: 'Simulator' });
    await user.click(simBtn);
    expect(simBtn).toHaveClass('filter-btn-active');
    expect(allBtn).toHaveClass('filter-btn');
  });

  it('renders the submit-a-tool footer link', () => {
    render(<ExternalToolsSection tools={tools} />);
    const submit = screen.getByRole('link', { name: /Submit a tool/i });
    expect(submit).toHaveAttribute('target', '_blank');
  });
});
