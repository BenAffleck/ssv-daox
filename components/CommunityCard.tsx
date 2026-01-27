import { CommunityTool } from '@/lib/types';

interface CommunityCardProps {
  tool: CommunityTool;
}

export default function CommunityCard({ tool }: CommunityCardProps) {
  return (
    <a
      href={tool.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block rounded-lg border border-secondary/40 bg-gradient-to-br from-secondary/10 to-accent/10 p-6 transition-all hover:border-secondary hover:shadow-lg hover:shadow-secondary/20"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            <h3 className="font-heading text-xl font-semibold text-foreground">
              {tool.name}
            </h3>
            <span className="rounded-full bg-secondary/20 px-2 py-0.5 font-heading text-xs text-secondary">
              Community
            </span>
          </div>
          <p className="text-sm text-muted">{tool.description}</p>
        </div>
        <svg
          className="h-5 w-5 flex-shrink-0 text-muted transition-colors group-hover:text-secondary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      </div>
    </a>
  );
}
