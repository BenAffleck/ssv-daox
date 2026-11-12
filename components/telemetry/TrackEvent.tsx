'use client';

import { useEffect } from 'react';

import { trackEvent, type TelemetryEvent, type TelemetryEvents } from '@/lib/telemetry/events';

/** Records an event once when a server-rendered page shows an outcome. */
export default function TrackEvent<E extends TelemetryEvent>({
  name,
  properties,
}: {
  name: E;
  properties: TelemetryEvents[E];
}) {
  const key = JSON.stringify(properties);
  useEffect(() => {
    trackEvent(name, JSON.parse(key) as TelemetryEvents[E]);
  }, [name, key]);
  return null;
}
