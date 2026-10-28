'use server';

import { updateTag } from 'next/cache';

import { pinTag } from '@/lib/gnosis';

import { AUTO_DELEGATION_POOL_ADDRESS } from '../config';
import { isAddress } from '../logic/address-overview';

/**
 * Expires the cached pins of `address` and the pool, so the page this action
 * re-renders shows a delegation write once the API indexes it.
 */
export async function refreshPins(address: string): Promise<void> {
  if (!isAddress(address)) {
    return;
  }
  updateTag(pinTag(address));
  updateTag(pinTag(AUTO_DELEGATION_POOL_ADDRESS));
}
