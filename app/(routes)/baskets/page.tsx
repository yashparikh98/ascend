"use client";

import { useMemo, useState } from "react";
import { BASKETS, basketDisplayItems, type Basket } from "../../config/baskets";
import { BasketLogo } from "../../components/shared/BasketLogo";
import { formatMoney } from "../../lib/format/formatMoney";
import useCurrency from "../../hooks/useCurrency";
import { useTokenBalances } from "../../hooks/useTokenBalances";
import { useTokenPrices } from "../../hooks/useTokenPrice";
import BuyWidget from "../../components/buy/BuyWidget";
import OnrampWidget from "../../components/onramp/OnrampWidget";
import BasketWidget from "../../components/basket/BasketWidget";

const fxRate = 83;

function getBasketTags(b: any): string[] {
  return Array.isArray(b?.tags) ? b.tags : [];
}

export default function BasketsPage() {
  const { currency } = useCurrency();
  const { data: balances } = useTokenBalances();

  const [showBasket, setShowBasket] = useState(false);
  const [basketId, setBasketId] = useState<string>(BASKETS[0]?.id ?? "");
  const [showBuy, setShowBuy] = useState(false);
  const [showOnramp, setShowOnramp] = useState(false);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "mag7" | "ai" | "crypto">("all");

  const basketMints = useMemo(() => {
    const set = new Set<string>();
    BASKETS.forEach((b) => b.items.forEach((i) => set.add(i.mint)));
    return Array.from(set);
  }, []);

  const {
    data: prices,
    isFetching: pricesLoading,
    refetch,
  } = useTokenPrices(basketMints);

  const openBasket = (id: string) => {
    setBasketId(id);
    setShowBasket(true);
  };

  // Rough exposure: based on wallet holdings of the underlying assets
  const basketHoldings = useMemo(() => {
    if (!balances) return [];

    return BASKETS.map((basket) => {
      let valueUsd = 0;

      basket.items.forEach((item) => {
        const bal = balances[item.mint];
        const ui = bal?.uiAmount ?? 0;
        if (ui <= 0) return;

        const p = prices?.[item.mint];
        const priceUsd = typeof p === "number" && p > 0 ? p : 0;

        valueUsd += ui * priceUsd;
      });

      return { basket, valueUsd };
    }).filter((x) => x.valueUsd > 0);
  }, [balances, prices]);

  const totalUsd = useMemo(
    () => basketHoldings.reduce((sum, b) => sum + b.valueUsd, 0),
    [basketHoldings]
  );

  const totalDisplay = useMemo(
    () =>
      formatMoney({
        usdAmount: totalUsd,
        inrAmount: totalUsd * fxRate,
        currency,
        fxRate,
      }),
    [totalUsd, currency]
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();

    const bySearch = (b: Basket) => {
      if (!q) return true;
      const tags = getBasketTags(b).join(" ").toLowerCase();
      return (
        b.name.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) ||
        tags.includes(q)
      );
    };

    const byChip = (b: Basket) => {
      if (filter === "all") return true;
      if (filter === "mag7")
        return (
          b.id.toLowerCase().includes("mag7") ||
          b.name.toLowerCase().includes("mag")
        );
      if (filter === "ai")
        return (
          b.id.toLowerCase().includes("ai") ||
          b.name.toLowerCase().includes("ai")
        );
      if (filter === "crypto")
        return (
          b.id.toLowerCase().includes("crypto") ||
          b.name.toLowerCase().includes("crypto")
        );
      return true;
    };

    return BASKETS.filter((b) => bySearch(b as Basket) && byChip(b as Basket));
  }, [query, filter]);

  return (
    <div className="page">
      {/* HERO */}
      <section className="hero-card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          <div style={{ minWidth: 260, flex: 1 }}>
            <h1 style={{ marginBottom: 6 }}>Baskets</h1>
            <p className="muted" style={{ margin: 0 }}>
              One-tap bundles. We split your USDC and buy multiple assets for
              you.
            </p>

            <div style={{ marginTop: 14 }}>
              <p className="eyebrow" style={{ marginBottom: 6 }}>
                Portfolio (basket exposure)
              </p>
              <div className="balance">{totalDisplay.primaryText}</div>
              <p className="muted" style={{ marginTop: 6 }}>
                Based on assets in your wallet
                {pricesLoading ? " • pricing syncing…" : ""}
              </p>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gap: 10,
              justifyItems: "end",
              minWidth: 220,
            }}
          >
            <div className="action-row" style={{ width: "fit-content" }}>
              <button
                className="pill primary"
                onClick={() => setShowOnramp(true)}
                type="button"
              >
                Deposit
              </button>
              <button
                className="pill"
                onClick={() => openBasket(BASKETS[0]?.id ?? "")}
                type="button"
              >
                Buy basket
              </button>
            </div>

            <button
              className="pill compact"
              type="button"
              onClick={() => refetch?.()}
              style={{ justifySelf: "end" }}
            >
              Refresh
            </button>
          </div>
        </div>

        {/* SEARCH */}
        <div className="search" style={{ marginTop: 14 }}>
          <label htmlFor="basket-search">Search</label>
          <input
            id="basket-search"
            placeholder="Search MAG7, AI, crypto..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* FILTER CHIPS */}
        <div className="chip-row" style={{ marginTop: 10 }}>
          {[
            { key: "all", label: "All" },
            { key: "mag7", label: "MAG7" },
            { key: "ai", label: "AI" },
            { key: "crypto", label: "Crypto" },
          ].map((c) => (
            <button
              key={c.key}
              className={`chip${filter === (c.key as any) ? " is-active" : ""}`}
              type="button"
              onClick={() => setFilter(c.key as any)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      <section className="card">
        <div className="section-title">
          <h2>Featured baskets</h2>
          <span className="muted">Preview once, buy or DCA</span>
        </div>

        {filtered.length === 0 ? (
          <div className="info-card">
            <strong>No matches</strong>
            <p className="muted">Try a different keyword or filter.</p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 12,
            }}
          >
            {filtered.map((b) => {
              const basket = b as Basket;
              const items = basketDisplayItems(basket);

              return (
                <div
                  key={basket.id}
                  style={{
                    border: "1px solid var(--stroke)",
                    borderRadius: 14,
                    padding: 14,
                    display: "grid",
                    gap: 12,
                    height: "100%",
                    alignContent: "space-between",
                    background: "var(--card)",
                    boxShadow: "var(--shadow)",
                  }}
                >
                  {/* header */}
                  <div
                    style={{ display: "flex", gap: 12, alignItems: "center" }}
                  >
                    <BasketLogo basket={basket} size={44} />
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          justifyContent: "space-between",
                          gap: 10,
                        }}
                      >
                        <strong style={{ fontSize: 15 }}>{basket.name}</strong>
                        <span className="muted" style={{ fontSize: 12 }}>
                          {basket.items.length} assets
                        </span>
                      </div>
                      <p className="muted" style={{ marginTop: 6 }}>
                        {basket.description}
                      </p>
                    </div>
                  </div>

                  {/* chips */}
                  <div className="chip-row" style={{ alignItems: "center" }}>
                    {items.slice(0, 5).map((i) => (
                      <span key={i.mint} className="chip">
                        {i.symbol}
                      </span>
                    ))}
                    {items.length > 5 ? (
                      <span className="chip">+{items.length - 5}</span>
                    ) : null}
                  </div>

                  {/* footer */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      alignItems: "center",
                      marginTop: 2,
                    }}
                  >
                    <span className="muted" style={{ fontSize: 12 }}></span>
                    <div style={{ display: "flex", gap: 10 }}>
                      {/* <button
                        className="pill"
                        type="button"
                        onClick={() => openBasket(basket.id)}
                      >
                        Preview
                      </button> */}
                      <button
                        className="pill primary"
                        type="button"
                        onClick={() => openBasket(basket.id)}
                      >
                        Buy / DCA
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* EXPOSURE */}
      <section className="card soft">
        <div className="section-title">
          <h2>Your exposure</h2>
          <span className="muted">Value held via basket assets</span>
        </div>

        {basketHoldings.length === 0 ? (
          <div className="info-card">
            <strong>No basket exposure yet</strong>
            <p className="muted">Deposit USDC and buy your first basket.</p>
            <div className="hero-actions">
              <button
                className="pill primary"
                onClick={() => setShowOnramp(true)}
                type="button"
              >
                Deposit
              </button>
              <button
                className="pill"
                onClick={() => openBasket(BASKETS[0]?.id ?? "")}
                type="button"
              >
                Browse baskets
              </button>
            </div>
          </div>
        ) : (
          <div className="list-compact">
            {basketHoldings
              .slice()
              .sort((a, b) => b.valueUsd - a.valueUsd)
              .map((h) => {
                const display = formatMoney({
                  usdAmount: h.valueUsd,
                  inrAmount: h.valueUsd * fxRate,
                  currency,
                  fxRate,
                }).primaryText;

                return (
                  <div key={h.basket.id} className="list-item">
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <BasketLogo basket={h.basket} size={32} />
                      <div>
                        <strong>{h.basket.name}</strong>
                        <p className="muted">{h.basket.items.length} assets</p>
                      </div>
                    </div>

                    <div
                      style={{ display: "flex", gap: 10, alignItems: "center" }}
                    >
                      <strong>{display}</strong>
                      <button
                        className="pill compact"
                        type="button"
                        onClick={() => openBasket(h.basket.id)}
                      >
                        Buy more
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </section>

      <section className="info-card">
        <strong>Recurring buys</strong>
        <p className="muted">
          You can buy once or set recurring DCA inside any basket.
        </p>
      </section>

      {/* MODALS */}
      {showBasket && basketId && (
        <BasketWidget
          initialBasketId={basketId}
          onClose={() => setShowBasket(false)}
        />
      )}
      {showBuy && <BuyWidget onClose={() => setShowBuy(false)} />}
      {showOnramp && <OnrampWidget onClose={() => setShowOnramp(false)} />}
    </div>
  );
}
