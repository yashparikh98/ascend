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
import { CHAIN_NAMESPACES, WALLET_ADAPTERS } from "@web3auth/base";
import { Web3Auth } from "@web3auth/modal";
import {
  SolanaPrivateKeyProvider,
  SolanaWallet,
} from "@web3auth/solana-provider";
import { useAuthContext } from "../../contexts/AuthContext";

const LAST_SESSION_KEY = "ascend:lastSession";
const SESSION_TTL_MS = 3.99 * 60 * 60 * 1000;

type StoredSession =
  | { kind: "wallet"; adapterName?: string | null; expiresAt: number }
  | { kind: "web3auth"; expiresAt: number };

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
  const { connected, publicKey, wallet, wallets, disconnect, select, connect } =
    useWallet();

  const { setVisible } = useWalletModal();

  const { isAuthenticated, provider, walletAddress, setAuthenticated } =
    useAuthContext();

  const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
  const [web3authStatus, setWeb3authStatus] = useState<
    "idle" | "initializing" | "ready" | "error"
  >("idle");
  const [web3authAddress, setWeb3authAddress] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);
  const [restoreDone, setRestoreDone] = useState(false);

  const [busy, setBusy] = useState<null | "wallet" | "web3auth" | "disconnect">(
    null
  );
  const [error, setError] = useState<string | null>(null);

  // Refs to prevent race conditions
  const inflightRef = useRef(false);
  const initAttemptedRef = useRef(false);
  const restoreAttemptedRef = useRef(false);
  const isRestoringRef = useRef(false);

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

  const clearSession = useCallback(() => {
    try {
      localStorage.removeItem(LAST_SESSION_KEY);
    } catch (e) {
      console.warn("Clear session failed", e);
    }
  }, []);

  const loadSession = useCallback((): StoredSession | null => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(LAST_SESSION_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as StoredSession;
      if (!parsed.expiresAt || Date.now() > parsed.expiresAt) {
        clearSession();
        return null;
      }
      return parsed;
    } catch (e) {
      console.warn("Load session failed", e);
      clearSession();
      return null;
    }
  }, [clearSession]);

  const persistSession = useCallback(
    (kind: "wallet" | "web3auth", adapterName?: string | null) => {
      if (typeof window === "undefined") return;
      try {
        const now = Date.now();
        const existing = loadSession();
        const expiresAt =
          existing && existing.expiresAt > now
            ? existing.expiresAt
            : now + SESSION_TTL_MS;

        const payload =
          kind === "wallet"
            ? { kind, adapterName: adapterName ?? walletAdapterName, expiresAt }
            : { kind, expiresAt };

        localStorage.setItem(LAST_SESSION_KEY, JSON.stringify(payload));
      } catch (e) {
        console.warn("Persist session failed", e);
      }
    },
    [loadSession, walletAdapterName]
  );

  async function fetchWeb3AuthAddress(
    instance: Web3Auth
  ): Promise<string | null> {
    try {
      if (!instance.provider) {
        console.warn("No provider available on Web3Auth instance");
        return null;
      }
      const solanaWallet = new SolanaWallet(instance.provider);
      const accounts = await solanaWallet.requestAccounts();
      return accounts?.[0] ?? null;
    } catch (e) {
      console.error("Failed to get Web3Auth accounts:", e);
      return null;
    }
  }

  // -------- Web3Auth init (one-time, idempotent) --------
  const initializeWeb3Auth = useCallback(async () => {
    if (initAttemptedRef.current) return;
    initAttemptedRef.current = true;

    const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID;
    if (!clientId) {
      console.error("Web3Auth client ID not found");
      setWeb3authStatus("error");
      return;
    }

    setWeb3authStatus("initializing");

    try {
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

      console.log("Initializing Web3Auth modal...");

      await instance.initModal({
        modalConfig: {
          openlogin: { label: "Social login", showOnModal: true },
        },
      });

      console.log("Web3Auth initialized. Connected:", instance.connected);

      setWeb3auth(instance);
      setWeb3authStatus("ready");

      // If Web3Auth auto-connected during init, capture the address
      if (instance.connected && instance.provider) {
        console.log("Web3Auth auto-connected on init");
        const addr = await fetchWeb3AuthAddress(instance);
        if (addr) {
          setWeb3authAddress(addr);
          persistSession("web3auth");
        }
      }
    } catch (e) {
      console.error("Web3Auth init failed:", e);
      setWeb3authStatus("error");
      setError("Web3Auth initialization failed.");
    }
  }, [persistSession]);

  // Initialize Web3Auth on mount
  useEffect(() => {
    if (web3authStatus === "idle") {
      initializeWeb3Auth();
    }
  }, [web3authStatus, initializeWeb3Auth]);

  // -------- Session restoration (runs once after Web3Auth is ready) --------
  useEffect(() => {
    if (restoreDone || restoreAttemptedRef.current || isRestoringRef.current)
      return;

    const attemptRestore = async () => {
      isRestoringRef.current = true;
      restoreAttemptedRef.current = true;

      try {
        const saved = loadSession();

        // ---- Handle wallet restore ----
        if (saved?.kind === "wallet") {
          if (connected) {
            console.log("Wallet already connected");
            setRestoreDone(true);
            return;
          }

          const target = saved.adapterName ?? walletAdapterName;
          const entry = wallets.find((w) => w.adapter.name === target);

          if (entry && entry.adapter.readyState !== "NotDetected") {
            console.log("Restoring wallet:", target);
            try {
              select(entry.adapter.name as any);
              await sleep(100);
              await connect();
            } catch (e) {
              console.warn("Wallet restore failed:", e);
            }
          }

          setRestoreDone(true);
          return;
        }

        // ---- Handle Web3Auth restore ----
        if (saved?.kind === "web3auth") {
          // Wait for Web3Auth to be ready
          if (web3authStatus !== "ready" || !web3auth) {
            return; // Will retry when ready
          }

          console.log(
            "Attempting Web3Auth restore. Connected:",
            web3auth.connected
          );

          // If already connected (auto-restored during init), just sync state
          if (web3auth.connected && web3auth.provider) {
            console.log("Web3Auth already connected");
            const addr = await fetchWeb3AuthAddress(web3auth);
            if (addr) {
              setWeb3authAddress(addr);
              persistSession("web3auth");
            } else {
              console.warn("Connected but no address - clearing session");
              clearSession();
            }
            setRestoreDone(true);
            return;
          }

          // Not connected - session must have expired
          console.log("Web3Auth session expired or invalid");
          clearSession();
          setRestoreDone(true);
          return;
        }

        // No saved session
        console.log("No saved session found");
        setRestoreDone(true);
      } catch (e) {
        console.error("Restore error:", e);
        clearSession();
        setRestoreDone(true);
      } finally {
        isRestoringRef.current = false;
      }
    };

    // Only restore if Web3Auth is ready (for web3auth sessions) or immediately (for wallet sessions)
    const saved = loadSession();
    if (saved?.kind === "web3auth" && web3authStatus !== "ready") {
      return; // Wait for Web3Auth to be ready
    }

    attemptRestore();
  }, [
    restoreDone,
    web3authStatus,
    web3auth,
    connected,
    walletAdapterName,
    wallets,
    select,
    connect,
    clearSession,
    persistSession,
    loadSession,
  ]);

  // -------- Active session computation --------
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

  // Persist active session
  useEffect(() => {
    if (!restoreDone) return;

    if (activeSession?.kind === "wallet") {
      persistSession("wallet", walletAdapterName);
      return;
    }
    if (activeSession?.kind === "web3auth") {
      persistSession("web3auth");
      return;
    }
    clearSession();
  }, [
    activeSession,
    persistSession,
    clearSession,
    walletAdapterName,
    restoreDone,
  ]);

  // -------- Sync AuthContext --------
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

  // -------- Disconnect other session before connecting --------
  const ensureNoOtherSession = useCallback(
    async (target: "wallet" | "web3auth") => {
      setVisible(false);

      if (target === "wallet") {
        if (web3auth?.connected) {
          console.log("Disconnecting Web3Auth before wallet connect");
          try {
            await web3auth.logout();
          } catch (e) {
            console.warn("Web3Auth logout failed:", e);
          }
          setWeb3authAddress(null);
        }
        return;
      }

      if (target === "web3auth") {
        if (connected) {
          console.log("Disconnecting wallet before Web3Auth connect");
          try {
            await disconnect();
          } catch (e) {
            console.warn("Wallet disconnect failed:", e);
          }
        }
      }
    },
    [connected, disconnect, setVisible, web3auth]
  );

  // -------- Wallet connect --------
  const connectAdapterByName = useCallback(
    async (adapterName: string) => {
      if (inflightRef.current) {
        console.warn("Already connecting wallet");
        return;
      }
      inflightRef.current = true;

      setError(null);
      setBusy("wallet");

      try {
        await ensureNoOtherSession("wallet");

        const entry = wallets.find((w) => w.adapter.name === adapterName);
        if (!entry) throw new Error(`${adapterName} adapter not found`);

        if (entry.adapter.readyState === "NotDetected") {
          throw new Error(`${adapterName} not detected. Install or enable it.`);
        }

        console.log("Connecting wallet:", adapterName);
        select(entry.adapter.name as any);
        await sleep(100);

        await entry.adapter.connect();
        persistSession("wallet", entry.adapter.name);
        setVisible(false);
        console.log("Wallet connected successfully");
      } catch (e: any) {
        console.error("Wallet connect failed:", e);
        setError(humanizeWalletError(e));
      } finally {
        setBusy(null);
        inflightRef.current = false;
      }
    },
    [ensureNoOtherSession, persistSession, select, setVisible, wallets]
  );

  const getBestInstalledWallet = useCallback(() => {
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
    setVisible(true);
  }, [connectAdapterByName, getBestInstalledWallet, setVisible]);

  // -------- Web3Auth connect --------
  const handleConnectWeb3Auth = useCallback(async () => {
    if (inflightRef.current) {
      console.warn("Already connecting Web3Auth");
      return;
    }

    if (web3authStatus !== "ready" || !web3auth) {
      setError("Web3Auth not ready");
      return;
    }

    inflightRef.current = true;
    setError(null);
    setBusy("web3auth");

    try {
      console.log("Connecting Web3Auth. Current status:", web3auth.status);

      await ensureNoOtherSession("web3auth");
      setVisible(false);

      // If already connected, disconnect first
      if (web3auth.connected) {
        console.log("Already connected - disconnecting first");
        try {
          await web3auth.logout();
          await sleep(500); // Wait for cleanup
        } catch (e) {
          console.warn("Logout before connect failed:", e);
        }
        setWeb3authAddress(null);
        clearSession();
      }

      console.log("Initiating Web3Auth connect...");

      // Connect with explicit error handling
      const provider = await web3auth.connect();

      if (!provider) {
        throw new Error("No provider returned from connect");
      }

      console.log("Web3Auth connected, fetching address...");

      // Wait a bit for provider to stabilize
      await sleep(200);

      const addr = await fetchWeb3AuthAddress(web3auth);

      if (addr) {
        console.log("Web3Auth address fetched:", addr);
        setWeb3authAddress(addr);
        persistSession("web3auth");
      } else {
        throw new Error("Could not fetch address after connection");
      }

      // Close any lingering modals
      try {
        (web3auth as any)?.modal?.closeModal?.();
      } catch {}
    } catch (e: any) {
      console.error("Web3Auth connect error:", e);

      const msg = e?.message ?? "";
      if (
        msg.includes("User cancelled") ||
        msg.includes("User closed") ||
        msg.includes("user closed the modal")
      ) {
        setError("Connection cancelled.");
      } else if (
        msg.includes("Already connecting") ||
        msg.includes("not ready")
      ) {
        setError("Already connecting. Please wait.");
      } else {
        setError(msg || "Failed to connect Social Login.");
      }

      clearSession();
    } finally {
      setBusy(null);
      inflightRef.current = false;
    }
  }, [
    clearSession,
    ensureNoOtherSession,
    persistSession,
    setVisible,
    web3auth,
    web3authStatus,
  ]);

  // -------- Disconnect --------
  const handleDisconnect = useCallback(async () => {
    if (inflightRef.current) return;
    inflightRef.current = true;

    setError(null);
    setBusy("disconnect");

    try {
      console.log("Disconnecting...");
      setVisible(false);

      if (connected) {
        try {
          await disconnect();
        } catch (e) {
          console.warn("Wallet disconnect error:", e);
        }
      }

      if (web3auth?.connected) {
        try {
          await web3auth.logout();
        } catch (e) {
          console.warn("Web3Auth logout error:", e);
        }
      }

      setWeb3authAddress(null);
      setAuthenticated(false, null, null);
      clearSession();
      console.log("Disconnected successfully");
    } catch (e) {
      console.error("Disconnect error:", e);
      setError("Failed to disconnect.");
    } finally {
      setBusy(null);
      inflightRef.current = false;
    }
  }, [
    clearSession,
    connected,
    disconnect,
    setAuthenticated,
    setVisible,
    web3auth,
  ]);

  // Close wallet modal after successful wallet connect
  useEffect(() => {
    if (connected) setVisible(false);
  }, [connected, setVisible]);

  const displayProviderLabel = useMemo(() => {
    if (!activeSession) return "Not connected";
    return activeSession.provider === "web3auth"
      ? "Social"
      : activeSession.provider.toUpperCase();
  }, [activeSession]);

  const displayAddress = activeSession?.address ?? null;

  // Connected UI
  if (activeSession && displayAddress) {
    return (
      <div className="wallet-bar">
        <div className="wallet-status">
          <span className="eyebrow">Wallet</span>
          <strong>{displayProviderLabel}</strong>
        </div>

        <div className="wallet-actions">
          <button
            className="pill"
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(displayAddress);
                setCopied(true);
                setTimeout(() => setCopied(false), 1200);
              } catch (e) {
                console.error("Clipboard copy failed:", e);
              }
            }}
            aria-label="Copy wallet address"
            disabled={!restoreDone}
          >
            {copied ? "Copied" : busy ? "…" : truncateAddress(displayAddress)}
          </button>

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

  // Disconnected UI
  return (
    <div className="wallet-bar">
      <div className="wallet-status">
        <span className="eyebrow">Wallet</span>
        <strong>
          {web3authStatus === "initializing"
            ? "Initializing..."
            : restoreDone
            ? "Not connected"
            : "Restoring..."}
        </strong>
      </div>

      <div className="wallet-actions">
        <button
          className="pill"
          onClick={handleConnectWallet}
          disabled={!restoreDone || busy !== null}
          type="button"
        >
          {busy === "wallet" ? "Connecting..." : "Phantom"}
        </button>

        <button
          className="pill"
          onClick={handleConnectWeb3Auth}
          disabled={!restoreDone || web3authStatus !== "ready" || busy !== null}
          type="button"
        >
          {web3authStatus === "initializing"
            ? "Loading..."
            : web3authStatus === "error"
            ? "Error"
            : busy === "web3auth"
            ? "Connecting..."
            : "Social Login"}
        </button>
      </div>

      {error && <p className="muted">{error}</p>}
    </div>
  );
}
