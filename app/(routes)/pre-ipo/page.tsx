"use client";

import { useMemo, useState, useCallback } from "react";
import { PRE_IPO, getAssetBySymbol } from "../../config/assets";
import { AssetLogo } from "../../components/shared/AssetLogo";
import useCurrency from "../../hooks/useCurrency";
import { formatMoney } from "../../lib/format/formatMoney";
import { useTokenBalances } from "../../hooks/useTokenBalances";
import { useTokenPrices } from "../../hooks/useTokenPrice";
import {
  buildSparkline,
  formatPctChange,
  formatUsdPrice,
} from "../../lib/pricing/display";
import BuyWidget from "../../components/buy/BuyWidget";
import OnrampWidget from "../../components/onramp/OnrampWidget";
import {
  DiscoverAsset,
  DiscoverCard,
} from "../../components/home/DiscoverCard";

const fxRate = 83;
const DISCOVER_SYMBOLS = ["xSPACEX", "xOPENAI"];

export default function PreIPOPage() {
  const { currency } = useCurrency();
  const { data: balances } = useTokenBalances();
  const [showBuy, setShowBuy] = useState(false);
  const [showOnramp, setShowOnramp] = useState(false);
  const [query, setQuery] = useState("");

  const priceMints = useMemo(() => PRE_IPO.map((a) => a.mint), []);
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
    return PRE_IPO.map((asset) => {
      const bal = balances[asset.mint];
      if (!bal || (bal.uiAmount ?? 0) <= 0) return null;
      const price = prices?.[asset.mint] ?? 0;
      const valueUsd = (bal.uiAmount ?? 0) * price;
      return {
        asset,
        uiAmount: bal.uiAmount ?? 0,
        valueUsd,
      };
    })
      .filter(Boolean)
      .sort((a: any, b: any) => b.valueUsd - a.valueUsd) as {
      asset: (typeof PRE_IPO)[number];
      uiAmount: number;
      valueUsd: number;
    }[];
  }, [balances, prices]);

  const discoverAssets = useMemo<DiscoverAsset[]>(() => {
    return DISCOVER_SYMBOLS.map((symbol) => {
      const asset = getAssetBySymbol(symbol);
      if (!asset) return null;
      const livePrice = prices?.[asset.mint] ?? null;
      return {
        symbol: asset.symbol,
        name: asset.name,
        type: "Pre-IPO",
        change: formatPctChange(asset.change24h),
        timeframe: "Live",
        price: formatUsdPrice(livePrice),
        note: "On-chain market",
        sparkline: buildSparkline(asset.symbol, livePrice),
      };
    }).filter(Boolean) as DiscoverAsset[];
  }, [prices]);

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
    if (!q) return PRE_IPO;
    return PRE_IPO.filter(
      (a) =>
        a.symbol.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.ticker.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div className="page">
      <section className="hero-card">
        <h1>Pre-IPO</h1>
        <p className="muted">
          SPV-backed late-stage equity. Clear risks & eligibility.
        </p>
        <div className="section-title" style={{ marginTop: 8 }}>
          <div>
            <p className="eyebrow">Portfolio (pre-IPO only)</p>
            <div className="balance">{totalDisplay.primaryText}</div>
            <p className="muted">Live value of your pre-IPO tokens</p>
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
          <label htmlFor="preipo-search">Search</label>
          <input
            id="preipo-search"
            placeholder="Search SpaceX, Stripe, OpenAI"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </section>

      <section className="banner">
        <strong>SPV-backed tokens</strong>
        <span className="muted">
          Tokens map 1:1 to SPV units. Redemption/settlement per offering terms.
        </span>
        <div className="chip-row">
          <span className="chip">SPV-backed</span>
          <span className="chip">Transparent fees</span>
          <span className="chip">Read risks</span>
        </div>
      </section>

      <section className="card">
        <div className="section-title">
          <h2>Top movers</h2>
          <span className="muted">Stocks only</span>
        </div>

        <div className="discover-grid" role="list">
          {discoverAssets.map((item) => (
            <DiscoverCard
              key={item.symbol}
              item={item}
              onSelect={() => setShowBuy(true)}
            />
          ))}
        </div>
      </section>

      <section className="card soft">
        <div className="section-title">
          <h2>Your holdings</h2>
          <span className="muted">Pre-IPO in this wallet</span>
        </div>
        {holdings.length === 0 ? (
          <div className="info-card">
            <strong>No pre-IPO holdings</strong>
            <p className="muted">Deposit and buy to add pre-IPO exposure.</p>
            <div className="hero-actions">
              <button
                className="pill primary"
                onClick={() => setShowOnramp(true)}
              >
                Deposit
              </button>
              <button className="pill" onClick={() => setShowBuy(true)}>
                Browse
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

      <section className="info-card">
        <strong>Risks & eligibility</strong>
        <p className="muted">
          Pre-IPO tokens are illiquid and can be unavailable in some regions.
          Read terms and hold through redemption windows.
        </p>
      </section>

      {showBuy && <BuyWidget onClose={() => setShowBuy(false)} />}
      {showOnramp && <OnrampWidget onClose={() => setShowOnramp(false)} />}
    </div>
  );
}
