"use client";

import Link from "next/link";

type NavLink = { href: string; label: string };

export default function NavMenu({ links }: { links: NavLink[] }) {
  return (
    <nav className="desk-nav">
      {links.map((item) => (
        <Link key={item.href} href={item.href} className="desk-link">
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
