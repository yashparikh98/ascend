import LearnMoreModal from "../shared/LearnMoreModal";
import { useCallback, useMemo, useState } from "react";
import { BASKETS } from "../../config/baskets";
import { getAssetBySymbol } from "../../config/assets";
import { BasketLogo } from "../shared/BasketLogo";
import { DiscoverCard, DiscoverAsset } from "./DiscoverCard";
import { useTokenPrices } from "../../hooks/useTokenPrice";
import {
  buildSparkline,
  formatPctChange,
  formatUsdPrice,
} from "../../lib/pricing/display";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

type Props = {
  onPreview: () => void;
  onConnect?: () => void; // optional: hook into your wallet modal
  onCreateAccount?: () => void; // optional
  onCategory?: (cat: string) => void; // optional routing
  onAsset?: (name: string) => void; // optional routing
};

const categories = [
  { key: "Stocks", desc: "US equities" },
  { key: "Crypto", desc: "BTC, ETH + more" },
  { key: "Indices", desc: "MAG 7, S&P themes" },
  { key: "Pre-IPO", desc: "SPV-backed" },
  { key: "Commodities", desc: "Gold, etc." },
];

const DISCOVER_SYMBOLS = ["xSLV", "NVDAx", "xSPACEX"];
const DISCOVER_BASKET_ID = "mag7";

export default function LoggedOutHome({
  onPreview,
  onConnect,
  onCreateAccount,
  onCategory,
  onAsset,
}: Props) {
  const [showModal, setShowModal] = useState(false);
  const { setVisible } = useWalletModal();

  const discoverMints = useMemo(() => {
    const mintSet = new Set<string>();
    DISCOVER_SYMBOLS.forEach((symbol) => {
      const asset = getAssetBySymbol(symbol);
      if (asset?.mint) mintSet.add(asset.mint);
    });
    const discoverBasket = BASKETS.find(
      (basket) => basket.id === DISCOVER_BASKET_ID
    );
    discoverBasket?.items.forEach((item) => {
      if (item.mint) mintSet.add(item.mint);
    });
    return Array.from(mintSet);
  }, []);

  const { data: prices } = useTokenPrices(discoverMints);

  const discoverAssets = useMemo<DiscoverAsset[]>(() => {
    const cards = DISCOVER_SYMBOLS.map((symbol) => {
      const asset = getAssetBySymbol(symbol);
      if (!asset) return null;
      const livePrice = prices?.[asset.mint] ?? null;
      return {
        symbol: asset.symbol,
        name: asset.name,
        type:
          asset.category === "pre-ipo"
            ? "Pre-IPO"
            : asset.category === "commodities"
            ? "Commodity"
            : asset.category === "stocks"
            ? "Stock"
            : "Crypto",
        change: formatPctChange(asset.change24h),
        timeframe: "Live",
        price: formatUsdPrice(livePrice),
        note: "On-chain market",
        sparkline: buildSparkline(asset.symbol, livePrice),
      };
    }).filter(Boolean) as DiscoverAsset[];

    const discoverBasket = BASKETS.find(
      (basket) => basket.id === DISCOVER_BASKET_ID
    );
    if (discoverBasket) {
      const pricedItems = discoverBasket.items
        .map((item) => Number(prices?.[item.mint] ?? 0))
        .filter((price) => price > 0);
      const basketPrice =
        pricedItems.length > 0
          ? pricedItems.reduce((sum, price) => sum + price, 0) /
            pricedItems.length
          : null;

      cards.splice(1, 0, {
        symbol: discoverBasket.id.toUpperCase(),
        name: discoverBasket.name,
        type: "Basket",
        change: "—",
        timeframe: "Live",
        price: formatUsdPrice(basketPrice),
        note: discoverBasket.description,
        basketId: discoverBasket.id,
        sparkline: buildSparkline(discoverBasket.id, basketPrice),
      });
    }

    return cards;
  }, [prices]);

  const handleConnect = useCallback(() => {
    if (onConnect) {
      onConnect();
      return;
    }
    setVisible(true);
  }, [onConnect, setVisible]);

  return (
    <div className="page">
      <section className="hero-card">
        <div>
          <h1>Access the Global Economy</h1>
          <p className="muted">
            Global stocks, commodities, crypto, and pre-IPO assets — all in one
            non-custodial app.
          </p>
        </div>

        <div className="hero-actions">
          <button
            className="pill primary"
            // onClick={onCreateAccount ?? handleConnect}
            type="button"
          >
            Get Early Access
          </button>
        </div>

        <div className="hero-highlight-grid">
          <div className="hero-highlight">
            <div className="hero-highlight__header">
              <div className="hero-highlight__title">
                <span className="hero-chip">Multi-asset</span>
                <strong>Invest Through Baskets</strong>
              </div>
              <span className="muted" style={{ fontSize: 12 }}>
                Long-term, disciplined
              </span>
            </div>
            <p className="muted">
              Own multiple assets at once instead of picking individual trades.
            </p>
          </div>
          <div className="hero-highlight">
            <div className="hero-highlight__header">
              <div className="hero-highlight__title">
                <span className="hero-chip">Yield</span>
                <strong>Earn on Your Cash</strong>
              </div>
              <span className="muted" style={{ fontSize: 12 }}>
                Stablecoins, on-chain
              </span>
            </div>
            <p className="muted">
              Uninvested cash earns up to 10% yield via stablecoins.
            </p>
          </div>
        </div>
      </section>

      {/* Discover should feel like real “things to buy”, not chips */}
      <section className="card">
        <div className="section-title">
          <h2>Discover</h2>
          <span className="muted">Trending now</span>
        </div>

        <div className="discover-grid" role="list">
          {discoverAssets.map((item) => (
            <DiscoverCard key={item.symbol} item={item} onSelect={onAsset} />
          ))}
        </div>

        <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
          <button className="pill primary" type="button">
            Connect to invest
          </button>
          <button
            className="pill"
            type="button"
            onClick={() => onCategory?.("Stocks")}
          >
            Explore markets
          </button>
        </div>
      </section>

      <section className="card">
        <div className="section-title">
          <h2>Featured baskets</h2>
          <span className="muted">Equal-weight starter sets</span>
        </div>
        <div className="list-compact">
          {BASKETS.map((basket) => (
            <div key={basket.id} className="list-item">
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <BasketLogo basket={basket} size={46} />
                <div>
                  <strong>{basket.name}</strong>
                  <p className="muted" style={{ marginTop: 4 }}>
                    {basket.description}
                  </p>
                  <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                    {basket.items.length} assets • connect to buy
                  </p>
                </div>
              </div>
              <button className="pill primary compact" type="button">
                Preview
              </button>
            </div>
          ))}
        </div>
        <p className="muted" style={{ marginTop: 8 }}>
          Baskets split your amount equally across the assets above. Connect
          your wallet to proceed.
        </p>
      </section>

      {showModal && <LearnMoreModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
