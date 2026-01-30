import { DelegationProgram } from './types';

export const KARMA_API_URL =
  process.env.KARMA_API_URL ||
  '';

export const KARMA_PROFILE_BASE_URL =
  process.env.KARMA_PROFILE_BASE_URL ||
  'https://delegate.ssv.network/profile';

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
