import type { ReactNode } from 'react';

interface LegalPageProps {
  title: string;
  updated: string;
  children: ReactNode;
}

export default function LegalPage({ title, updated, children }: LegalPageProps) {
  return (
    <div className="container mx-auto max-w-3xl px-6 py-16">
      <h1 className="mb-2 font-heading text-4xl font-bold tracking-tight text-primary">{title}</h1>
      <p className="mb-10 text-xs text-muted">Last updated: {updated}</p>
      <div className="space-y-4 text-[15px] text-foreground [&_a]:text-primary [&_a:hover]:underline [&_h2]:mt-10 [&_h2]:text-foreground [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_ul]:space-y-2">
        {children}
      </div>
    </div>
  );
}
