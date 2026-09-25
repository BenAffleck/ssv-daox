import WalletProvider from '@/components/delegation/WalletProvider';

export default function DelegationLayout({ children }: { children: React.ReactNode }) {
  return <WalletProvider>{children}</WalletProvider>;
}
