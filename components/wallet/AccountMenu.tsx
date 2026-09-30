'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { Check, ChevronDown, Copy, ExternalLink, LogOut, UserRound } from 'lucide-react';
import { mainnet } from 'viem/chains';

import { formatAddress } from '@/lib/dao-delegates/utils/address';

interface AccountMenuProps {
  address: string;
  /** ENS name or shortened address. */
  displayName: string;
  ensAvatar?: string;
  onDisconnect: () => void;
}

const ITEM =
  'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-[13px] text-foreground transition-colors hover:bg-card-hover focus:bg-card-hover focus:outline-none';

/** The connected account's button and its menu: profile, copy, explorer, disconnect. */
export default function AccountMenu({
  address,
  displayName,
  ensAvatar,
  onDisconnect,
}: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const items = () =>
    Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);

  useEffect(() => {
    if (!open) {
      return;
    }
    items()[0]?.focus();
    function handleClickOutside(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (!copied) {
      return;
    }
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  function close({ refocus }: { refocus: boolean }) {
    setOpen(false);
    if (refocus) {
      triggerRef.current?.focus();
    }
  }

  function handleMenuKeyDown(e: React.KeyboardEvent) {
    const all = items();
    const index = all.indexOf(document.activeElement as HTMLElement);
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        close({ refocus: true });
        break;
      case 'Tab':
        close({ refocus: false });
        break;
      case 'ArrowDown':
        e.preventDefault();
        all[(index + 1) % all.length]?.focus();
        break;
      case 'ArrowUp':
        e.preventDefault();
        all[(index - 1 + all.length) % all.length]?.focus();
        break;
      case 'Home':
        e.preventDefault();
        all[0]?.focus();
        break;
      case 'End':
        e.preventDefault();
        all[all.length - 1]?.focus();
        break;
    }
  }

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
    } catch {
      // Clipboard denied; the full address stays visible in the menu header.
    }
  }

  const showsAddress = displayName !== formatAddress(address);

  return (
    <div className="relative" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        title={address}
        className="inline-flex h-8 items-center gap-2 rounded-lg border border-border bg-card px-3 text-[13px] font-medium text-foreground transition-colors hover:bg-card-hover"
      >
        {ensAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote ENS avatar of any host
          <img src={ensAvatar} alt="" className="h-4 w-4 shrink-0 rounded-full" />
        ) : (
          <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-accent" />
        )}
        <span className="max-w-36 truncate">{displayName}</span>
        <ChevronDown
          size={14}
          aria-hidden
          className={`shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label="Account"
          onKeyDown={handleMenuKeyDown}
          className="absolute top-full right-0 z-50 mt-2 w-60 rounded-lg border border-border bg-card p-1.5 shadow-lg"
        >
          <div role="none" className="mb-1.5 border-b border-border px-3 pt-1.5 pb-2.5">
            <p className="truncate text-[13px] font-medium text-foreground">{displayName}</p>
            {showsAddress && (
              <p className="font-mono text-xs text-muted">{formatAddress(address)}</p>
            )}
          </div>
          <Link
            href={`/delegation?address=${address}`}
            role="menuitem"
            tabIndex={-1}
            onClick={() => close({ refocus: false })}
            className={ITEM}
          >
            <UserRound size={14} aria-hidden />
            Delegation profile
          </Link>
          <button
            type="button"
            role="menuitem"
            tabIndex={-1}
            onClick={copyAddress}
            className={ITEM}
          >
            {copied ? (
              <Check size={14} aria-hidden className="text-accent" />
            ) : (
              <Copy size={14} aria-hidden />
            )}
            {copied ? 'Copied' : 'Copy address'}
          </button>
          <a
            href={`${mainnet.blockExplorers.default.url}/address/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            role="menuitem"
            tabIndex={-1}
            onClick={() => close({ refocus: false })}
            className={ITEM}
          >
            <ExternalLink size={14} aria-hidden />
            View on Etherscan
          </a>
          <div role="separator" className="my-1.5 border-t border-border" />
          <button
            type="button"
            role="menuitem"
            tabIndex={-1}
            onClick={() => {
              close({ refocus: false });
              onDisconnect();
            }}
            className={`${ITEM} text-danger`}
          >
            <LogOut size={14} aria-hidden />
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
