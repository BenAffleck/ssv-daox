import { DelegationProgram } from './types';

/**
 * Repo-relative path of the frozen Karma delegate snapshot.
 *
 * The upstream Karma API is retired; delegate data is static until a new
 * source replaces it.
 */
export const FROZEN_DELEGATES_CSV_PATH = 'data/delegates/karma-delegates.csv';

export const DELEGATION_PROGRAMS: DelegationProgram[] = [
  {
    id: 'dao-delegation',
    name: 'dao-delegation',
    displayName: 'DAO Delegation',
    availableSeats: 10,
    requiresEligibility: true,
  },
  // {
  //   id: 'ssv-labs-delegation',
  //   name: 'ssv-labs-delegation',
  //   displayName: 'SSV Labs Delegation',
  //   availableSeats: 5,
  //   requiresEligibility: true,
  // },
];

export function getDelegationPrograms(): DelegationProgram[] {
  return DELEGATION_PROGRAMS;
}
