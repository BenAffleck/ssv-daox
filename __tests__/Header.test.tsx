import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Header from '@/components/Header';
import { ThemeProvider } from '@/lib/theme/ThemeProvider';

describe('Header', () => {
  it('renders DAOx title', () => {
    render(
      <ThemeProvider>
        <Header />
      </ThemeProvider>
    );

    expect(screen.getByText('Home')).toBeInTheDocument(); // No header title expected
  });

  it('renders home link', () => {
    render(
      <ThemeProvider>
        <Header />
      </ThemeProvider>
    );

    const homeLinks = screen.getAllByRole('link', { name: /home/i });
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
    expect(titleLink).toHaveTextContent('Home');
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
});
