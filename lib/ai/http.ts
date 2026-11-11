import { NextResponse } from 'next/server';

import type { AiRequest, AiResult } from './features';

/**
 * The address the nearest proxy saw. The left-most `X-Forwarded-For` entry is
 * whatever the client sent, so only the right-most one is trusted.
 */
function clientKeyOf(headers: Headers): string {
  const realIp = headers.get('x-real-ip')?.trim();
  if (realIp) {
    return realIp;
  }
  const forwarded = headers.get('x-forwarded-for')?.split(',').at(-1)?.trim();
  return forwarded || 'unknown';
}

/**
 * A POST handler for one AI feature. Success bodies are `toPayload(value)` plus
 * `fromCache`; error bodies are `{ error, code, fromCache: false }`.
 */
export function aiRoute<T>(
  run: (request: AiRequest) => Promise<AiResult<T>>,
  toPayload: (value: T) => object,
) {
  return async (request: Request): Promise<Response> => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body', code: 'invalid_request', fromCache: false },
        { status: 400 },
      );
    }

    const result = await run({ clientKey: clientKeyOf(request.headers), body });
    if (result.ok) {
      return NextResponse.json({ ...toPayload(result.value), fromCache: result.fromCache });
    }

    const { code, message, httpStatus, retryAfterSeconds } = result.error;
    const headers: Record<string, string> =
      retryAfterSeconds === undefined ? {} : { 'Retry-After': String(retryAfterSeconds) };
    return NextResponse.json(
      { error: message, code, fromCache: false },
      { status: httpStatus, headers },
    );
  };
}
