/**
 * The /delegates table waits for live Gnosis voting power for ~40 addresses.
 * Each request times out after 10s, 10 at a time, and a cold dev compile adds
 * to it. Parallel tests each pay it.
 */
export const DELEGATES_LOAD_TIMEOUT = 90_000;
export const DELEGATES_TEST_TIMEOUT = 120_000;
