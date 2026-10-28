import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface NameCellProps {
  displayName: string;
  address: string;
}

/** The delegate's name, linking to its Delegation page. */
export default function NameCell({ displayName, address }: NameCellProps) {
  return (
    <Link
      href={`/delegation?address=${address}`}
      title={displayName}
      className="flex w-[180px] items-center gap-1 font-medium text-foreground transition-colors group-hover:text-primary hover:underline"
    >
      <span className="truncate">{displayName}</span>
      <ChevronRight
        size={14}
        aria-hidden
        className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
      />
    </Link>
  );
}
