/**
 * AI-powered proposal summary module
 *
 * Generates TL;DR summaries of governance proposals
 * with explanations of each voting choice.
 */

export * from './types';
export * from './config';
export * from './cache';
export { generateProposalSummary, isAISummaryAvailable } from './generate-summary';
