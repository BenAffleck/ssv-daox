import { EligibilityLists, EligibilityResult } from '../types';

/**
 * Committee data structure for injection
 */
export interface CommitteeData {
  grantsCommittee: string[];
  operatorCommittee: string[];
  multisigCommittee: string[];
}

/**
 * Fixed lists data structure for injection
 */
export interface FixedListsData {
  vipWallets: string[];
  verifiedOperators: string[];
  grantees: string[];
  professional: string[];
}

/**
 * Creates eligibility lists from injected data
 * Converts to Sets for O(1) lookup and normalizes to lowercase
 *
 * @param committees - Committee member addresses fetched from Snapshot.org
 * @param fixedLists - Fixed list addresses from environment configuration
 * @param alreadyDelegatedAddresses - Addresses that receive delegation from DAO (fetched from Snapshot.org)
 */
export function buildEligibilityLists(
  committees: CommitteeData,
  fixedLists: FixedListsData,
  alreadyDelegatedAddresses: string[] = []
): EligibilityLists {
  return {
    vipWallets: new Set(fixedLists.vipWallets.map((addr) => addr.toLowerCase())),
    grantsCommittee: new Set(
      committees.grantsCommittee.map((addr) => addr.toLowerCase())
    ),
    operatorCommittee: new Set(
      committees.operatorCommittee.map((addr) => addr.toLowerCase())
    ),
    multisigCommittee: new Set(
      committees.multisigCommittee.map((addr) => addr.toLowerCase())
    ),
    verifiedOperators: new Set(
      fixedLists.verifiedOperators.map((addr) => addr.toLowerCase())
    ),
    grantees: new Set(fixedLists.grantees.map((addr) => addr.toLowerCase())),
    professional: new Set(fixedLists.professional.map((addr) => addr.toLowerCase())),
    alreadyDelegated: new Set(
      alreadyDelegatedAddresses.map((addr) => addr.toLowerCase())
    ),
  };
}

/**
 * Checks if an address is eligible for delegation programs
 * Returns eligibility status and reasons for ineligibility
 */
export function checkEligibility(
  address: string,
  lists: EligibilityLists
): EligibilityResult {
  const addr = address.toLowerCase();

  // Check VIP status
  const isVIP = lists.vipWallets.has(addr);

  // Check committee membership
  const committeeNames: string[] = [];
  if (lists.grantsCommittee.has(addr)) {
    committeeNames.push('Grants Committee');
  }
  if (lists.operatorCommittee.has(addr)) {
    committeeNames.push('Operator Committee');
  }
  if (lists.multisigCommittee.has(addr)) {
    committeeNames.push('Multisig Committee');
  }
  const isOnCommittee = committeeNames.length > 0;

  // Check fixed lists (these get guaranteed delegation)
  const fixedListNames: string[] = [];
  if (lists.verifiedOperators.has(addr)) {
    fixedListNames.push('Verified Operator');
  }
  if (lists.grantees.has(addr)) {
    fixedListNames.push('Grantee');
  }
  if (lists.professional.has(addr)) {
    fixedListNames.push('Professional');
  }
  const isOnFixedList = fixedListNames.length > 0;

  // Eligible for competitive seats if not VIP and not on committee
  // Note: Fixed list members ARE eligible (they get guaranteed delegation)
  const isEligible = !isVIP && !isOnCommittee;

  return {
    isEligible,
    isVIP,
    isOnCommittee,
    isOnFixedList,
    committeeNames,
    fixedListNames,
  };
}

/**
 * Checks if an address is already delegated
 */
export function isAlreadyDelegated(
  address: string,
  lists: EligibilityLists
): boolean {
  return lists.alreadyDelegated.has(address.toLowerCase());
}
