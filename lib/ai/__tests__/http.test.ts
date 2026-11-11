import { describe, expect, it, vi } from 'vitest';

import type { AiRequest, AiResult } from '../features';
import { aiRoute } from '../http';

function post(body: string, headers: Record<string, string> = {}) {
  return new Request('http://localhost/api/ai-summary', { method: 'POST', body, headers });
}

function routeReturning(result: AiResult<string>) {
  const run = vi.fn(async (_request: AiRequest) => result);
  return { run, POST: aiRoute(run, (summary) => ({ summary })) };
}

describe('aiRoute', () => {
  it('answers a result with its payload and cache flag', async () => {
    const { POST, run } = routeReturning({ ok: true, value: 'TL;DR', fromCache: true });

    const response = await POST(post('{"proposalId":"0xabc"}'));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ summary: 'TL;DR', fromCache: true });
    expect(run.mock.calls[0][0].body).toEqual({ proposalId: '0xabc' });
  });

  it('answers an error with its status, message and code', async () => {
    const { POST } = routeReturning({
      ok: false,
      error: { code: 'not_found', message: 'Proposal not found', httpStatus: 404 },
    });

    const response = await POST(post('{}'));

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: 'Proposal not found',
      code: 'not_found',
      fromCache: false,
    });
  });

  it('tells a rate-limited client when to retry', async () => {
    const { POST } = routeReturning({
      ok: false,
      error: { code: 'rate_limited', message: 'Slow down', httpStatus: 429, retryAfterSeconds: 42 },
    });

    const response = await POST(post('{}'));

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('42');
  });

  it('rejects a body that is not JSON without running the feature', async () => {
    const { POST, run } = routeReturning({ ok: true, value: 'TL;DR', fromCache: false });

    const response = await POST(post('not json'));

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ code: 'invalid_request' });
    expect(run).not.toHaveBeenCalled();
  });

  it.each([
    [{ 'x-real-ip': '203.0.113.7', 'x-forwarded-for': '198.51.100.1' }, '203.0.113.7'],
    // A client can prepend entries; the proxy appends the address it saw.
    [{ 'x-forwarded-for': '198.51.100.1, 203.0.113.7' }, '203.0.113.7'],
    [{}, 'unknown'],
  ])('keys the client by the address its proxy saw (%j)', async (headers, clientKey) => {
    const { POST, run } = routeReturning({ ok: true, value: 'TL;DR', fromCache: false });

    await POST(post('{}', headers));

    expect(run.mock.calls[0][0].clientKey).toBe(clientKey);
  });
});
