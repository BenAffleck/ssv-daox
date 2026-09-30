/**
 * /delegates renders live Gnosis voting power for ~40 addresses. On a cold
 * fetch cache that takes 30s or more, and parallel tests each pay it.
 */
export const DELEGATES_LOAD_TIMEOUT = 90_000;
export const DELEGATES_TEST_TIMEOUT = 120_000;
