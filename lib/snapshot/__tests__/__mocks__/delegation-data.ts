/**
 * Static delegation data for testing purposes
 * Previously located in lib/dao-delegates/eligibility/already-delegated.ts
 *
 * This data is used in tests to provide predictable delegation state
 * without making actual API calls to Snapshot.org
 */

/**
 * Mock addresses that are "already delegated" (receive delegation from DAO)
 * These addresses would be returned by fetchDelegationRecipients() in production
 */
export const MOCK_ALREADY_DELEGATED: string[] = [
  // Add already delegated addresses here
  '0x9933fcd422180fe81c83aed0de219c6fc4a08c15',
  '0x0b399d2667733659f4a5fdcb030f3e26d26cc0fe',
  '0xe3023dae714d827f2452442fccfdc2bcd684de13',
  '0x1b1627b632f774b4b95cfe28ec03d8f9c5847f0b',
  '0x32ebaf9ea4063d911222407838e15e3a5027a638',
  '0xfb6141dfe88540450b2b3e5c1a64944c4325b6d9',
  '0x8f8c3b3d99a2cd1d4ca8aa1a386b743510436b16',
  '0x269ebeee083ce6f70486a67dc8036a889bf322a9',
  '0x33798b4f75e9726955708c272a4e764ea29476b7',
  '0x833982274afc3909f0fff48e92546ec21ae5ad6b',
  '0x58b1b454dbe5156acc8fc2139e7238451b59f432',
  '0x7ddee51c8375399127b18a0333f80292c3fb6486',
  '0xa32d07ad5c398599636867439a4bcaef119351ab',
  '0x60cd284adc16f5858c23b26c8377c13f72c49e35',
  '0xf2659cc196829c6676b1e0e1a71a8797cec6778a',
  '0x26b0bb09478a8423b53b2854deffb8a61a889725',
  '0x8a955ed24fcb3cf71d8a5bc828b7dcfdb2c17101',
  '0xfa08c782a435f713cb0fd6d5836b7525b36372f0',
  '0xd6b7d52e15678b9195f12f3a6d6cb79dcdccb690',
  '0x13be45d9ade672c0354a5bff501dc5f791002680',
  '0x3ea44328b48a027a5e7ada15c193cbc388268786',
];

/**
 * Mock source addresses (DAO treasury/multisigs)
 * These would be configured via SNAPSHOT_DELEGATION_SOURCE_ADDRESSES in production
 */
export const MOCK_DELEGATION_SOURCE_ADDRESSES: string[] = [
  '0x0000000000000000000000000000000000000001', // Example DAO treasury
  '0x0000000000000000000000000000000000000002', // Example multisig
];

/**
 * Helper function to get mock delegation recipient data
 * Returns the static list for testing
 *
 * Use this in tests as a replacement for fetchDelegationRecipients()
 */
export function getMockDelegationRecipients(): string[] {
  return MOCK_ALREADY_DELEGATED;
}
