import type { Instrumentation } from 'next';

import { describeRequestError } from '@/lib/telemetry/request-error';

export const onRequestError: Instrumentation.onRequestError = (error, request, context) => {
  console.error(JSON.stringify(describeRequestError(error, request, context)));
};
