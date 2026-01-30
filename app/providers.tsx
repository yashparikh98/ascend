"use client";

import { useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import { AuthProvider } from "./contexts/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export default function Providers({ children }: { children: React.ReactNode }) {
  const network = WalletAdapterNetwork.Mainnet;
  const endpoint =
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ??
    clusterApiUrl("mainnet-beta");
  const queryClient = useMemo(() => new QueryClient(), []);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network })
    ],
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <WalletProvider wallets={wallets} autoConnect={true}>
            <WalletModalProvider>{children}</WalletModalProvider>
          </WalletProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ConnectionProvider>
  );
}
