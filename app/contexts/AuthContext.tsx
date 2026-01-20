"use client";

import { createContext, useContext, useState } from "react";

type ProviderType = "phantom" | "solflare" | "web3auth" | null;

type AuthContextValue = {
  isAuthenticated: boolean;
  provider: ProviderType;
  walletAddress: string | null;
  setAuthenticated: (value: boolean, provider?: ProviderType, walletAddress?: string | null) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{ isAuthenticated: boolean; provider: ProviderType; walletAddress: string | null }>({
    isAuthenticated: false,
    provider: null,
    walletAddress: null
  });

  const setAuthenticated = (value: boolean, provider: ProviderType = null, walletAddress: string | null = null) => {
    setState({ 
      isAuthenticated: value, 
      provider: value ? provider : null,
      walletAddress: value ? walletAddress : null
    });
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: state.isAuthenticated,
        provider: state.provider,
        walletAddress: state.walletAddress,
        setAuthenticated
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return ctx;
}
