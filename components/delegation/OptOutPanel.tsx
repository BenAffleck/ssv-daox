'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useSignTypedData } from 'wagmi';

import {
  optOutActionFor,
  safeRequestState,
  type OverviewAddress,
} from '@/lib/delegation/logic/address-overview';
import type { OptOutMode } from '@/lib/delegation/opt-out/score-api';
import type { IssuedNonce, SafeRequest } from '@/lib/delegation/opt-out/service';
import {
  buildOptOutTypedData,
  type OptOutAction,
  type OptOutSubmission,
} from '@/lib/delegation/opt-out/typed-data';

import OptOutStatusBadge from './OptOutStatusBadge';

interface OptOutPanelProps {
  /** The overview's addresses, requested one first. Only an address's owner can sign for it. */
  addresses: OverviewAddress[];
  mode: OptOutMode;
  /** `false` when MAINNET_RPC_URL is unset and signatures can't be checked. */
  signingAvailable: boolean;
}

type Outcome = { kind: 'success' | 'error'; message: string } | null;

interface ErrorBody {
  error?: { code?: string; message?: string };
}

/** Wording for Score API refusals whose own message is written for developers. */
const REFUSAL_MESSAGES: Record<string, string> = {
  expired:
    'The Score API rejected the request as too old or dated in the future. Check your device clock and start again.',
  superseded:
    'A newer request for this address was already accepted. Reload the page to see its status.',
};

async function errorBodyOf(response: Response): Promise<ErrorBody | null> {
  return response.json().catch(() => null);
}

async function errorMessage(response: Response): Promise<string> {
  return messageOf(await errorBodyOf(response), response.status);
}

function messageOf(body: ErrorBody | null, httpStatus: number): string {
  const code: unknown = body?.error?.code;
  return (
    (typeof code === 'string' ? REFUSAL_MESSAGES[code] : undefined) ??
    body?.error?.message ??
    `The request failed (HTTP ${httpStatus}).`
  );
}

const ACTION_LABELS: Record<OptOutAction, string> = { 'opt-out': 'Opt-out', 'opt-in': 'Opt-in' };

type SafeSignatureLookup =
  | { status: 'awaiting'; confirmations: number; threshold: number }
  | { status: 'signed'; submission: OptOutSubmission };

async function postSubmission(submission: OptOutSubmission): Promise<Response> {
  return fetch('/api/opt-out', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(submission),
  });
}

function successMessage(action: OptOutAction): string {
  return `${ACTION_LABELS[action]} requested. It takes effect at the next score run.`;
}

function formatUtc(iso: string): string {
  return `${iso.slice(0, 16).replace('T', ' ')} UTC`;
}

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
  const [checking, setChecking] = useState(false);
  const [outcome, setOutcome] = useState<Outcome>(null);
  // Nonces the server reported expired since the page rendered.
  const [expiredNonces, setExpiredNonces] = useState<string[]>([]);

  const entry = addresses.find((a) => a.address === selectedAddress) ?? addresses[0];
  if (!entry) {
    return null;
  }

  const action = optOutActionFor(entry.optOut);
  const isOwner = connected?.toLowerCase() === entry.address.toLowerCase();
  const safeRequest = entry.safeRequest;
  const safeState =
    safeRequest && expiredNonces.includes(safeRequest.nonce)
      ? 'expired'
      : safeRequestState(safeRequest, new Date());

  async function checkAgain(request: SafeRequest) {
    setChecking(true);
    setOutcome(null);
    try {
      const lookup = await fetch(
        `/api/opt-out/safe-signature?nonce=${encodeURIComponent(request.nonce)}`,
      );
      if (!lookup.ok) {
        const body = await errorBodyOf(lookup);
        if (body?.error?.code === 'nonce_expired') {
          setExpiredNonces((nonces) => [...nonces, request.nonce]);
          return;
        }
        setOutcome({ kind: 'error', message: messageOf(body, lookup.status) });
        return;
      }
      const found = (await lookup.json()) as SafeSignatureLookup;
      if (found.status === 'awaiting') {
        setOutcome({
          kind: 'success',
          message: `${found.confirmations} of ${found.threshold} owners have signed. Check again once the rest have.`,
        });
        return;
      }
      const response = await postSubmission(found.submission);
      if (!response.ok) {
        setOutcome({ kind: 'error', message: await errorMessage(response) });
        return;
      }
      setOutcome({ kind: 'success', message: successMessage(request.action) });
      router.refresh();
    } catch {
      setOutcome({ kind: 'error', message: 'The check failed. Try again.' });
    } finally {
      setChecking(false);
    }
  }

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
        body: JSON.stringify({ address: connected, action }),
      });
      if (!nonceResponse.ok) {
        setOutcome({ kind: 'error', message: await errorMessage(nonceResponse) });
        return;
      }
      const { nonce, issuedAt } = (await nonceResponse.json()) as IssuedNonce;
      const typedData = buildOptOutTypedData({ address: connected, action, nonce, issuedAt });
      const signature = await signTypedDataAsync(typedData);

      const response = await postSubmission({ typedData, signature });
      if (!response.ok) {
        setOutcome({ kind: 'error', message: await errorMessage(response) });
        return;
      }
      setOutcome({ kind: 'success', message: successMessage(action) });
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

      {signingAvailable && safeRequest && safeState === 'awaiting' && (
        <div role="status" className="mt-4 rounded-lg border border-warning/40 bg-warning/10 p-4">
          <p className="text-[13px] font-medium text-warning">
            Safe {ACTION_LABELS[safeRequest.action].toLowerCase()} awaiting co-signers
          </p>
          <p className="mt-1 text-[13px] text-foreground">
            Started {formatUtc(safeRequest.issuedAt)}. Once your co-signers have signed in the Safe
            app, check again to submit it. It expires {formatUtc(safeRequest.expiresAt)}.
          </p>
          <button
            type="button"
            onClick={() => checkAgain(safeRequest)}
            disabled={busy || checking}
            className="mt-3 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-card-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {checking ? 'Checking…' : 'Check again'}
          </button>
        </div>
      )}
      {signingAvailable && safeRequest && safeState === 'expired' && (
        <div role="status" className="mt-4 rounded-lg border border-border bg-card p-4">
          <p className="text-[13px] font-medium text-foreground">
            Safe {ACTION_LABELS[safeRequest.action].toLowerCase()} expired
          </p>
          <p className="mt-1 text-[13px] text-muted">
            The request expired before all co-signers signed. Sign again below to start a new one.
          </p>
        </div>
      )}

      {signingAvailable ? (
        <div className="mt-4 space-y-3">
          <button
            type="button"
            onClick={submit}
            disabled={!isOwner || busy || checking}
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
            expires a day after you start it, so collect their signatures within that time. You can
            close this page and come back to check on it.
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
