import { ExternalLink } from 'lucide-react';

interface ProposalTitleLinkProps {
  href: string;
  title: string;
}

export default function ProposalTitleLink({ href, title }: ProposalTitleLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group font-heading text-[15px] leading-snug font-semibold tracking-tight text-foreground hover:text-primary"
    >
      {title}
      <ExternalLink
        size={13}
        aria-hidden
        className="ml-1.5 inline align-[-1px] text-muted transition-colors group-hover:text-primary"
      />{' '}
      <span className="sr-only">(opens on Snapshot)</span>
    </a>
  );
}
