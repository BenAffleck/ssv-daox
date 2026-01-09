/**
 * Mock fixed lists data for testing purposes
 *
 * This data is used in tests to provide predictable fixed list membership
 * without relying on environment variables
 */

export const MOCK_VIP_WALLETS: string[] = [
  '0x44e50757ad63558cf5281bb4da7997bcf5118e33', // Taiga
  '0x2de670a1D8c1DE83D8727295284704bB196bA117', // Ben
];

export const MOCK_VERIFIED_OPERATORS: string[] = [
  '0xf2659cc196829c6676b1e0e1a71a8797cec6778a',
  '0x26b0bb09478a8423b53b2854deffb8a61a889725',
];

export const MOCK_GRANTEES: string[] = [
  '0xe3023dae714d827f2452442fccfdc2bcd684de13',
  '0x833982274afc3909f0fff48e92546ec21ae5ad6b',
];

export const MOCK_PROFESSIONAL: string[] = [
  '0x58b1b454dbe5156acc8fc2139e7238451b59f432',
];

/**
 * Helper function to get all mock fixed lists data
 * in the format expected by buildEligibilityLists()
 */
export function getMockFixedListsData() {
  return {
    vipWallets: MOCK_VIP_WALLETS,
    verifiedOperators: MOCK_VERIFIED_OPERATORS,
    grantees: MOCK_GRANTEES,
    professional: MOCK_PROFESSIONAL,
  };
}
