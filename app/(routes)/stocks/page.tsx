"use client";

import { useMemo, useState, useCallback } from "react";
import { STOCKS, getAssetBySymbol, getAssetByMint } from "../../config/assets";
import { AssetLogo } from "../../components/shared/AssetLogo";
import useCurrency from "../../hooks/useCurrency";
import { formatMoney } from "../../lib/format/formatMoney";
import { useTokenBalances } from "../../hooks/useTokenBalances";
import { useTokenPrices } from "../../hooks/useTokenPrice";
import BuyWidget from "../../components/buy/BuyWidget";
import OnrampWidget from "../../components/onramp/OnrampWidget";
import {
  DiscoverAsset,
  DiscoverCard,
} from "../../components/home/DiscoverCard";

const discoverStocks: DiscoverAsset[] = [
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
    symbol: "AAPLx",
    name: "Apple",
    type: "Stock",
    change: "+0.8%",
    timeframe: "Today",
    price: "$192.44",
    note: "Consumer tech",
    sparkline: [188, 189, 190, 191, 191.6, 192, 192.3, 192.4],
  },
  {
    symbol: "AMZNx",
    name: "Amazon",
    type: "Stock",
    change: "+1.4%",
    timeframe: "Today",
    price: "$186.12",
    note: "E-commerce",
    sparkline: [180, 181, 182.4, 183.2, 184.1, 185.4, 186.1, 186.1],
  },
  {
    symbol: "MSFTx",
    name: "Microsoft",
    type: "Stock",
    change: "+0.9%",
    timeframe: "Today",
    price: "$421.12",
    note: "Productivity + AI",
    sparkline: [410, 412, 414, 415.6, 417.2, 419, 420.4, 421.1],
  },
];

const fxRate = 83; // INR conversion (mock)
// Fallbacks for xStocks when live price is missing
const PRICE_FALLBACKS: Record<string, number> = {
  NVDAx: 134.2,
  AAPLx: 192.44,
  MSFTx: 421.12,
  AMZNx: 186.12,
  METAx: 488.55,
  TSLAx: 182.09,
  GOOGLx: 158.1,
};

// Normalize mints to the Xs versions (primary) so quotes & holdings align
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
  // Canonical mints -> primary Xs mints (backward compat)
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

const topMovers = ["NVDAx", "AMZNx", "METAx"];

export default function StocksPage() {
  const { currency } = useCurrency();
  const { data: balances } = useTokenBalances();
  const [showBuy, setShowBuy] = useState(false);
  const [showOnramp, setShowOnramp] = useState(false);
  const [query, setQuery] = useState("");

  const priceMints = useMemo(() => STOCKS.map((s) => s.mint), []);
  const {
    data: prices,
    isFetching: pricesLoading,
    refetch: refetchPrices,
  } = useTokenPrices(priceMints);

  const changeColor = useCallback((value: number | null | undefined) => {
    if (value === undefined || value === null) return "#6a665f";
    if (value < 0) return "#c7393a";
    if (value > 0) return "#0f8f6a";
    return "#6a665f";
  }, []);

  const holdings = useMemo(() => {
    if (!balances) return [];

    return Object.entries(balances)
      .map(([mint, bal]) => {
        const primaryMint = MINT_TO_PRIMARY[mint] ?? mint;
        const asset = getAssetByMint(primaryMint);
        if (!asset) return null; // only show known stocks
        if (asset.category !== "stocks") return null;

        const uiAmount = bal?.uiAmount ?? 0;
        if (uiAmount <= 0) return null;

        const price =
          prices?.[primaryMint] ?? PRICE_FALLBACKS[asset.symbol] ?? 0;
        const valueUsd = uiAmount * price;

        return {
          asset,
          uiAmount,
          valueUsd,
          price,
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b.valueUsd - a.valueUsd) as {
      asset: (typeof STOCKS)[number];
      uiAmount: number;
      valueUsd: number;
      price: number;
    }[];
  }, [balances, prices]);

  const totalUsd = useMemo(
    () => holdings.reduce((sum, h) => sum + h.valueUsd, 0),
    [holdings]
  );
  const totalDisplay = formatMoney({
    usdAmount: totalUsd,
    inrAmount: totalUsd * fxRate,
    currency,
    fxRate,
  });

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return STOCKS;
    return STOCKS.filter(
      (a) =>
        a.symbol.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.ticker.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div className="page">
      <section className="hero-card">
        <h1>US Stocks</h1>
        <p className="muted">
          Fractional, tokenized US equities. Clear fees, INR/USD toggle on top.
        </p>
        <div className="section-title" style={{ marginTop: 8 }}>
          <div>
            <p className="eyebrow">Portfolio (stocks only)</p>
            <div className="balance">{totalDisplay.primaryText}</div>
            <p className="muted">Live value of your stock tokens</p>
          </div>
          <div className="action-row" style={{ width: "fit-content" }}>
            <button
              className="pill primary"
              onClick={() => setShowOnramp(true)}
            >
              Deposit
            </button>
            <button className="pill" onClick={() => setShowBuy(true)}>
              Invest
            </button>
          </div>
        </div>
        <div className="search" style={{ marginTop: 12 }}>
          <label htmlFor="stock-search">Search</label>
          <input
            id="stock-search"
            placeholder="Search NVDA, AAPL, MSFT"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </section>
      <section className="card soft">
        <div className="section-title">
          <h2>Your holdings</h2>
          <span className="muted">Stocks in this wallet</span>
        </div>
        {holdings.length === 0 ? (
          <div className="info-card">
            <strong>You have no stock holdings yet</strong>
            <p className="muted">Deposit and buy your first stock.</p>
            <div className="hero-actions">
              <button
                className="pill primary"
                onClick={() => setShowOnramp(true)}
              >
                Deposit
              </button>
              <button className="pill" onClick={() => setShowBuy(true)}>
                Browse stocks
              </button>
            </div>
          </div>
        ) : (
          <div className="list-compact">
            {holdings.map((h) => {
              const money = formatMoney({
                usdAmount: h.valueUsd,
                inrAmount: h.valueUsd * fxRate,
                currency,
                fxRate,
              });
              const priceMoney = formatMoney({
                usdAmount: h.price,
                inrAmount: h.price * fxRate,
                currency,
                fxRate,
              });
              return (
                <div key={h.asset.mint} className="list-item">
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <AssetLogo
                      src={h.asset.logoURI}
                      alt={h.asset.symbol}
                      size={28}
                    />
                    <div>
                      <strong>{h.asset.symbol}</strong>
                      <p className="muted">
                        {h.uiAmount.toFixed(4)} {h.asset.symbol}
                        <span
                          className="muted"
                          style={{ fontSize: 12, marginLeft: 6 }}
                        >
                          {priceMoney.primaryText} ({priceMoney.secondaryText})
                        </span>
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: "right", display: "grid", gap: 2 }}>
                    <strong>{money.primaryText}</strong>
                    <span className="muted" style={{ fontSize: 12 }}>
                      {money.secondaryText}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
      <section className="card">
        <div className="section-title">
          <h2>Top movers</h2>
          <span className="muted">Stocks only</span>
        </div>

        <div className="discover-grid" role="list">
          {discoverStocks.map((item) => (
            <DiscoverCard
              key={item.symbol}
              item={item}
              onSelect={() => setShowBuy(true)}
            />
          ))}
        </div>
      </section>

      <section className="info-card">
        <strong>Market hours</strong>
        <p className="muted">
          US markets closed? Orders queue and execute at next session; prices
          may be delayed.
        </p>
      </section>

      {showBuy && <BuyWidget onClose={() => setShowBuy(false)} />}
      {showOnramp && <OnrampWidget onClose={() => setShowOnramp(false)} />}
    </div>
  );
}
