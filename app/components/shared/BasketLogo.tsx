"use client";

import { useMemo } from "react";
// import { Basket } from "../config/baskets";
// import { getAssetByMint } from "../config/assets";
import { AssetLogo } from "./AssetLogo";
import { Basket } from "../../config/baskets";
import { getAssetByMint } from "../../config/assets";

function pickTopMints(basket: Basket, max = 4) {
  return [...basket.items]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, max)
    .map((i) => i.mint);
}

export function BasketLogo({
  basket,
  size = 44,
}: {
  basket: Basket;
  size?: number;
}) {
  const mints = useMemo(() => pickTopMints(basket, 4), [basket]);
  const assets = mints
    .map((m) => getAssetByMint(m))
    .filter((a): a is NonNullable<typeof a> => Boolean(a));

  const positions = [
    { top: 2, left: 2 },
    { top: 2, left: 18 },
    { top: 18, left: 2 },
    { top: 18, left: 18 },
  ];

  const inner = Math.floor(size * 0.52);

  return (
    <div
      aria-label={`${basket.name} logo`}
      style={{
        width: size,
        height: size,
        borderRadius: 16,
        position: "relative",
        background: "linear-gradient(180deg, #ffffff, #f3f1ed)",
        border: "1px solid rgba(0,0,0,0.06)",
        boxShadow: "0 6px 16px rgba(0,0,0,0.06)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: -40,
          background:
            "radial-gradient(circle at 30% 20%, rgba(15,107,91,0.12), transparent 55%)",
        }}
      />

      {assets.slice(0, 4).map((asset, idx) => (
        <div
          key={asset.mint}
          style={{
            position: "absolute",
            top: positions[idx].top,
            left: positions[idx].left,
            width: inner,
            height: inner,
            borderRadius: 9999,
            background: "#fff",
            border: "1px solid rgba(0,0,0,0.08)",
            boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
            display: "grid",
            placeItems: "center",
          }}
        >
          <AssetLogo
            src={asset.logoURI}
            alt={asset.symbol}
            size={Math.floor(inner * 0.72)}
          />
        </div>
      ))}
    </div>
  );
}
