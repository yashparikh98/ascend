"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { CHAIN_NAMESPACES } from "@web3auth/base";
import { Web3Auth } from "@web3auth/modal";
import {
  SolanaPrivateKeyProvider,
  SolanaWallet,
} from "@web3auth/solana-provider";
import { useAuthContext } from "../../contexts/AuthContext";

function truncateAddress(address: string) {
  if (!address) return "";
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

type WalletProviderName = "phantom" | "solflare" | "walletconnect";
type ProviderName = WalletProviderName | "web3auth";

type ActiveSession =
  | { kind: "wallet"; provider: WalletProviderName; address: string }
  | { kind: "web3auth"; provider: "web3auth"; address: string };

function normalizeProviderName(
  adapterName: string | null
): WalletProviderName | null {
  if (!adapterName) return null;
  const n = adapterName.toLowerCase();
  if (n.includes("phantom")) return "phantom";
  if (n.includes("solflare")) return "solflare";
  if (n.includes("walletconnect")) return "walletconnect";
  return null;
}

function humanizeWalletError(e: any) {
  const msg = (e?.message ?? "").toLowerCase();
  const name = (e?.name ?? "").toLowerCase();

  // Most common “not smooth” case: user closes Phantom/Solflare popup
  if (
    name.includes("walletconnectionerror") ||
    msg.includes("user rejected") ||
    msg.includes("rejected")
  ) {
    return "Connection cancelled in wallet.";
  }

  if (msg.includes("not detected") || msg.includes("wallet not found")) {
    return "Wallet not detected. Please install/enable it first.";
  }

  if (
    msg.includes("already processing") ||
    msg.includes("already connecting")
  ) {
    return "Wallet is already connecting. Please check your wallet popup.";
  }

  return e?.message ?? "Failed to connect wallet.";
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

export default function UnifiedWallet() {
  const { connected, publicKey, wallet, wallets, disconnect, select } =
    useWallet();

  const { setVisible } = useWalletModal();

  const { isAuthenticated, provider, walletAddress, setAuthenticated } =
    useAuthContext();

  const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
  const [web3authReady, setWeb3authReady] = useState(false);
  const [web3authAddress, setWeb3authAddress] = useState<string | null>(null);

  const [busy, setBusy] = useState<null | "wallet" | "web3auth" | "disconnect">(
    null
  );
  const [error, setError] = useState<string | null>(null);

  // prevents double clicks / double connect races
  const inflightRef = useRef(false);

  const solanaWalletAddress = useMemo(
    () => publicKey?.toBase58() ?? null,
    [publicKey]
  );
  const walletAdapterName = useMemo(
    () => wallet?.adapter?.name ?? null,
    [wallet]
  );
  const detectedProvider = useMemo(
    () => normalizeProviderName(walletAdapterName),
    [walletAdapterName]
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
    if (!clientId) return;

    const rpcTarget =
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL ??
      "https://api.mainnet-beta.solana.com";

    const privateKeyProvider = new SolanaPrivateKeyProvider({
      config: {
        chainConfig: {
          chainNamespace: CHAIN_NAMESPACES.SOLANA,
          chainId: "0x1",
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
    if (!web3auth && !web3authReady) initializeWeb3Auth();
  }, [web3auth, web3authReady, initializeWeb3Auth]);

  // -------- Active session --------
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

  // -------- Sync AuthContext (no thrash) --------
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

  // -------- Hard single-session switch --------
  const ensureNoOtherSession = useCallback(
    async (target: "wallet" | "web3auth") => {
      // close wallet modal always before any connect attempt
      setVisible(false);

      if (target === "wallet") {
        if (web3auth?.connected) {
          try {
            await web3auth.logout();
          } catch {}
          setWeb3authAddress(null);
        }
        return;
      }

      if (target === "web3auth") {
        if (connected) {
          try {
            await disconnect();
          } catch {}
        }
        return;
      }
    },
    [connected, disconnect, setVisible, web3auth]
  );

  // -------- Wallet connect (robust) --------
  const connectAdapterByName = useCallback(
    async (adapterName: string) => {
      if (inflightRef.current) return;
      inflightRef.current = true;

      setError(null);
      setBusy("wallet");

      try {
        await ensureNoOtherSession("wallet");

        const entry = wallets.find((w) => w.adapter.name === adapterName);
        if (!entry) throw new Error(`${adapterName} adapter not found`);

        // Let wallet-adapter decide if it can connect; "NotDetected" should be blocked for smooth UX
        if (entry.adapter.readyState === "NotDetected") {
          throw new Error(`${adapterName} not detected. Install or enable it.`);
        }

        // Select + give React a tick to commit selection in context
        select(entry.adapter.name as any);
        await sleep(0);

        // Connecting directly via adapter is usually smoother / less racey than calling connect()
        await entry.adapter.connect();

        // Always close wallet modal after successful connect
        setVisible(false);
      } catch (e: any) {
        console.error("Wallet connect failed:", e);
        setError(humanizeWalletError(e));
      } finally {
        setBusy(null);
        inflightRef.current = false;
      }
    },
    [ensureNoOtherSession, select, setVisible, wallets]
  );

  const getBestInstalledWallet = useCallback(() => {
    // prefer installed/loadable wallets (Phantom > Solflare)
    const installed = wallets.filter((w) =>
      ["Installed", "Loadable"].includes(w.adapter.readyState)
    );

    const phantom = installed.find((w) =>
      w.adapter.name.toLowerCase().includes("phantom")
    );
    const solflare = installed.find((w) =>
      w.adapter.name.toLowerCase().includes("solflare")
    );
    return phantom ?? solflare ?? installed[0] ?? null;
  }, [wallets]);

  const handleConnectWallet = useCallback(async () => {
    setError(null);

    const pick = getBestInstalledWallet();
    if (pick) {
      await connectAdapterByName(pick.adapter.name);
      return;
    }

    // No installed wallets: show wallet-adapter modal (smooth fallback)
    setVisible(true);
  }, [connectAdapterByName, getBestInstalledWallet, setVisible]);

  // -------- Web3Auth connect (smooth, no modal fights) --------
  const handleConnectWeb3Auth = useCallback(async () => {
    if (inflightRef.current) return;
    inflightRef.current = true;

    setError(null);
    setBusy("web3auth");

    try {
      if (!web3auth) throw new Error("Web3Auth not initialized");

      await ensureNoOtherSession("web3auth");

      // if already connected, treat as toggle logout
      if (web3auth.connected) {
        await web3auth.logout();
        setWeb3authAddress(null);
        return;
      }

      // Make sure wallet-adapter modal is closed so it doesn't overlap
      setVisible(false);

      await web3auth.connect();
      const addr = await fetchWeb3AuthAddress(web3auth);
      setWeb3authAddress(addr);

      if (!addr) setError("Connected, but could not fetch address.");
    } catch (e: any) {
      console.error("Web3Auth connect error:", e);
      setError(e?.message ?? "Failed to connect Social Login.");
    } finally {
      setBusy(null);
      inflightRef.current = false;
    }
  }, [ensureNoOtherSession, setVisible, web3auth]);

  const handleDisconnect = useCallback(async () => {
    if (inflightRef.current) return;
    inflightRef.current = true;

    setError(null);
    setBusy("disconnect");

    try {
      setVisible(false);

      if (connected) {
        try {
          await disconnect();
        } catch {}
      }

      if (web3auth?.connected) {
        try {
          await web3auth.logout();
        } catch {}
      }

      setWeb3authAddress(null);
      setAuthenticated(false, null, null);
    } catch (e) {
      console.error("Disconnect error:", e);
      setError("Failed to disconnect.");
    } finally {
      setBusy(null);
      inflightRef.current = false;
    }
  }, [connected, disconnect, setAuthenticated, setVisible, web3auth]);

  // Close wallet modal after successful wallet connect (prevents it staying open)
  useEffect(() => {
    if (connected) setVisible(false);
  }, [connected, setVisible]);

  // -------- Display --------
  const displayProviderLabel = useMemo(() => {
    if (!activeSession) return "Not connected";
    return activeSession.provider === "web3auth"
      ? "Social"
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
          onClick={handleConnectWallet}
          disabled={busy !== null}
          type="button"
        >
          {busy === "wallet" ? "Connecting..." : "Phantom"}
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
            : "Social Login"}
        </button>
      </div>

      {error && <p className="muted">{error}</p>}
    </div>
  );
}
