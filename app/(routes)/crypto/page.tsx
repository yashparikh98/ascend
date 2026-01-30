"use client";

import { useMemo, useState, useCallback } from "react";
import { CRYPTO, getAssetBySymbol } from "../../config/assets";
import { AssetLogo } from "../../components/shared/AssetLogo";
import useCurrency from "../../hooks/useCurrency";
import { formatMoney } from "../../lib/format/formatMoney";
import { useTokenBalances } from "../../hooks/useTokenBalances";
import { useTokenPrices } from "../../hooks/useTokenPrice";
import BuyWidget from "../../components/buy/BuyWidget";
import OnrampWidget from "../../components/onramp/OnrampWidget";
import { USDC } from "../../config/tokens";
import {
  DiscoverAsset,
  DiscoverCard,
} from "../../components/home/DiscoverCard";

const fxRate = 83; // mock
const PRICE_FALLBACKS: Record<string, number> = {
  BTC: 68000,
  ETH: 3200,
  SOL: 180,
  USDC: 1,
};

const discoverStocks: DiscoverAsset[] = [
  {
    symbol: "SOL",
    name: "Solana",
    type: "Crypto",
    change: "+1.5%",
    timeframe: "Today",
    price: "$116.10",
    note: "Crypto",
    sparkline: [598.4, 601.2, 603.8, 602.4, 604.6, 606.8, 607.2, 608.1],
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    type: "Crypto",
    change: "+0.5%",
    timeframe: "Today",
    price: "$2788",
    note: "Crypto",
    sparkline: [188, 189, 190, 191, 191.6, 192, 192.3, 192.4],
  },
  {
    symbol: "BTC",
    name: "Bitcoin",
    type: "Crypto",
    change: "+1.8%",
    timeframe: "Today",
    price: "$83,251.12",
    note: "Crypto",
    sparkline: [180, 181, 182.4, 183.2, 184.1, 185.4, 186.1, 186.1],
  },
];

export default function CryptoPage() {
  const { currency } = useCurrency();
  const { data: balances } = useTokenBalances();
  const [showBuy, setShowBuy] = useState(false);
  const [showOnramp, setShowOnramp] = useState(false);
  const [query, setQuery] = useState("");

  const priceMints = useMemo(() => CRYPTO.map((c) => c.mint), []);
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
    return CRYPTO.map((asset) => {
      const bal = balances[asset.mint];
      if (!bal || (bal.uiAmount ?? 0) <= 0) return null;
      const price = prices?.[asset.mint] ?? PRICE_FALLBACKS[asset.symbol] ?? 0;
      const valueUsd = (bal.uiAmount ?? 0) * price;
      return {
        asset,
        uiAmount: bal.uiAmount ?? 0,
        valueUsd,
      };
    })
      .filter(Boolean)
      .sort((a: any, b: any) => b.valueUsd - a.valueUsd) as {
      asset: (typeof CRYPTO)[number];
      uiAmount: number;
      valueUsd: number;
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
    if (!q) return CRYPTO;
    return CRYPTO.filter(
      (a) =>
        a.symbol.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.ticker.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div className="page">
      <section className="hero-card">
        <h1>Crypto</h1>
        <p className="muted">Majors + stables. Clear swap fees.</p>
        <div className="section-title" style={{ marginTop: 8 }}>
          <div>
            <p className="eyebrow">Portfolio (crypto only)</p>
            <div className="balance">{totalDisplay.primaryText}</div>
            <p className="muted">Live value of your crypto holdings</p>
          </div>
          <div className="action-row" style={{ width: "fit-content" }}>
            <button
              className="pill primary"
              onClick={() => setShowOnramp(true)}
            >
              Deposit
            </button>
            <button className="pill" onClick={() => setShowBuy(true)}>
              Swap
            </button>
          </div>
        </div>
        <div className="search" style={{ marginTop: 12 }}>
          <label htmlFor="crypto-search">Search</label>
          <input
            id="crypto-search"
            placeholder="Search BTC, SOL, USDC"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </section>

      <section className="card soft">
        <div className="section-title">
          <h2>Your holdings</h2>
          <span className="muted">Crypto in this wallet</span>
        </div>
        {holdings.length === 0 ? (
          <div className="info-card">
            <strong>No crypto holdings yet</strong>
            <p className="muted">Deposit or swap to add crypto.</p>
            <div className="hero-actions">
              <button
                className="pill primary"
                onClick={() => setShowOnramp(true)}
              >
                Deposit
              </button>
              <button className="pill" onClick={() => setShowBuy(true)}>
                Swap
              </button>
            </div>
          </div>
        ) : (
          <div className="list-compact">
            {holdings.map((h) => {
              const display = formatMoney({
                usdAmount: h.valueUsd,
                inrAmount: h.valueUsd * fxRate,
                currency,
                fxRate,
              }).primaryText;
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
                      </p>
                    </div>
                  </div>
                  <strong>{display}</strong>
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
        <strong>Fees & network</strong>
        <p className="muted">
          Swap fees and network fees are shown before you confirm any trade.
        </p>
      </section>

      {showBuy && <BuyWidget onClose={() => setShowBuy(false)} />}
      {showOnramp && <OnrampWidget onClose={() => setShowOnramp(false)} />}
    </div>
  );
}
