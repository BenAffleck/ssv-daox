import { describe, expect, it } from 'vitest';

import { describeRequestError } from '../request-error';

const ADDRESS = '0x1111111111111111111111111111111111111111';

function failure() {
  return Object.assign(new TypeError(`fetch failed for ${ADDRESS}`), { digest: '123' });
}

describe('describeRequestError', () => {
  it('names the route and request without any wallet address', () => {
    const record = describeRequestError(
      failure(),
      { path: `/delegation?address=${ADDRESS}`, method: 'GET', headers: { cookie: 'secret' } },
      {
        routerKind: 'App Router',
        routePath: '/delegation',
        routeType: 'render',
        renderSource: 'server-rendering',
        revalidateReason: undefined,
      },
    );

    expect(record).toEqual({
      event: 'request_error',
      method: 'GET',
      path: '/delegation?address=[address]',
      route: '/delegation',
      routeType: 'render',
      error: 'TypeError',
      message: 'fetch failed for [address]',
      digest: '123',
    });
  });

  it('copes with a thrown value that is not an Error', () => {
    const record = describeRequestError(
      'boom',
      { path: '/api/rpc', method: 'POST', headers: {} },
      {
        routerKind: 'App Router',
        routePath: '/api/rpc',
        routeType: 'route',
        revalidateReason: undefined,
      },
    );

    expect(record).toMatchObject({ error: 'unknown', message: 'boom', route: '/api/rpc' });
  });
});
