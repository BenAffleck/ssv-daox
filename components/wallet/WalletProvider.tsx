'use client';

import '@rainbow-me/rainbowkit/styles.css';

import { useContext, useEffect, useState, type ReactNode } from 'react';
import { darkTheme, lightTheme, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';

import { ThemeContext } from '@/lib/theme/ThemeProvider';
import { createWagmiConfig } from '@/lib/wallet/wagmi-config';

import { WalletRestoredContext } from './useWalletSession';

const ACCENT = { accentColor: 'var(--color-primary)', accentColorForeground: 'white' };

export default function WalletProvider({ children }: { children: ReactNode }) {
  const [config] = useState(() =>
    createWagmiConfig(process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID),
  );
  const [queryClient] = useState(() => new QueryClient());
  const [restored, setRestored] = useState(false);
  const isDark = useContext(ThemeContext)?.theme === 'ssvdark';

  // wagmi restores the last session on mount: it always passes through (re)connecting, then settles.
  // Subscribed before that starts, because wagmi's own mount effect only schedules it.
  useEffect(() => {
    let attempted = false;
    return config.subscribe(
      (state) => state.status,
      (status) => {
        if (status === 'connecting' || status === 'reconnecting') {
          attempted = true;
        } else if (attempted) {
          setRestored(true);
        }
      },
    );
  }, [config]);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={isDark ? darkTheme(ACCENT) : lightTheme(ACCENT)}>
          <WalletRestoredContext.Provider value={restored}>
            {children}
          </WalletRestoredContext.Provider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
