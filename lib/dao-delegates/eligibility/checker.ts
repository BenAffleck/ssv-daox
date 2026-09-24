import { EligibilityLists } from '../types';

export interface CommitteeData {
  grantsCommittee: string[];
  operatorCommittee: string[];
  multisigCommittee: string[];
}

const toSet = (addresses: string[]) => new Set(addresses.map((addr) => addr.toLowerCase()));

/**
 * @param committees - Committee member addresses fetched from Snapshot.org
 * @param alreadyDelegatedAddresses - Addresses that receive delegation from the DAO
 */
export function buildEligibilityLists(
  committees: CommitteeData,
  alreadyDelegatedAddresses: string[] = [],
): EligibilityLists {
  return {
    grantsCommittee: toSet(committees.grantsCommittee),
    operatorCommittee: toSet(committees.operatorCommittee),
    multisigCommittee: toSet(committees.multisigCommittee),
    alreadyDelegated: toSet(alreadyDelegatedAddresses),
  };
}

/** Committee members are ineligible for delegation. */
export function committeeNamesOf(address: string, lists: EligibilityLists): string[] {
  const addr = address.toLowerCase();
  const names: string[] = [];
  if (lists.grantsCommittee.has(addr)) names.push('Grants Committee');
  if (lists.operatorCommittee.has(addr)) names.push('Operator Committee');
  if (lists.multisigCommittee.has(addr)) names.push('Multisig Committee');
  return names;
}

export function isAlreadyDelegated(address: string, lists: EligibilityLists): boolean {
  return lists.alreadyDelegated.has(address.toLowerCase());
}
