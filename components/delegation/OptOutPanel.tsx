'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useSignTypedData } from 'wagmi';

import { optOutActionFor, type OverviewAddress } from '@/lib/delegation/logic/address-overview';
import type { OptOutMode } from '@/lib/delegation/opt-out/score-api';
import type { IssuedNonce } from '@/lib/delegation/opt-out/service';
import { buildOptOutTypedData, type OptOutAction } from '@/lib/delegation/opt-out/typed-data';

import OptOutStatusBadge from './OptOutStatusBadge';

interface OptOutPanelProps {
  /** The overview's addresses, requested one first. Only an address's owner can sign for it. */
  addresses: OverviewAddress[];
  mode: OptOutMode;
  /** `false` when MAINNET_RPC_URL is unset and signatures can't be checked. */
  signingAvailable: boolean;
}

type Outcome = { kind: 'success' | 'error'; message: string } | null;

/** Wording for Score API refusals whose own message is written for developers. */
const REFUSAL_MESSAGES: Record<string, string> = {
  expired:
    'The Score API rejected the request as too old or dated in the future. Check your device clock and start again.',
  superseded:
    'A newer request for this address was already accepted. Reload the page to see its status.',
};

async function errorMessage(response: Response): Promise<string> {
  const body = await response.json().catch(() => null);
  const code: unknown = body?.error?.code;
  return (
    (typeof code === 'string' ? REFUSAL_MESSAGES[code] : undefined) ??
    body?.error?.message ??
    `The request failed (HTTP ${response.status}).`
  );
}

const ACTION_LABELS: Record<OptOutAction, string> = { 'opt-out': 'Opt-out', 'opt-in': 'Opt-in' };

function isUserRejection(error: unknown): boolean {
  return error instanceof Error && error.name === 'UserRejectedRequestError';
}

/**
 * Signs an EIP-712 opt-out or opt-in request with the wallet that owns the
 * address. An opt-out, pending or applied, is reversed by an opt-in.
 */
export default function OptOutPanel({ addresses, mode, signingAvailable }: OptOutPanelProps) {
  const router = useRouter();
  const { address: connected } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();
  const [selectedAddress, setSelectedAddress] = useState(addresses[0]?.address ?? '');
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<Outcome>(null);

  const entry = addresses.find((a) => a.address === selectedAddress) ?? addresses[0];
  if (!entry) {
    return null;
  }

  const action = optOutActionFor(entry.optOut);
  const isOwner = connected?.toLowerCase() === entry.address.toLowerCase();

  async function submit() {
    if (!connected) {
      return;
    }
    setBusy(true);
    setOutcome(null);
    try {
      const nonceResponse = await fetch('/api/opt-out/nonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: connected }),
      });
      if (!nonceResponse.ok) {
        setOutcome({ kind: 'error', message: await errorMessage(nonceResponse) });
        return;
      }
      const { nonce, issuedAt } = (await nonceResponse.json()) as IssuedNonce;
      const typedData = buildOptOutTypedData({ address: connected, action, nonce, issuedAt });
      const signature = await signTypedDataAsync(typedData);

      const response = await fetch('/api/opt-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ typedData, signature }),
      });
      if (!response.ok) {
        setOutcome({ kind: 'error', message: await errorMessage(response) });
        return;
      }
      setOutcome({
        kind: 'success',
        message: `${ACTION_LABELS[action]} requested. It takes effect at the next score run.`,
      });
      router.refresh();
    } catch (error) {
      setOutcome({
        kind: 'error',
        message: isUserRejection(error)
          ? 'The signature request was rejected in your wallet.'
          : 'Signing failed. Try again.',
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card mt-6 p-5" aria-labelledby="opt-out-title">
      {mode === 'mock' && (
        <div role="status" className="mb-4 rounded-lg border border-warning/40 bg-warning/10 p-4">
          <p className="text-[13px] font-medium text-warning">Demo</p>
          <p className="mt-1 text-[13px] text-foreground">
            The Score API can&apos;t receive opt-outs yet. DAOx checks your signature and records
            the request locally, but it has no effect on scoring.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 id="opt-out-title">Opt out of scoring</h3>
          <p className="mt-1 text-[13px] text-muted">
            Ask for <code className="font-mono text-xs text-foreground">{entry.address}</code> to be
            excluded from scoring, so no voting power is assigned to it. It applies to this address
            only, takes effect at the next score run, and can be reversed by opting back in.
          </p>
        </div>
        <OptOutStatusBadge status={entry.optOut} />
      </div>

      {signingAvailable ? (
        <div className="mt-4 space-y-3">
          <button
            type="button"
            onClick={submit}
            disabled={!isOwner || busy}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-card-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy
              ? 'Waiting for signature…'
              : action === 'opt-out'
                ? 'Sign opt-out'
                : 'Sign opt-in'}
          </button>
          {!isOwner && (
            <p className="text-[13px] text-muted">
              {connected ? 'Switch' : 'Connect'} your wallet to{' '}
              <code className="font-mono text-xs text-foreground">{entry.address}</code> to sign.
            </p>
          )}
          <p className="text-[13px] text-muted">
            Signing from a Safe? Your co-signers may still need to sign in the Safe app. The request
            expires a day after you start it, so collect their signatures within that time.
          </p>
        </div>
      ) : (
        <p className="mt-4 text-[13px] text-muted">
          Signing is unavailable: MAINNET_RPC_URL is not configured.
        </p>
      )}

      {outcome && (
        <p
          role={outcome.kind === 'error' ? 'alert' : 'status'}
          className={`mt-3 text-[13px] ${outcome.kind === 'error' ? 'text-danger' : 'text-accent'}`}
        >
          {outcome.message}
        </p>
      )}
    </section>
  );
}
