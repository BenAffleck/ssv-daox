import { describe, expect, it, vi } from 'vitest';

import { proxyRpc } from '../rpc-proxy';

const RPC_URL = 'https://mainnet.example/v3/secret-key';

function upstream(body: unknown, status = 200) {
  return vi.fn(async () => new Response(JSON.stringify(body), { status }));
}

describe('proxyRpc', () => {
  it('forwards an allowlisted read method and returns the upstream result', async () => {
    const fetch = upstream({ jsonrpc: '2.0', id: 1, result: '0x1' });
    const request = { jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: [] };

    const response = await proxyRpc(request, { rpcUrl: RPC_URL, fetch });

    expect(response).toEqual({ status: 200, body: { jsonrpc: '2.0', id: 1, result: '0x1' } });
    expect(fetch).toHaveBeenCalledOnce();
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(RPC_URL);
    expect(JSON.parse(init.body as string)).toEqual(request);
  });

  it.each(['eth_sendRawTransaction', 'eth_sendTransaction', 'eth_sign', 'debug_traceCall'])(
    'rejects %s without contacting the upstream',
    async (method) => {
      const fetch = upstream({});

      const response = await proxyRpc(
        { jsonrpc: '2.0', id: 7, method, params: [] },
        { rpcUrl: RPC_URL, fetch },
      );

      expect(response.status).toBe(403);
      expect(response.body).toMatchObject({ jsonrpc: '2.0', id: 7, error: { code: -32601 } });
      expect(fetch).not.toHaveBeenCalled();
    },
  );

  it.each([
    ['a batch', [{ jsonrpc: '2.0', id: 1, method: 'eth_chainId' }]],
    ['a body without a method', { jsonrpc: '2.0', id: 1 }],
    ['a non-object body', 'eth_chainId'],
  ])('rejects %s as an invalid request', async (_, body) => {
    const fetch = upstream({});

    const response = await proxyRpc(body, { rpcUrl: RPC_URL, fetch });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ error: { code: -32600 } });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('hides the upstream URL when the upstream fails', async () => {
    const fetch = vi.fn(async () => {
      throw new Error(`connect ECONNREFUSED ${RPC_URL}`);
    });

    const response = await proxyRpc(
      { jsonrpc: '2.0', id: 3, method: 'eth_blockNumber' },
      { rpcUrl: RPC_URL, fetch },
    );

    expect(response.status).toBe(502);
    expect(JSON.stringify(response.body)).not.toContain('secret-key');
  });
});
