"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getAssetsByCategory,
  type AssetCategory,
} from "../config/assets";
import { DiscoverCard, DiscoverAsset } from "../components/home/DiscoverCard";
import { AssetLogo } from "../components/shared/AssetLogo";
import useCurrency from "../hooks/useCurrency";
import { formatMoney } from "../lib/format/formatMoney";
import { useTokenBalances } from "../hooks/useTokenBalances";
import { useTokenPrices } from "../hooks/useTokenPrice";
import { USDC } from "../config/tokens";
import { useRouter } from "next/navigation";
import { BASKETS } from "../config/baskets";
import { BasketLogo } from "../components/shared/BasketLogo";

type TabKey = Exclude<AssetCategory, "index"> | "baskets";

const MOBILE_TABS: { key: TabKey; label: string }[] = [
  { key: "stocks", label: "Stocks" },
  { key: "crypto", label: "Crypto" },
  { key: "commodities", label: "Commodities" },
  { key: "pre-ipo", label: "Pre-IPO" },
  { key: "baskets", label: "Baskets" },
];

function buildSpark(base: number, variance = 0.02, points = 8) {
  const out: number[] = [];
  let val = base;
  for (let i = 0; i < points; i++) {
    const delta =
      base * (Math.random() * variance * (Math.random() > 0.5 ? 1 : -1));
    val = Math.max(0, val + delta);
    out.push(Number(val.toFixed(2)));
  }
  return out;
}

function toDiscover(asset: any): DiscoverAsset {
  const price = asset.price ?? asset.fallbackPrice ?? 100;
  const change =
    typeof asset.change24h === "number"
      ? `${asset.change24h >= 0 ? "+" : ""}${asset.change24h.toFixed(1)}%`
      : "+0.8%";
  return {
    symbol: asset.symbol,
    name: asset.name,
    type:
      asset.category === "pre-ipo"
        ? "Pre-IPO"
        : asset.category[0].toUpperCase() + asset.category.slice(1),
    change,
    timeframe: "Today",
    price: `$${price}`,
    note: asset.category === "pre-ipo" ? "Late-stage" : undefined,
    sparkline: buildSpark(price),
  };
}

export default function InvestPage() {
  const [tab, setTab] = useState<TabKey>("stocks");
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const router = useRouter();
  const { currency } = useCurrency();
  const fxRate = 83;

  useEffect(() => {
    const mobile = window.innerWidth <= 1100;
    setIsMobile(mobile);
    if (!mobile) {
      router.replace("/"); // desktop users go home
    }
  }, [router]);

  const assets = useMemo(() => {
    if (tab === "baskets") return [];
    return getAssetsByCategory(tab as AssetCategory);
  }, [tab]);

  const priceMints = useMemo(() => assets.map((a) => a.mint), [assets]);
  const { data: balances } = useTokenBalances();
  const { data: prices } = useTokenPrices(priceMints);

  const discoverAssets = useMemo(() => {
    if (tab === "baskets") {
      return BASKETS.slice(0, 6).map<DiscoverAsset>((b) => ({
        symbol: b.id.toUpperCase(),
        name: b.name,
        type: "Basket",
        change: "+0.8%",
        timeframe: "Today",
        price: "$100",
        note: b.description,
        basketId: b.id,
        sparkline: buildSpark(100),
      }));
    }
    return assets.slice(0, 6).map(toDiscover);
  }, [assets, tab]);

  const holdings = useMemo(() => {
    if (!balances || tab === "baskets") return [];
    return assets
      .map((asset) => {
        const bal = balances[asset.mint];
        const uiAmount = bal?.uiAmount ?? 0;
        if (uiAmount <= 0) return null;
        const price =
          prices?.[asset.mint] ??
          (asset as any).price ??
          (asset as any).fallbackPrice ??
          0;
        const valueUsd = uiAmount * price;
        return { asset, uiAmount, price, valueUsd };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b.valueUsd - a.valueUsd) as {
      asset: (typeof assets)[number];
      uiAmount: number;
      price: number;
      valueUsd: number;
    }[];
  }, [assets, balances, prices, tab]);

  if (isMobile === false) return null;
  if (isMobile === null) return null;

  return (
    <div className="page">
      <section className="hero-card">
        <h1>Invest</h1>
        <p className="muted">
          Switch categories and tap a mover to start investing.
        </p>
        <div className="scroll-row" aria-label="Categories">
          {MOBILE_TABS.map((t) => (
            <button
              key={t.key}
              className={`chip${t.key === tab ? " is-active" : ""}`}
              type="button"
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      {/* Holdings first on mobile */}
      <section className="card">
        <div className="section-title">
          <h2>Holdings</h2>
          <span className="muted">
            {MOBILE_TABS.find((t) => t.key === tab)?.label}
          </span>
        </div>

        {tab === "baskets" ? (
          <div className="info-card">
            <strong>Baskets</strong>
            <p className="muted">
              Curated sets you can buy in one tap. Holdings appear per asset
              category.
            </p>
          </div>
        ) : holdings.length === 0 ? (
          <div className="info-card">
            <strong>No holdings in this category</strong>
            <p className="muted">Buy or deposit to see them here.</p>
          </div>
        ) : (
          <div className="list-compact">
            {holdings.map((h) => {
              const display = formatMoney({
                usdAmount: h.valueUsd,
                inrAmount: h.valueUsd * fxRate,
                currency,
                fxRate,
              });
              const priceDisplay = formatMoney({
                usdAmount: h.price,
                inrAmount: h.price * fxRate,
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
                      <p className="muted" style={{ fontSize: 12 }}>
                        {h.asset.name}
                      </p>
                      <p className="muted" style={{ fontSize: 12 }}>
                        {h.uiAmount.toFixed(4)} {h.asset.symbol} •{" "}
                        {priceDisplay}
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <strong>{display.primaryText}</strong>
                    <p className="muted" style={{ fontSize: 12 }}>
                      {display.secondaryText}
                    </p>
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
          <span className="muted">
            {MOBILE_TABS.find((t) => t.key === tab)?.label}
          </span>
        </div>

        <div className="discover-grid" role="list">
          {discoverAssets.map((item) => (
            <DiscoverCard key={item.symbol} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
