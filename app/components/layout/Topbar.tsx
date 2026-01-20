"use client";

import TopbarActions from "./TopbarActions";

export default function Topbar() {
  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          a
        </span>
        <div>
          <p className="brand-name">ascend</p>
          <p className="brand-sub">Retail neobank - Solana</p>
        </div>
      </div>
      <TopbarActions />
    </header>
  );
}
