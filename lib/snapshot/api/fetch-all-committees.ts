import { SNAPSHOT_CONFIG } from '../config';
import { fetchSpaceMembers } from './fetch-space-members';

/**
 * Committee members result matching the expected format
 * for injection into buildEligibilityLists()
 */
export interface CommitteeMembers {
  grantsCommittee: string[];
  operatorCommittee: string[];
  multisigCommittee: string[];
}

/**
 * Fetches all committee members from their respective Snapshot spaces
 * in parallel for optimal performance
 *
 * @returns Object containing arrays of member addresses for each committee
 * @throws Error if any of the API requests fail
 */
export async function fetchAllCommitteeMembers(): Promise<CommitteeMembers> {
  // Fetch all three committees in parallel for better performance
  const [grantsCommittee, operatorCommittee, multisigCommittee] =
    await Promise.all([
      fetchSpaceMembers(SNAPSHOT_CONFIG.spaces.grantsCommittee),
      fetchSpaceMembers(SNAPSHOT_CONFIG.spaces.operatorCommittee),
      fetchSpaceMembers(SNAPSHOT_CONFIG.spaces.multisigCommittee),
    ]);

  return {
    grantsCommittee,
    operatorCommittee,
    multisigCommittee,
  };
}
