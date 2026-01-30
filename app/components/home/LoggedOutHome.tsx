import LearnMoreModal from "../shared/LearnMoreModal";
import { useCallback, useState } from "react";
import { BASKETS } from "../../config/baskets";
import { BasketLogo } from "../shared/BasketLogo";
import { DiscoverCard, DiscoverAsset } from "./DiscoverCard";
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

const discoverAssets: DiscoverAsset[] = [
  {
    symbol: "xSLV",
    name: "Silver",
    type: "Commodity",
    change: "+0.5%",
    timeframe: "Today",
    price: "$28.40",
    note: "Industrial metal",
    sparkline: [27.8, 27.9, 28, 28.1, 28.2, 28.3, 28.5, 28.4],
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

export default function LoggedOutHome({
  onPreview,
  onConnect,
  onCreateAccount,
  onCategory,
  onAsset,
}: Props) {
  const [showModal, setShowModal] = useState(false);
  const { setVisible } = useWalletModal();

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
            onClick={onCreateAccount ?? handleConnect}
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
            <ul className="dot-list">
              <li>Curated investment baskets</li>
              <li>Built for long-term exposure</li>
              <li>Simple, disciplined investing</li>
            </ul>
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
            <ul className="dot-list">
              <li>No lockups or cliffs</li>
              <li>Transparent, fully on-chain</li>
              <li>Move in or out anytime</li>
            </ul>
          </div>
        </div>

        {/* Make categories actionable + clearer than plain chips */}
        <div className="scroll-row" aria-label="Categories">
          {categories.map((cat) => (
            <button
              key={cat.key}
              className="chip"
              type="button"
              onClick={() => onCategory?.(cat.key)}
              aria-label={`Browse ${cat.key}`}
            >
              <span style={{ fontWeight: 600 }}>{cat.key}</span>
              <span className="muted" style={{ marginLeft: 8, fontSize: 12 }}>
                {cat.desc}
              </span>
            </button>
          ))}
        </div>

        {/* Trust chips: keep it short */}
        <div className="chip-row" aria-label="Trust">
          <span className="chip">Regulated partners</span>
          <span className="chip">INR onramp</span>
          <span className="chip">Transparent fees</span>
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
          <button
            className="pill primary"
            type="button"
            onClick={handleConnect}
          >
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
              <button
                className="pill primary compact"
                type="button"
                onClick={onPreview}
              >
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
