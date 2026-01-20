"use client";

import { BASKETS, basketDisplayItems, Basket } from "../../config/baskets";
import { BasketLogo } from "../shared/BasketLogo";

export default function ExploreBaskets({
  onSelect,
}: {
  onSelect: (basketId: string) => void;
}) {
  return (
    <section className="card">
      <div className="section-title">
        <h2>Explore baskets</h2>
        <span className="muted">Equal-weight themes</span>
      </div>
      <div
        className="grid"
        style={{
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
        }}
      >
        {BASKETS.map((b) => {
          const items = basketDisplayItems(b as Basket);
          return (
            <div key={b.id} className="card soft" style={{ gap: 6 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <BasketLogo basket={b as Basket} size={38} />
                <div>
                  <strong>{b.name}</strong>
                  <p className="muted" style={{ fontSize: 12 }}>
                    {b.description}
                  </p>
                </div>
              </div>
              <div className="chip-row">
                {items.slice(0, 4).map((i) => (
                  <span key={i.mint} className="chip">
                    {i.symbol}
                  </span>
                ))}
              </div>
              <button
                className="pill primary compact"
                type="button"
                onClick={() => onSelect(b.id)}
              >
                Buy / DCA
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
