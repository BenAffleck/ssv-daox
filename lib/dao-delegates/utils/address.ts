/**
 * Formats Ethereum address to truncated form
 * Example: 0x1234567890abcdef1234567890abcdef12345678 -> 0x1234...5678
 */
export function formatAddress(address: string): string {
  if (!address || address.length < 10) {
    return address;
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
