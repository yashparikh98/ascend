"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/stocks", label: "Stocks" },
  { href: "/crypto", label: "Crypto" },
  { href: "/pre-ipo", label: "Pre-IPO" },
  { href: "/commodities", label: "Commodities" },
  { href: "/indices", label: "Indices" },
  { href: "/cash", label: "Cash" }
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <footer className="mobile-nav">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`mobile-link${isActive ? " active" : ""}`}
          >
            <span className="nav-icon" aria-hidden="true" />
            <span className="nav-label">{item.label}</span>
          </Link>
        );
      })}
    </footer>
  );
}
