"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useCurrency from "../../hooks/useCurrency";
import useAuth from "../../hooks/useAuth";
import { formatMoney } from "../../lib/format/formatMoney";
import ChartStub from "../shared/ChartStub";
import BuyWidget from "../buy/BuyWidget";
import OnrampWidget from "../onramp/OnrampWidget";
import DcaWidget from "../dca/DcaWidget";
import BasketWidget from "../basket/BasketWidget";
import { BASKETS } from "../../config/baskets";
import { AssetLogo } from "../shared/AssetLogo";
import {
  getAssetBySymbol,
  getAssetByMint,
  CATEGORY_LABELS,
  type AssetCategory,
} from "../../config/assets";
import { BasketLogo } from "../shared/BasketLogo";
import ExploreBaskets from "./ExploreBaskets";
import { useTokenBalances } from "../../hooks/useTokenBalances";
import { useTokenPrices } from "../../hooks/useTokenPrice";
import { USDC } from "../../config/tokens";
import { DiscoverCard, DiscoverAsset } from "./DiscoverCard";

const fxRate = 83; // USD -> INR (mock)

const CATEGORY_ROUTE: Record<AssetCategory, string> = {
  stocks: "/stocks",
  crypto: "/crypto",
  "pre-ipo": "/pre-ipo",
  commodities: "/commodities",
  index: "/indices",
};

// If a token has no live price yet, we show a fallback and mark "est."
const PRICE_FALLBACKS_USD_BY_SYMBOL: Record<string, number> = {
  // Stocks
  NVDAx: 134.2,
  AAPLx: 192.44,
  MSFTx: 421.12,
  AMZNx: 186.12,
  METAx: 488.55,
  TSLAx: 182.09,
  GOOGLx: 158.1,

  // Crypto
  BTC: 68000,
  ETH: 3200,
  SOL: 180,
  USDC: 1,

  // Commodities
  xGLD: 2320,
  xSLV: 28.4,

  // Pre-IPO placeholders
  xSPACEX: 40,
  xSTRIPE: 32,
  xOPENAI: 28,
};

// Support both old/canonical mints and new "Xs" mints by normalizing to the Xs mint (primary)
const MINT_TO_PRIMARY: Record<string, string> = {
  // Primary Xs mints
  Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh:
    "Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh", // NVDAx
  XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp:
    "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp", // AAPLx
  Xs3eBt7uRfJX8QUs4suhyU8p2M6DoUDrJyWBa8LLZsg:
    "Xs3eBt7uRfJX8QUs4suhyU8p2M6DoUDrJyWBa8LLZsg", // AMZNx
  XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB:
    "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB", // TSLAx
  XsCPL9dNWBMvFtTmwcCA5v3xWPSMEBCszbQdiLLq6aN:
    "XsCPL9dNWBMvFtTmwcCA5v3xWPSMEBCszbQdiLLq6aN", // GOOGLx
  Xsa62P5mvPszXL1krVUnU5ar38bBSVcWAB6fmPCo5Zu:
    "Xsa62P5mvPszXL1krVUnU5ar38bBSVcWAB6fmPCo5Zu", // METAx
  XspzcW1PRtgf6Wj92HCiZdjzKCyFekVD8P5Ueh3dRMX:
    "XspzcW1PRtgf6Wj92HCiZdjzKCyFekVD8P5Ueh3dRMX", // MSFTx

  // Canonical mainnet mints -> primary Xs mints (backward compatibility)
  "9gwTegFJJErDpWJKjPfLr2g2zrE3nL1v5zpwbtsk3c6P":
    "Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh",
  HLm32fkK51wSi8TM9DvFmPuKjNbKzPkCTrXPnygsMVUp:
    "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp",
  "7VDEsKBXWSjVVaVzqz5vfuU2G5xCXvVRjTHqP9Kjqwn1":
    "Xs3eBt7uRfJX8QUs4suhyU8p2M6DoUDrJyWBa8LLZsg",
  "3n3LPMZ4PTLpKqTxkHfrAtqdqFKUxzGbrBhi7qKHnipG":
    "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB",
  "67So6HhEkba1cPTJ2KUQGCE2t5M9YnJLCBq4gQ1NyLAn":
    "XsCPL9dNWBMvFtTmwcCA5v3xWPSMEBCszbQdiLLq6aN",
  METADDFL6wWMWEoKTFJwcThTbUmtarRJZjRpzUvkxhr:
    "Xsa62P5mvPszXL1krVUnU5ar38bBSVcWAB6fmPCo5Zu",
  ANNmJmGxHwUsVRnqfLfbcH3eH1f1YuBDGoMbgeAt9zLP:
    "XspzcW1PRtgf6Wj92HCiZdjzKCyFekVD8P5Ueh3dRMX",
};

const trending = [
  { symbol: "AMZNx", move: "+2.3%" },
  { symbol: "METAx", move: "+1.4%" },
  { symbol: "xSPACEX", move: "+2.4%" },
  { symbol: "MAG7", basketId: "mag7", move: "+0.8%" },
];

const discoverAssets: DiscoverAsset[] = [
  {
    symbol: "xSLV",
    name: "Silver",
    type: "commodities",
    change: "+0.5%",
    timeframe: "Today",
    price: "$114",
    note: "commodities",
    sparkline: [188, 189, 190, 191, 191.6, 192, 192.3, 192.4],
  },
  {
    symbol: "MAG7",
    name: "Magnificent 7",
    type: "Basket",
    change: "+0.9%",
    timeframe: "Today",
    price: "$412.00",
    note: "US mega-cap basket",
    basketId: "mag7",
    sparkline: [398, 401, 404, 406, 408, 409, 411, 412],
  },
  {
    symbol: "NVDAx",
    name: "NVIDIA",
    type: "Stock",
    change: "+1.1%",
    timeframe: "Today",
    price: "$608.10",
    note: "US stock access",
    sparkline: [598.4, 601.2, 603.8, 602.4, 604.6, 606.8, 607.2, 608.1],
  },
  {
    symbol: "xSPACEX",
    name: "SpaceX",
    type: "Pre-IPO",
    change: "+2.4%",
    timeframe: "Today",
    price: "$85.00",
    note: "Pre-IPO access",
    sparkline: [78, 80, 81, 82, 83.5, 84, 84.6, 85],
  },
];

type ActiveModal = "buy" | "onramp" | "dca" | "basket" | null;

function safeNumber(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n);
}

function formatUSD(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
}

export default function LoggedInHome({ demo = false }: { demo?: boolean }) {
  const { currency } = useCurrency();
  const { walletAddress } = useAuth();
  const router = useRouter();
  const {
    data: balances,
    isLoading: balancesLoading,
    error: balancesError,
  } = useTokenBalances();

  // Ask prices only for mints we actually hold (non-zero), excluding USDC (we hardcode $1)
  const priceMints = useMemo(() => {
    if (!balances) return [];
    return Object.keys(balances).filter((mint) => {
      if (mint === USDC.mint) return false;
      return safeNumber(balances[mint]?.uiAmount, 0) > 0;
    });
  }, [balances]);

  const {
    data: pricesUsdByMint,
    isFetching: pricesLoading,
    refetch: refetchPrices,
  } = useTokenPrices(priceMints);

  const [perfView, setPerfView] = useState<"today" | "allTime">("today");
  const [range, setRange] = useState<"1D" | "1W" | "1M" | "1Y" | "ALL">("1M");
  const [loading] = useState(false);

  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [preselectSymbol, setPreselectSymbol] = useState<string | null>(null);
  const [basketId, setBasketId] = useState(BASKETS[0]?.id ?? "");

  const changeColor = useCallback((value: string) => {
    const v = value.trim();
    if (!v || v === "—") return "#6a665f";
    if (v.startsWith("-")) return "#c7393a";
    return "#0f8f6a";
  }, []);

  // -------- Build holdings (with correct name/ticker/logo) --------
  const holdings = useMemo(() => {
    if (!balances) return [];

    const rows = Object.entries(balances)
      .filter(([mint, bal]) => {
        if (mint === USDC.mint) return false; // cash section
        return safeNumber(bal?.uiAmount, 0) > 0;
      })
      .map(([mint, bal]) => {
        const primaryMint = MINT_TO_PRIMARY[mint] ?? mint;
        const asset = getAssetByMint(primaryMint);

        const symbol = asset?.symbol ?? `${mint.slice(0, 4)}…`;
        const name = asset?.name ?? "Unknown token";
        const ticker = asset?.ticker ?? symbol.replace(/x$/i, "");
        const logoURI = asset?.logoURI;
        const category = asset?.category as AssetCategory | undefined;

        // Price in USD from live prices hook
        const live = safeNumber(
          pricesUsdByMint?.[primaryMint] ?? pricesUsdByMint?.[mint],
          0
        );

        // Fallback price by symbol (USD)
        const fallback = safeNumber(PRICE_FALLBACKS_USD_BY_SYMBOL[symbol], 0);

        const priceUsd = live > 0 ? live : fallback;
        const isPriceFallback = !(live > 0) && priceUsd > 0;

        const uiAmount = safeNumber(bal.uiAmount, 0);
        const valueUsd = uiAmount * (priceUsd || 0);

        return {
          mint,
          uiAmount,
          symbol,
          name,
          ticker,
          logoURI,
          category,
          priceUsd,
          isPriceFallback,
          valueUsd,
          // if you later add real 24h change in assets.ts, this will show it
          change:
            typeof asset?.change24h === "number"
              ? `${asset.change24h >= 0 ? "+" : ""}${asset.change24h.toFixed(
                  1
                )}%`
              : "—",
        };
      })
      // Put priced assets first, then by value
      .sort((a, b) => {
        const ap = a.priceUsd > 0 ? 1 : 0;
        const bp = b.priceUsd > 0 ? 1 : 0;
        if (ap !== bp) return bp - ap;
        return b.valueUsd - a.valueUsd;
      });

    return rows;
  }, [balances, pricesUsdByMint]);

  const cashUsd = safeNumber(balances?.[USDC.mint]?.uiAmount, 0);

  const groupedHoldings = useMemo(() => {
    const groups: Record<
      AssetCategory,
      { totalUsd: number; count: number; logos: string[] }
    > = {
      stocks: { totalUsd: 0, count: 0, logos: [] },
      crypto: { totalUsd: 0, count: 0, logos: [] },
      "pre-ipo": { totalUsd: 0, count: 0, logos: [] },
      commodities: { totalUsd: 0, count: 0, logos: [] },
      index: { totalUsd: 0, count: 0, logos: [] },
    };

    holdings.forEach((h) => {
      if (!h.category) return;
      const g = groups[h.category];
      g.totalUsd += safeNumber(h.valueUsd, 0);
      g.count += 1;
      if (h.logoURI && g.logos.length < 4 && !g.logos.includes(h.logoURI)) {
        g.logos.push(h.logoURI);
      }
    });

    return (Object.keys(groups) as AssetCategory[])
      .map((cat) => ({
        category: cat,
        ...groups[cat],
      }))
      .filter((g) => g.count > 0)
      .sort((a, b) => b.totalUsd - a.totalUsd);
  }, [holdings]);

  const totals = useMemo(() => {
    const holdingsValueUsd = holdings.reduce(
      (sum, h) => sum + safeNumber(h.valueUsd, 0),
      0
    );
    const totalUsd = holdingsValueUsd + cashUsd;
    return { holdingsValueUsd, totalUsd };
  }, [holdings, cashUsd]);

  const totalDisplay = useMemo(
    () =>
      formatMoney({
        usdAmount: totals.totalUsd,
        inrAmount: totals.totalUsd * fxRate,
        currency,
        fxRate,
      }),
    [totals.totalUsd, currency]
  );

  const perf = useMemo(() => {
    // MVP no historical tracking
    return formatMoney({ usdAmount: 0, inrAmount: 0, currency, fxRate });
  }, [currency]);

  const cashDisplay = useMemo(() => {
    return formatMoney({
      usdAmount: cashUsd,
      inrAmount: cashUsd * fxRate,
      currency,
      fxRate,
    });
  }, [currency, cashUsd]);

  const openBuy = useCallback((symbol?: string) => {
    if (symbol) setPreselectSymbol(symbol);
    setActiveModal("buy");
  }, []);

  const openOnramp = useCallback(() => setActiveModal("onramp"), []);
  const openDca = useCallback(() => setActiveModal("dca"), []);
  const openBasket = useCallback((id?: string) => {
    if (id) setBasketId(id);
    setActiveModal("basket");
  }, []);

  const closeModal = useCallback(() => setActiveModal(null), []);

  return (
    <div className="page">
      {/* ====== Portfolio summary ====== */}
      <section className="card">
        <div className="section-title">
          <div>
            <p className="eyebrow">Total balance</p>
            <div className="balance">{totalDisplay.primaryText}</div>
            <p className="muted">
              ≈{" "}
              {totals.totalUsd.toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}{" "}
              USDC
            </p>

            {walletAddress && (
              <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                Connected • {walletAddress.slice(0, 4)}…
                {walletAddress.slice(-4)}
              </p>
            )}

            {(balancesLoading || pricesLoading) && (
              <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                Syncing wallet{balancesLoading ? "" : " + prices"}…
              </p>
            )}

            {!!balancesError && (
              <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                Balance fetch error: {String(balancesError)}
              </p>
            )}
          </div>

          <div style={{ display: "grid", gap: 10, justifyItems: "end" }}>
            <div className="segmented" role="group" aria-label="Performance">
              <button
                className={`segmented-btn${
                  perfView === "today" ? " is-active" : ""
                }`}
                onClick={() => setPerfView("today")}
                type="button"
              >
                Today
              </button>
              <button
                className={`segmented-btn${
                  perfView === "allTime" ? " is-active" : ""
                }`}
                onClick={() => setPerfView("allTime")}
                type="button"
              >
                All time
              </button>
            </div>
          </div>
        </div>

        <ChartStub range={range} onRangeChange={setRange} loading={loading} />

        <div className="action-row">
          <button
            className="action-btn primary"
            disabled={loading || demo}
            onClick={() => openBuy()}
            type="button"
          >
            Invest
          </button>

          <button
            className="action-btn"
            disabled={loading || demo}
            onClick={openDca}
            type="button"
          >
            Recurring/DCA
          </button>

          <button
            className="action-btn"
            disabled={loading || demo}
            onClick={openOnramp}
            type="button"
          >
            Add money
          </button>
        </div>
      </section>

      {/* ====== Modals ====== */}
      {activeModal === "buy" && <BuyWidget onClose={closeModal} />}
      {activeModal === "onramp" && <OnrampWidget onClose={closeModal} />}
      {activeModal === "dca" && <DcaWidget onClose={closeModal} />}
      {activeModal === "basket" && (
        <BasketWidget initialBasketId={basketId} onClose={closeModal} />
      )}

      {/* ====== Holdings ====== */}
      <section className="card">
        <div className="section-title">
          <h2>Holdings</h2>
          <button className="pill" type="button" onClick={() => openBuy()}>
            Invest more
          </button>
        </div>

        {groupedHoldings.length === 0 ? (
          <div className="info-card">
            <strong>No holdings yet</strong>
            <p className="muted">Buy your first asset to see it here.</p>
          </div>
        ) : (
          <div className="list-compact">
            {cashUsd > 0 && (
              <button
                className="list-item"
                type="button"
                onClick={openOnramp}
                style={{ width: "100%", textAlign: "left" }}
              >
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <AssetLogo src={USDC.logoURI} alt="USDC" size={32} />
                  <div style={{ display: "grid", gap: 4 }}>
                    <strong>Cash</strong>
                    <span className="muted" style={{ fontSize: 12 }}>
                      Ready to invest
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <strong>{cashDisplay.primaryText}</strong>
                  <span
                    className="muted"
                    style={{ fontSize: 12, display: "block" }}
                  >
                    {cashDisplay.secondaryText}
                  </span>
                </div>
              </button>
            )}
            {groupedHoldings.map((group) => {
              const display = formatMoney({
                usdAmount: group.totalUsd,
                inrAmount: group.totalUsd * fxRate,
                currency,
                fxRate,
              });

              const route = CATEGORY_ROUTE[group.category];

              return (
                <button
                  key={group.category}
                  className="list-item"
                  type="button"
                  onClick={() => router.push(route)}
                  style={{ width: "100%", textAlign: "left" }}
                >
                  <div
                    style={{ display: "flex", gap: 12, alignItems: "center" }}
                  >
                    <div style={{ display: "flex" }}>
                      {group.logos.map((logo, idx) => (
                        <div
                          key={logo}
                          style={{
                            marginLeft: idx === 0 ? 0 : -10,
                            borderRadius: "999px",
                            border: "2px solid var(--surface)",
                            background: "var(--surface)",
                          }}
                        >
                          <AssetLogo src={logo} alt="asset" size={32} />
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "grid", gap: 4 }}>
                      <strong>{CATEGORY_LABELS[group.category]}</strong>
                      <span className="muted" style={{ fontSize: 12 }}>
                        {group.count} holding{group.count === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <strong>{display.primaryText}</strong>
                    <span
                      className="muted"
                      style={{ fontSize: 12, display: "block" }}
                    >
                      {display.secondaryText}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* ====== Discover ====== */}
      <section className="card">
        <div className="section-title">
          <h2>Discover</h2>
          <span className="muted">Trending movers</span>
        </div>

        <div className="discover-grid" role="list">
          {discoverAssets.map((item) => (
            <DiscoverCard
              key={item.symbol}
              item={item}
              onSelect={(symbol) => openBuy(symbol)}
            />
          ))}
        </div>
      </section>

      {/* ====== Explore Baskets ======
      <ExploreBaskets
        onSelect={(id) => {
          setBasketId(id);
          openBasket(id);
        }}
      /> */}

      {/* ====== Baskets ====== */}
      <section className="card">
        <div className="section-title">
          <h2>Featured baskets</h2>
          <span className="muted">Equal-weight, fast checkout</span>
        </div>

        <div className="list-compact">
          {BASKETS.map((b) => {
            const isDisabled = Boolean((b as any).disabled);
            const reason = (b as any).disabledReason as string | undefined;

            return (
              <div key={b.id} className="list-item">
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <BasketLogo basket={b} size={48} />
                  <div>
                    <strong>{b.name}</strong>
                    <p className="muted" style={{ marginTop: 4 }}>
                      {b.description}
                    </p>
                    <p className="muted" style={{ marginTop: 4, fontSize: 12 }}>
                      {b.items.length} assets • equal allocation
                      {isDisabled ? " • coming soon" : ""}
                    </p>
                    {isDisabled && reason && (
                      <p
                        className="muted"
                        style={{ marginTop: 4, fontSize: 12 }}
                      >
                        {reason}
                      </p>
                    )}
                  </div>
                </div>

                <div style={{ display: "grid", gap: 6, alignItems: "center" }}>
                  <button
                    className="pill primary compact"
                    type="button"
                    onClick={() => openBasket(b.id)}
                    disabled={demo || isDisabled}
                    aria-disabled={demo || isDisabled}
                  >
                    Preview & buy
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ====== Cash ====== */}
      {/* Cash moved into holdings list */}
    </div>
  );
}
