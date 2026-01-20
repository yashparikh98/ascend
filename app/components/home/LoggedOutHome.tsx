// import LearnMoreModal from "./shared/LearnMoreModal";
// import { useState } from "react";

// const categories = ["Stocks", "Crypto", "Indices", "Pre-IPO", "Commodities"];
// const trending = [
//   { name: "NVDAx", move: "+2.1%" },
//   { name: "MAG 7", move: "+0.9%" },
//   { name: "Gold", move: "+0.3%" }
// ];

// export default function LoggedOutHome({ onPreview }: { onPreview: () => void }) {
//   const [showModal, setShowModal] = useState(false);

//   return (
//     <div className="page">
//       <section className="hero-card">
//         <h1>Buy US Stocks, Crypto, and Indices.</h1>
//         <p>Start in INR. Transparent fees. Simple experience.</p>
//         <div className="hero-actions">
//           <button className="pill primary">Connect wallet</button>
//           <button className="pill">Create account</button>
//         </div>
//         <div className="scroll-row" aria-label="Categories">
//           {categories.map((cat) => (
//             <span key={cat} className="chip">
//               {cat}
//             </span>
//           ))}
//         </div>
//         <div className="chip-row">
//           <span className="chip">Regulated partners</span>
//           <span className="chip">INR onramp</span>
//           <span className="chip">Transparent fees</span>
//         </div>
//         <button className="pill" onClick={() => setShowModal(true)} type="button">
//           Learn more
//         </button>
//         <button className="pill" onClick={onPreview} type="button">
//           Preview dashboard
//         </button>
//       </section>

//       <section className="card">
//         <div className="section-title">
//           <h2>Discover</h2>
//           <span>Trending movers</span>
//         </div>
//         <div className="chip-row">
//           {trending.map((item) => (
//             <span key={item.name} className="chip">
//               {item.name} {item.move}
//             </span>
//           ))}
//         </div>
//       </section>

//       {showModal && <LearnMoreModal onClose={() => setShowModal(false)} />}
//     </div>
//   );
// }
import LearnMoreModal from "../shared/LearnMoreModal";
import { useMemo, useState } from "react";
import { BASKETS } from "../../config/baskets";
import { AssetLogo } from "../shared/AssetLogo";
import { BasketLogo } from "../shared/BasketLogo";
import { getAssetBySymbol } from "../../config/assets";

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

const trending = [
  { symbol: "NVDAx", type: "Stock", move: "+2.1%" },
  { symbol: "BTC", type: "Crypto", move: "-0.4%" },
  { symbol: "MAG 7", type: "Index", move: "+0.9%" },
  { symbol: "Gold", type: "Commodity", move: "+0.3%" },
];

export default function LoggedOutHome({
  onPreview,
  onConnect,
  onCreateAccount,
  onCategory,
  onAsset,
}: Props) {
  const [showModal, setShowModal] = useState(false);

  const topTrending = useMemo(() => trending.slice(0, 4), []);

  return (
    <div className="page">
      <section className="hero-card">
        <h1>Buy US Stocks, Crypto, and Indices.</h1>
        <p className="muted">
          Start in INR. Transparent fees. Simple experience.
        </p>

        {/* Single primary action + a clear secondary */}
        <div className="hero-actions">
          <button className="pill primary" onClick={onConnect} type="button">
            Connect wallet
          </button>

          <button className="pill" onClick={onCreateAccount} type="button">
            Create account
          </button>
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

        {/* Put 'Learn more' as a subtle link-like button */}
        <div className="hero-actions" style={{ gap: 10 }}>
          <button
            className="pill"
            onClick={() => setShowModal(true)}
            type="button"
          >
            Learn more
          </button>

          {/* Make preview subtle so it doesn’t compete with onboarding */}
          <button className="pill" onClick={onPreview} type="button">
            Preview dashboard
          </button>
        </div>
      </section>

      {/* Discover should feel like real “things to buy”, not chips */}
      <section className="card">
        <div className="section-title">
          <h2>Discover</h2>
          <span className="muted">Trending today</span>
        </div>

        <div className="list-compact" role="list">
          {topTrending.map((item) => {
            const asset = getAssetBySymbol(item.symbol);
            const color = item.move.trim().startsWith("-")
              ? "#c7393a"
              : "#0f8f6a";
            return (
              <div key={item.symbol} className="list-item" role="listitem">
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <AssetLogo
                    src={asset?.logoURI}
                    alt={asset?.symbol}
                    size={28}
                  />
                  <div>
                    <strong>{item.symbol}</strong>
                    <div className="muted" style={{ fontSize: 12 }}>
                      {item.type}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span className="muted" style={{ color }}>
                    {item.move}
                  </span>
                  <button
                    className="pill"
                    type="button"
                    onClick={() => onAsset?.(item.symbol)}
                  >
                    View
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
          <button className="pill primary" type="button" onClick={onConnect}>
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
