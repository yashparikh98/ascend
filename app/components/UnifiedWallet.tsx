"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useAuthContext } from "../contexts/AuthContext";
import { CHAIN_NAMESPACES } from "@web3auth/base";
import { Web3Auth } from "@web3auth/modal";
import {
  SolanaPrivateKeyProvider,
  SolanaWallet,
} from "@web3auth/solana-provider";

function truncateAddress(address: string) {
  if (!address) return "";
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

type WalletProviderName = "phantom" | "solflare" | "walletconnect";
type ProviderName = WalletProviderName | "web3auth";

type ActiveSession =
  | {
      kind: "wallet";
      provider: WalletProviderName;
      address: string;
    }
  | {
      kind: "web3auth";
      provider: "web3auth";
      address: string;
    };

export default function UnifiedWallet() {
  const { connected, publicKey, wallet, wallets, select, connect, disconnect } =
    useWallet();

  const { setVisible } = useWalletModal();

  const { isAuthenticated, provider, walletAddress, setAuthenticated } =
    useAuthContext();

  const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
  const [web3authReady, setWeb3authReady] = useState(false);
  const [web3authAddress, setWeb3authAddress] = useState<string | null>(null);

  const [busy, setBusy] = useState<
    null | "phantom" | "solflare" | "web3auth" | "disconnect"
  >(null);
  const [error, setError] = useState<string | null>(null);

  // -------- Helpers --------

  const solanaWalletAddress = useMemo(() => {
    return publicKey?.toBase58() ?? null;
  }, [publicKey]);

  const walletAdapterName = useMemo(() => {
    return wallet?.adapter?.name ?? null;
  }, [wallet]);

  const detectedProvider = useMemo<WalletProviderName | null>(() => {
    if (!connected || !walletAdapterName) return null;

    const name = walletAdapterName.toLowerCase();
    if (name.includes("phantom")) return "phantom";
    if (name.includes("solflare")) return "solflare";
    if (name.includes("walletconnect")) return "walletconnect";

    // If some other adapter is used, don't pretend it's Phantom.
    // Returning null prevents creating an invalid ActiveSession.
    return null;
  }, [connected, walletAdapterName]);

  const getWalletAdapterName = useCallback(
    (name: "Phantom" | "Solflare") => {
      const found = wallets.find((w) => w.adapter.name === name);
      return found?.adapter.name ?? null;
    },
    [wallets]
  );

  async function fetchWeb3AuthAddress(
    instance: Web3Auth
  ): Promise<string | null> {
    try {
      if (!instance.provider) return null;
      const solanaWallet = new SolanaWallet(instance.provider);
      const accounts = await solanaWallet.requestAccounts();
      return accounts?.[0] ?? null;
    } catch (e) {
      console.error("Failed to get Web3Auth accounts:", e);
      return null;
    }
  }

  // -------- Web3Auth init --------

  const initializeWeb3Auth = useCallback(async () => {
    const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID;
    if (!clientId) {
      // Not an error; allow app to run without Web3Auth.
      return;
    }

    const rpcTarget =
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL ??
      "https://api.mainnet-beta.solana.com";

    const privateKeyProvider = new SolanaPrivateKeyProvider({
      config: {
        chainConfig: {
          chainNamespace: CHAIN_NAMESPACES.SOLANA,
          chainId: "0x1", // mainnet-beta
          rpcTarget,
          displayName: "Solana Mainnet",
          blockExplorerUrl: "https://explorer.solana.com",
          ticker: "SOL",
          tickerName: "Solana",
        },
      },
    });

    const instance = new Web3Auth({
      clientId,
      web3AuthNetwork: "sapphire_mainnet",
      privateKeyProvider,
    });

    setWeb3auth(instance);

    try {
      await instance.initModal({
        modalConfig: {
          openlogin: { label: "Social login", showOnModal: true },
        },
      });

      setWeb3authReady(true);

      if (instance.connected) {
        const addr = await fetchWeb3AuthAddress(instance);
        setWeb3authAddress(addr);
      }
    } catch (e) {
      console.error("Web3Auth init failed:", e);
      setWeb3authReady(false);
      setError("Web3Auth initialization failed.");
    }
  }, []);

  useEffect(() => {
    if (!web3auth && !web3authReady) {
      initializeWeb3Auth();
    }
  }, [web3auth, web3authReady, initializeWeb3Auth]);

  // -------- Active session (source of truth for UI + auth sync) --------

  const activeSession = useMemo<ActiveSession | null>(() => {
    if (connected && solanaWalletAddress && detectedProvider) {
      return {
        kind: "wallet",
        provider: detectedProvider,
        address: solanaWalletAddress,
      };
    }

    if (web3auth?.connected && web3authAddress) {
      return {
        kind: "web3auth",
        provider: "web3auth",
        address: web3authAddress,
      };
    }

    return null;
  }, [
    connected,
    solanaWalletAddress,
    detectedProvider,
    web3auth,
    web3authAddress,
  ]);

  // -------- Sync AuthContext (avoid thrashing) --------

  useEffect(() => {
    if (!activeSession) {
      if (isAuthenticated) setAuthenticated(false, null, null);
      return;
    }

    const nextProvider: ProviderName = activeSession.provider;
    const nextAddress = activeSession.address;

    if (
      !isAuthenticated ||
      provider !== nextProvider ||
      walletAddress !== nextAddress
    ) {
      setAuthenticated(true, nextProvider as any, nextAddress);
    }
  }, [
    activeSession,
    isAuthenticated,
    provider,
    walletAddress,
    setAuthenticated,
  ]);

  // -------- Actions --------

  const waitForSelectedWallet = (
    expectedAdapterName: string,
    getCurrentName: () => string | null,
    timeoutMs = 2500
  ) => {
    return new Promise<void>((resolve, reject) => {
      const start = Date.now();

      const tick = () => {
        const current = getCurrentName();
        if (current === expectedAdapterName) return resolve();
        if (Date.now() - start > timeoutMs) {
          return reject(new Error("Wallet selection timed out"));
        }
        requestAnimationFrame(tick);
      };

      tick();
    });
  };

  const connectWalletAdapter = useCallback(
    async (adapterName: "Phantom" | "Solflare") => {
      setError(null);
      setBusy(adapterName === "Phantom" ? "phantom" : "solflare");

      try {
        // Single-session rule: if Web3Auth connected, log it out first
        if (web3auth?.connected) {
          await web3auth.logout();
          setWeb3authAddress(null);
        }

        const walletEntry = wallets.find((w) => w.adapter.name === adapterName);
        if (!walletEntry) {
          throw new Error(
            `${adapterName} adapter not found. Check WalletProvider wallets list.`
          );
        }

        // If the wallet is not detected in the browser, show a friendly message.
        if (walletEntry.adapter.readyState === "NotDetected") {
          setError(
            `${adapterName} not detected. Install or enable the extension/app.`
          );
          return;
        }

        // If already connected to same adapter, disconnect
        if (connected && wallet?.adapter?.name === adapterName) {
          await disconnect();
          return;
        }

        // If connected to some other wallet, disconnect first
        if (connected) {
          await disconnect();
        }

        // ✅ Select first
        select(walletEntry.adapter.name as any);

        // ✅ Wait until selection is actually applied in wallet-adapter state
        await waitForSelectedWallet(
          adapterName,
          () => wallet?.adapter?.name ?? null,
          2500
        );

        // ✅ Now connect safely
        await connect();
      } catch (e: any) {
        console.error(`${adapterName} connect error:`, e);

        // Optional: make WalletNotSelectedError user-friendly
        const msg =
          e?.name === "WalletNotSelectedError"
            ? "Please select a wallet again."
            : e instanceof Error && e.message
            ? e.message
            : `Failed to connect ${adapterName}.`;

        setError(msg);
      } finally {
        setBusy(null);
      }
    },
    [web3auth, wallets, connected, wallet, disconnect, select, connect]
  );

  const handleConnectWeb3Auth = useCallback(async () => {
    setError(null);
    setBusy("web3auth");

    try {
      if (!web3auth) throw new Error("Web3Auth not initialized");

      // Single-session rule: if wallet-adapter connected, disconnect first
      if (connected) {
        await disconnect();
      }

      if (web3auth.connected) {
        await web3auth.logout();
        setWeb3authAddress(null);
        return;
      }

      await web3auth.connect();
      const addr = await fetchWeb3AuthAddress(web3auth);
      setWeb3authAddress(addr);

      if (!addr) {
        setError("Connected, but could not fetch address.");
      }
    } catch (e) {
      console.error("Web3Auth connect error:", e);
      setError("Failed to connect Web3Auth.");
    } finally {
      setBusy(null);
    }
  }, [web3auth, connected, disconnect]);

  const handleDisconnect = useCallback(async () => {
    setError(null);
    setBusy("disconnect");

    try {
      if (connected) await disconnect();
      if (web3auth?.connected) await web3auth.logout();
      setWeb3authAddress(null);
      setAuthenticated(false, null, null);
    } catch (e) {
      console.error("Disconnect error:", e);
      setError("Failed to disconnect.");
    } finally {
      setBusy(null);
    }
  }, [connected, disconnect, web3auth, setAuthenticated]);

  // -------- Display --------

  const displayProviderLabel = useMemo(() => {
    if (!activeSession) return "Not connected";
    return activeSession.provider === "web3auth"
      ? "Web3Auth"
      : activeSession.provider.toUpperCase();
  }, [activeSession]);

  const displayAddress = activeSession?.address ?? null;

  // -------- UI --------

  if (activeSession && displayAddress) {
    return (
      <div className="wallet-bar">
        <div className="wallet-status">
          <span className="eyebrow">Wallet</span>
          <strong>{displayProviderLabel}</strong>
        </div>

        <div className="wallet-actions">
          <span className="pill">
            {busy ? "…" : truncateAddress(displayAddress)}
          </span>
          <button
            className="pill"
            onClick={handleDisconnect}
            disabled={busy === "disconnect"}
            type="button"
          >
            {busy === "disconnect" ? "Disconnecting..." : "Disconnect"}
          </button>
        </div>

        {error && <p className="muted">{error}</p>}
      </div>
    );
  }

  return (
    <div className="wallet-bar">
      <div className="wallet-status">
        <span className="eyebrow">Wallet</span>
        <strong>Not connected</strong>
      </div>

      <div className="wallet-actions">
        <button
          className="pill"
          onClick={() => connectWalletAdapter("Phantom")}
          disabled={busy !== null}
          type="button"
        >
          {busy === "phantom" ? "Connecting..." : "Phantom"}
        </button>

        <button
          className="pill"
          onClick={() => connectWalletAdapter("Solflare")}
          disabled={busy !== null}
          type="button"
        >
          {busy === "solflare" ? "Connecting..." : "Solflare"}
        </button>

        <button
          className="pill"
          onClick={handleConnectWeb3Auth}
          disabled={!web3authReady || busy !== null}
          type="button"
        >
          {!web3authReady
            ? "Loading..."
            : busy === "web3auth"
            ? "Connecting..."
            : "Social"}
        </button>

        {/* Optional: use wallet-adapter's built-in selection modal */}
        <button
          className="pill"
          onClick={() => setVisible(true)}
          disabled={busy !== null}
          type="button"
        >
          More
        </button>
      </div>

      {error && <p className="muted">{error}</p>}
    </div>
  );
}
