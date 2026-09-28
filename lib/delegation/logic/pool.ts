import { AUTO_DELEGATION_POOL_ADDRESS } from '../config';

export const AUTO_DELEGATION_POOL_NAME = 'DAO auto-delegation pool';

export function sameAddress(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

export function isAutoDelegationPool(address: string): boolean {
  return sameAddress(address, AUTO_DELEGATION_POOL_ADDRESS);
}
