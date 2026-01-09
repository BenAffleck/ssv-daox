/**
 * Static committee data for testing purposes
 * Previously located in lib/dao-delegates/eligibility/committees.ts
 *
 * This data is used in tests to provide predictable committee membership
 * without making actual API calls to Snapshot.org
 */

export const MOCK_GRANTS_COMMITTEE: string[] = [
  '0x97f676596EFEA4fb5A7b8b8FE546a7b66B5161AA', // Ben
  '0x60c2B500F00344ebaDD6B957d0A26F21319FBeCF', // Jon
];

export const MOCK_OPERATOR_COMMITTEE: string[] = [
  '0x6210477B3025BF5ea50A35D39e7D2875dC11661c', // Gbeast
  '0xfb6141DfE88540450b2b3E5C1a64944c4325b6d9', // Linko
];

export const MOCK_MULTISIG_COMMITTEE: string[] = [
  '0xf052e0df010819602F0B22a7cB600E33FFc91358', // Jordan
  '0x97f676596EFEA4fb5A7b8b8FE546a7b66B5161AA', // Ben
  '0x872Da650d6d727b87e56D8e46f62228a27f94B3d', // (address from example)
  '0x9E5ed9Dd1EEcd9bBa42559BF07329D6425BD629d', // Fod
  '0xF2b2B7a86c70701Ae331fe09e194379441F57A70', // Sigma Prime
  '0xf71E9C766Cdf169eDFbE2749490943C1DC6b8A55', // Preston
  '0xb9D75558ce9A88f3Bf8dDe4C564aF3dcC2991D77', // Ryan
  '0x09B5e6D886966C020388BE105f0C4d302712d33f', // hqueue
  '0x9743F6adcE6Abd0Cedf450C4A5d47C49b83c44f4', // Mitya
];

/**
 * Helper function to get all mock committee data
 * in the format expected by buildEligibilityLists()
 */
export function getMockCommitteeData() {
  return {
    grantsCommittee: MOCK_GRANTS_COMMITTEE,
    operatorCommittee: MOCK_OPERATOR_COMMITTEE,
    multisigCommittee: MOCK_MULTISIG_COMMITTEE,
  };
}
