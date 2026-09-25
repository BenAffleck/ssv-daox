'use client';

import '@rainbow-me/rainbowkit/styles.css';

import { useContext, useState, type ReactNode } from 'react';
import { darkTheme, lightTheme, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';

import { ThemeContext } from '@/lib/theme/ThemeProvider';
import { createWagmiConfig } from '@/lib/wallet/wagmi-config';

const ACCENT = { accentColor: 'var(--color-primary)', accentColorForeground: 'white' };

export default function WalletProvider({ children }: { children: ReactNode }) {
  const [config] = useState(() =>
    createWagmiConfig(process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID),
  );
  const [queryClient] = useState(() => new QueryClient());
  const isDark = useContext(ThemeContext)?.theme === 'ssvdark';

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={isDark ? darkTheme(ACCENT) : lightTheme(ACCENT)}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
