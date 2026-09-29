'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import Image from 'next/image';

import { statementSegments } from '@/lib/snapshot/utils/statement';

import { useIsOwner } from './OwnerOnly';

interface DelegateProfileProps {
  address: string;
  name: string;
  avatarUrl: string;
  profileUrl: string;
  /** The public HighSignal profile; `null` until the address is claimed. */
  highSignalProfileUrl: string | null;
  /** The Snapshot delegate statement; `null` when there is none. */
  statement: string | null;
}

function Statement({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useLayoutEffect(() => {
    const element = ref.current;
    if (element && !expanded) {
      setOverflows(element.scrollHeight > element.clientHeight + 1);
    }
  }, [text, expanded]);

  return (
    <div className="mt-4">
      <p
        ref={ref}
        className={`text-[13px] whitespace-pre-line text-foreground ${expanded ? '' : 'line-clamp-3'}`}
      >
        {statementSegments(text).map((segment, i) =>
          segment.kind === 'link' ? (
            <a
              key={i}
              href={segment.href}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="break-all text-primary hover:underline"
            >
              {segment.text}
            </a>
          ) : (
            <span key={i}>{segment.text}</span>
          ),
        )}
      </p>
      {(overflows || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          className="mt-1 text-[13px] text-primary hover:underline"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
}

/** Who the viewed address is: name, avatar, profile links and Snapshot delegate statement. */
export default function DelegateProfile({
  address,
  name,
  avatarUrl,
  profileUrl,
  highSignalProfileUrl,
  statement,
}: DelegateProfileProps) {
  const isOwner = useIsOwner(address);

  return (
    <section aria-label="Delegate profile" className="card mb-6 p-5">
      <div className="flex items-start gap-4">
        <Image
          src={avatarUrl}
          alt=""
          width={56}
          height={56}
          unoptimized
          className="h-14 w-14 shrink-0 rounded-full bg-card-hover"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="min-w-0 break-words">{name}</h2>
            {isOwner && <span className="badge-sm-accent">You</span>}
          </div>
          <code className="mt-1 block truncate font-mono text-xs text-muted" title={address}>
            {address}
          </code>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
            {highSignalProfileUrl && (
              <a
                href={highSignalProfileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                HighSignal profile ↗
              </a>
            )}
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Snapshot profile ↗
            </a>
          </div>
        </div>
      </div>
      {statement && <Statement text={statement} />}
    </section>
  );
}
