'use client';

import { useState } from 'react';

import type { DelegateOption } from '@/lib/delegation/logic/delegate-search';

import DelegateSearchInput, { SelectedDelegate } from './DelegateSearchInput';

interface AddressLookupFormProps {
  defaultValue?: string;
  /** Scored delegates suggested while typing. */
  delegates: DelegateOption[];
}

/** Looks up an address, an ENS name (resolved by the page) or a scored delegate. */
export default function AddressLookupForm({
  defaultValue = '',
  delegates,
}: AddressLookupFormProps) {
  const [value, setValue] = useState(defaultValue);
  return (
    <form action="/delegation" className="mx-auto mt-6 max-w-xl space-y-2 text-left">
      <div className="flex gap-2">
        <DelegateSearchInput
          aria-label="Ethereum address, ENS name or delegate"
          value={value}
          onChange={setValue}
          options={delegates}
          className="min-w-0 flex-1"
        />
        <button
          type="submit"
          disabled={!value.trim()}
          className="rounded-lg bg-secondary px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-secondary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Look up
        </button>
      </div>
      <SelectedDelegate value={value} options={delegates} />
      <input type="hidden" name="address" value={value.trim()} />
    </form>
  );
}
