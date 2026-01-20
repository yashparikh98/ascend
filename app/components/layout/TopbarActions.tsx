"use client";

import { useState } from "react";
import CurrencyToggle from "../CurrencyToggle";
import UnifiedWallet from "../wallet/UnifiedWallet";

const links = [
  { href: "/", label: "Home" },
  { href: "/invest", label: "Invest" },
  { href: "/stocks", label: "Stocks" },
  { href: "/crypto", label: "Crypto" },
  { href: "/baskets", label: "Baskets" },
  { href: "/activity", label: "Activity" },
  { href: "/ai", label: "AI Advisor" }
];

export default function TopbarActions() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="topbar-actions">
      <div className="hamburger">
        <button
          className="icon-btn"
          type="button"
          aria-label="Toggle menu"
          onClick={() => setMenuOpen((v) => !v)}
        >
          ☰
        </button>
        {menuOpen && (
          <div className="popover">
            {links.map((link) => (
              <a key={link.href} className="desk-link" href={link.href}>
                {link.label}
              </a>
            ))}
          </div>
        )}
      </div>
      <CurrencyToggle />
      <UnifiedWallet />
    </div>
  );
}
