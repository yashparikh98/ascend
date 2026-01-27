"use client";

import NavMenu from "./NavMenu";
import useAuth from "../../hooks/useAuth";

type NavLink = { href: string; label: string };

export default function NavMenuWhenAuthed({ links }: { links: NavLink[] }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;
  return <NavMenu links={links} />;
}
