import type { Instrumentation } from 'next';

import { redactAddresses } from './redact';

type Args = Parameters<Instrumentation.onRequestError>;

/**
 * One log record for a failed server request: searchable by route in Vercel
 * logs or a log drain. Headers are left out; they carry cookies.
 */
export function describeRequestError(error: Args[0], request: Args[1], context: Args[2]) {
  const digest =
    typeof error === 'object' && error !== null && 'digest' in error ? error.digest : undefined;
  return {
    event: 'request_error',
    method: request.method,
    path: redactAddresses(request.path),
    route: context.routePath,
    routeType: context.routeType,
    error: error instanceof Error ? error.name : 'unknown',
    message: redactAddresses(error instanceof Error ? error.message : String(error)),
    ...(typeof digest === 'string' ? { digest } : {}),
  };
}
