'use client';

import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

import { redactEventUrl } from '@/lib/telemetry/redact';

/** Vercel Web Analytics and Speed Insights. Client side, so `beforeSend` can be a function. */
export default function Telemetry() {
  return (
    <>
      <Analytics beforeSend={redactEventUrl} />
      <SpeedInsights beforeSend={redactEventUrl} />
    </>
  );
}
