"use client";

import { useMemo, useState, useCallback } from "react";
import { COMMODITIES, getAssetBySymbol } from "../../config/assets";
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

const fxRate = 83;
const TOP_MOVERS = ["xGLD", "xSLV"];
const PRICE_FALLBACKS: Record<string, number> = {
  xGLD: 2320,
  xSLV: 28.4,
};

const discoverStocks: DiscoverAsset[] = [
  {
    symbol: "xGLD",
    name: "Gold",
    type: "commodities",
    change: "+1.5%",
    timeframe: "Today",
    price: "$5,314.10",
    note: "commodities",
    sparkline: [598.4, 601.2, 603.8, 602.4, 604.6, 606.8, 607.2, 608.1],
  },
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
];

export default function CommoditiesPage() {
  const { currency } = useCurrency();
  const { data: balances } = useTokenBalances();
  const [showBuy, setShowBuy] = useState(false);
  const [showOnramp, setShowOnramp] = useState(false);
  const [query, setQuery] = useState("");

  const priceMints = useMemo(() => COMMODITIES.map((c) => c.mint), []);
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
    return COMMODITIES.map((asset) => {
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
      asset: (typeof COMMODITIES)[number];
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
    if (!q) return COMMODITIES;
    return COMMODITIES.filter(
      (a) =>
        a.symbol.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.ticker.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div className="page">
      <section className="hero-card">
        <h1>Commodities</h1>
        <p className="muted">Tokenized Gold and metals. Simple pricing.</p>
        <div className="section-title" style={{ marginTop: 8 }}>
          <div>
            <p className="eyebrow">Portfolio (commodities only)</p>
            <div className="balance">{totalDisplay.primaryText}</div>
            <p className="muted">Live value of your commodity tokens</p>
          </div>
          <div className="action-row" style={{ width: "fit-content" }}>
            <button
              className="pill primary"
              onClick={() => setShowOnramp(true)}
            >
              Deposit
            </button>
            <button className="pill" onClick={() => setShowBuy(true)}>
              Buy
            </button>
          </div>
        </div>
        <div className="search" style={{ marginTop: 12 }}>
          <label htmlFor="commodities-search">Search</label>
          <input
            id="commodities-search"
            placeholder="Search Gold, Silver"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
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

      <section className="card soft">
        <div className="section-title">
          <h2>Your holdings</h2>
          <span className="muted">Commodities in this wallet</span>
        </div>
        {holdings.length === 0 ? (
          <div className="info-card">
            <strong>No commodity holdings</strong>
            <p className="muted">Deposit and buy to add Gold/Silver.</p>
            <div className="hero-actions">
              <button
                className="pill primary"
                onClick={() => setShowOnramp(true)}
              >
                Deposit
              </button>
              <button className="pill" onClick={() => setShowBuy(true)}>
                Buy
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
        <strong>Storage & fees</strong>
        <p className="muted">
          Underlying exposure held with regulated custodians. Fees shown before
          you confirm.
        </p>
      </section>

      {showBuy && <BuyWidget onClose={() => setShowBuy(false)} />}
      {showOnramp && <OnrampWidget onClose={() => setShowOnramp(false)} />}
    </div>
  );
}
