import { connectorsForWallets, type WalletList } from '@rainbow-me/rainbowkit';
import {
  injectedWallet,
  metaMaskWallet,
  rabbyWallet,
  safeWallet,
  walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { createConfig, http } from 'wagmi';
import { mainnet } from 'wagmi/chains';

import { RPC_PROXY_PATH } from './config';

/**
 * Mainnet-only wagmi config. All reads go through the DAOx RPC proxy.
 * Without a WalletConnect project ID only injected wallets are offered.
 */
export function createWagmiConfig(walletConnectProjectId: string | undefined) {
  const projectId = walletConnectProjectId?.trim() ?? '';
  if (!projectId) {
    console.warn(
      'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set: only injected wallets are offered.',
    );
  }

  const wallets: WalletList = projectId
    ? [
        {
          groupName: 'Wallets',
          wallets: [injectedWallet, metaMaskWallet, rabbyWallet, safeWallet, walletConnectWallet],
        },
      ]
    : [{ groupName: 'Browser wallets', wallets: [injectedWallet] }];

  return createConfig({
    chains: [mainnet],
    connectors: connectorsForWallets(wallets, { appName: 'SSV DAOx', projectId }),
    transports: { [mainnet.id]: http(rpcProxyUrl()) },
    ssr: true,
  });
}

/**
 * The WalletConnect connector reuses the transport URL as its RPC endpoint and rejects relative URLs.
 * During SSR there is no origin, and no request leaves the server, so the bare path is enough.
 */
function rpcProxyUrl(): string {
  return typeof window === 'undefined'
    ? RPC_PROXY_PATH
    : new URL(RPC_PROXY_PATH, window.location.origin).href;
}
