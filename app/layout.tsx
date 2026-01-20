import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";
import "@solana/wallet-adapter-react-ui/styles.css";
import BottomNav from "./components/BottomNav";
import Topbar from "./components/layout/Topbar";
import NavMenu from "./components/layout/NavMenu";
import Providers from "./providers";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-fraunces",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: "Ascend | Global investing, simplified",
  description: "Retail neobank for tokenized US stocks on Solana",
};

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/stocks", label: "Stocks" },
  { href: "/crypto", label: "Crypto" },
  { href: "/pre-ipo", label: "Pre-IPO" },
  { href: "/commodities", label: "Commodities" },
  { href: "/baskets", label: "Baskets" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${manrope.variable}`}>
      <body>
        <Providers>
          <div className="ambient" aria-hidden="true" />
          <div className="app-shell">
            <div className="app-frame">
              <Topbar />
              <NavMenu links={navLinks} />

              <main className="page">{children}</main>
            </div>

            {/* <BottomNav /> */}
          </div>
        </Providers>
      </body>
    </html>
  );
}
