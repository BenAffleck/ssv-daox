import Link from 'next/link';

import { formatAddress } from '@/lib/leaderboard/utils/address';

/** The one way the Delegation page offers the connected wallet's own address. */
export default function OpenOwnAddressLink({ address, href }: { address: string; href?: string }) {
  return (
    <Link
      href={href ?? `/delegation?address=${address}`}
      className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-glow transition-colors hover:bg-primary/90"
    >
      Open your address <span className="font-mono text-xs">{formatAddress(address)}</span>
    </Link>
  );
}
